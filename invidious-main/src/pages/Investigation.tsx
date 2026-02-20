import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Download,
  BarChart2,
  AlertTriangle,
  Activity,
  Clock,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap,
  ZapOff,
  Monitor,
} from "lucide-react";
import { parseCSV, runDetection } from "@/lib/detectionEngine";
import type { Transaction, DetectionResult, ParseError } from "@/lib/detectionEngine";
import GraphVisualization, { type GraphViewMode } from "@/components/GraphVisualization";
import FraudRingTable from "@/components/FraudRingTable";

type Status = "idle" | "uploading" | "processing" | "done" | "error";

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("rift-settings") || "{}");
  } catch {
    return {};
  }
}

function isDarkMode() {
  return document.documentElement.classList.contains("light-mode") === false;
}

export default function Investigation() {
  const [status, setStatus] = useState<Status>("idle");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [showAccounts, setShowAccounts] = useState(true);
  const [graphKey, setGraphKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Graph control state — read from localStorage for persistence
  const [viewMode, setViewMode] = useState<GraphViewMode>(() => {
    const s = loadSettings();
    return (s.graphViewMode as GraphViewMode) || "detailed";
  });

  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    const s = loadSettings();
    return s.graphAnimations !== false;
  });

  // Track dark/light theme reactively
  const [darkTheme, setDarkTheme] = useState(isDarkMode);

  useEffect(() => {
    // Watch for class changes on <html> to detect theme switches
    const observer = new MutationObserver(() => {
      setDarkTheme(isDarkMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Persist viewMode changes immediately
  const handleViewMode = (mode: GraphViewMode) => {
    setViewMode(mode);
    const s = loadSettings();
    localStorage.setItem("rift-settings", JSON.stringify({ ...s, graphViewMode: mode }));
  };

  // Persist animation toggle immediately
  const handleAnimationToggle = () => {
    setAnimationsEnabled((prev) => {
      const next = !prev;
      const s = loadSettings();
      localStorage.setItem(
        "rift-settings",
        JSON.stringify({ ...s, graphAnimations: next })
      );
      return next;
    });
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setStatus("error");
      setParseErrors([{ row: 0, message: "File must be a .csv file." }]);
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setResult(null);
    setParseErrors([]);

    const text = await file.text();
    const { transactions: txs, errors } = parseCSV(text);

    if (errors.length > 0) {
      setParseErrors(errors);
      setStatus("error");
      return;
    }

    if (txs.length === 0) {
      setParseErrors([{ row: 0, message: "No valid transaction rows found in CSV." }]);
      setStatus("error");
      return;
    }

    setTransactions(txs);
    setStatus("processing");

    setTimeout(async () => {
      try {
        const detectionResult = await runDetection(txs);
        setResult(detectionResult);
        setGraphKey((k) => k + 1);
        setStatus("done");
      } catch (err) {
        setParseErrors([{ row: 0, message: `Detection error: ${String(err)}` }]);
        setStatus("error");
      }
    }, 50);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rift-detection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStatus("idle");
    setTransactions([]);
    setResult(null);
    setParseErrors([]);
    setFileName("");
  };

  const VIEW_MODES: { key: GraphViewMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: "simple",
      label: "Simple",
      icon: <Eye className="w-3.5 h-3.5" />,
      desc: "Clean minimal overview",
    },
    {
      key: "detailed",
      label: "Detailed",
      icon: <Monitor className="w-3.5 h-3.5" />,
      desc: "Advanced forensic mode",
    },
    {
      key: "auto",
      label: "Auto",
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: "Adapts to theme",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Sticky header bar */}
      <div className="border-b border-border bg-panel/80 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyber" />
            <span className="font-mono font-bold text-sm text-foreground">
              INVESTIGATION WORKSPACE
            </span>
            {status === "done" && (
              <span className="badge-normal px-2 py-0.5 rounded text-xs font-mono">
                ANALYSIS COMPLETE
              </span>
            )}
            {status === "processing" && (
              <span className="badge-cyber px-2 py-0.5 rounded text-xs font-mono animate-pulse">
                PROCESSING…
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={downloadJSON}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyber/10 border border-cyber/30 text-cyber rounded font-mono text-xs hover:bg-cyber/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            )}
            {status !== "idle" && (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border text-muted-foreground rounded font-mono text-xs hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload Section */}
        {status === "idle" && (
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? "border-cyber bg-cyber/5 shadow-glow-cyan"
                  : "border-border hover:border-cyber/50 hover:bg-secondary/20"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <Upload
                className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                  isDragging ? "text-cyber" : "text-muted-foreground"
                }`}
              />
              <p className="font-mono font-bold text-foreground mb-2">
                {isDragging ? "Drop to analyze" : "Upload Transaction CSV"}
              </p>
              <p className="text-sm text-muted-foreground font-mono mb-4">
                Drag & drop or click to browse
              </p>
              <div className="text-xs font-mono text-muted-foreground/60 space-y-1">
                <p>
                  Required columns:{" "}
                  <span className="text-cyber">
                    transaction_id, sender_id, receiver_id, amount, timestamp
                  </span>
                </p>
                <p>
                  Timestamp format:{" "}
                  <span className="text-cyber">YYYY-MM-DD HH:MM:SS</span>
                </p>
              </div>
            </div>

            {/* Sample CSV */}
            <div className="mt-4 forensics-panel p-4">
              <p className="text-xs font-mono text-muted-foreground mb-2 text-cyber">
                SAMPLE CSV FORMAT:
              </p>
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
{`transaction_id,sender_id,receiver_id,amount,timestamp
TXN_001,ACC_001,ACC_002,500.00,2024-01-15 09:30:00
TXN_002,ACC_002,ACC_003,480.00,2024-01-15 10:15:00
TXN_003,ACC_003,ACC_001,460.00,2024-01-15 11:00:00`}
              </pre>
            </div>
          </div>
        )}

        {/* Processing */}
        {(status === "uploading" || status === "processing") && (
          <div className="forensics-panel p-12 text-center mb-6">
            <div className="w-12 h-12 border-2 border-cyber border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono font-bold text-foreground mb-1">
              {status === "uploading" ? "Parsing CSV Data…" : "Running Detection Engine…"}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {status === "processing"
                ? `Analyzing ${transactions.length.toLocaleString()} transactions`
                : fileName}
            </p>
          </div>
        )}

        {/* Errors */}
        {status === "error" && parseErrors.length > 0 && (
          <div className="forensics-panel glow-border-red p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-suspicious" />
              <span className="font-mono font-bold text-suspicious">CSV VALIDATION ERRORS</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {parseErrors.map((err, i) => (
                <div
                  key={i}
                  className="text-xs font-mono text-suspicious/80 bg-suspicious/5 border border-suspicious/20 rounded px-3 py-2"
                >
                  {err.message}
                </div>
              ))}
            </div>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-secondary border border-border text-muted-foreground rounded font-mono text-xs hover:text-foreground transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {status === "done" && result && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <Activity className="w-5 h-5 text-cyber" />,
                  val: result.summary.total_accounts_analyzed.toLocaleString(),
                  label: "Accounts Analyzed",
                  cls: "text-cyber",
                },
                {
                  icon: <AlertTriangle className="w-5 h-5 text-suspicious" />,
                  val: result.summary.suspicious_accounts_flagged,
                  label: "Suspicious Accounts",
                  cls: "text-suspicious",
                },
                {
                  icon: <BarChart2 className="w-5 h-5 text-fraud-ring" />,
                  val: result.summary.fraud_rings_detected,
                  label: "Fraud Rings",
                  cls: "text-fraud-ring",
                },
                {
                  icon: <Clock className="w-5 h-5 text-muted-foreground" />,
                  val: `${result.summary.processing_time_seconds}s`,
                  label: "Processing Time",
                  cls: "text-foreground",
                },
              ].map((s) => (
                <div key={s.label} className="forensics-panel p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {s.icon}
                    <span className="text-xs font-mono text-muted-foreground">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-mono font-bold ${s.cls}`}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* ── Graph Panel ─────────────────────────────────────────────── */}
            <div
              className="forensics-panel glow-border-cyan overflow-hidden"
              style={{ height: "560px" }}
            >
              {/* Graph header + controls */}
              <div className="border-b border-border px-4 py-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 mr-2">
                  <span className="w-2 h-2 rounded-full bg-cyber animate-pulse" />
                  <span className="font-mono text-xs text-muted-foreground tracking-widest">
                    TRANSACTION GRAPH
                  </span>
                  <span className="text-xs font-mono text-muted-foreground/60">
                    {transactions.length.toLocaleString()} tx
                  </span>
                </div>

                {/* View Mode Buttons */}
                <div className="flex items-center gap-1 ml-auto">
                  {VIEW_MODES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => handleViewMode(m.key)}
                      title={m.desc}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs transition-all duration-200 ${
                        viewMode === m.key
                          ? "bg-cyber/20 border border-cyber/60 text-cyber"
                          : "bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Animation Toggle */}
                <button
                  onClick={handleAnimationToggle}
                  title={animationsEnabled ? "Disable animations" : "Enable animations"}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs border transition-all duration-200 ${
                    animationsEnabled
                      ? "bg-normal/10 border-normal/40 text-normal"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {animationsEnabled ? (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Anim ON
                    </>
                  ) : (
                    <>
                      <ZapOff className="w-3.5 h-3.5" />
                      Anim OFF
                    </>
                  )}
                </button>
              </div>

              {/* Mode description strip */}
              <div className="px-4 py-1.5 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground/70">
                  {viewMode === "simple" && "Simple View — Clean financial overview, hover for account details"}
                  {viewMode === "detailed" && "Detailed View — Full forensic mode with glow, edge types, score labels & click-to-highlight"}
                  {viewMode === "auto" && `Auto Mode — Adapting to ${darkTheme ? "Dark" : "Light"} theme (${darkTheme ? "Detailed" : "Simple"} style active)`}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {viewMode === "detailed" || (viewMode === "auto" && darkTheme)
                    ? "■ Cycle  ┄ Smurfing  ╌ Shell"
                    : ""}
                </span>
              </div>

              <div style={{ height: "calc(100% - 80px)" }}>
                <GraphVisualization
                  key={graphKey}
                  transactions={transactions}
                  suspiciousAccounts={result.suspicious_accounts}
                  animationsEnabled={animationsEnabled}
                  viewMode={viewMode}
                  isDarkTheme={darkTheme}
                />
              </div>
            </div>

            {/* Fraud Ring Table */}
            <div className="forensics-panel">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fraud-ring" />
                <span className="font-mono text-xs text-muted-foreground tracking-widest">
                  FRAUD RING SUMMARY
                </span>
                <span className="ml-auto badge-fraud-ring px-2 py-0.5 rounded text-xs font-mono">
                  {result.fraud_rings.length} rings
                </span>
              </div>
              <FraudRingTable
                fraudRings={result.fraud_rings}
                suspiciousAccounts={result.suspicious_accounts}
              />
            </div>

            {/* Suspicious Accounts */}
            <div className="forensics-panel">
              <div
                className="border-b border-border px-4 py-3 flex items-center gap-2 cursor-pointer"
                onClick={() => setShowAccounts(!showAccounts)}
              >
                <span className="w-2 h-2 rounded-full bg-suspicious animate-pulse-red" />
                <span className="font-mono text-xs text-muted-foreground tracking-widest">
                  SUSPICIOUS ACCOUNTS (SORTED BY SCORE)
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="badge-suspicious px-2 py-0.5 rounded text-xs font-mono">
                    {result.suspicious_accounts.length} flagged
                  </span>
                  {showAccounts ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </span>
              </div>
              {showAccounts && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-4 text-muted-foreground text-xs tracking-widest uppercase">
                          Account ID
                        </th>
                        <th className="text-left py-2 px-4 text-muted-foreground text-xs tracking-widest uppercase">
                          Suspicion Score
                        </th>
                        <th className="text-left py-2 px-4 text-muted-foreground text-xs tracking-widest uppercase">
                          Ring
                        </th>
                        <th className="text-left py-2 px-4 text-muted-foreground text-xs tracking-widest uppercase">
                          Detected Patterns
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.suspicious_accounts.slice(0, 50).map((acc) => (
                        <tr
                          key={acc.account_id}
                          className="border-b border-border/40 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="py-2 px-4 text-xs font-mono text-foreground">
                            {acc.account_id}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold text-xs ${
                                  acc.suspicion_score >= 70
                                    ? "text-suspicious"
                                    : acc.suspicion_score >= 40
                                    ? "text-fraud-ring"
                                    : "text-normal"
                                }`}
                              >
                                {acc.suspicion_score.toFixed(1)}
                              </span>
                              <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    acc.suspicion_score >= 70
                                      ? "bg-suspicious"
                                      : acc.suspicion_score >= 40
                                      ? "bg-fraud-ring"
                                      : "bg-normal"
                                  }`}
                                  style={{ width: `${acc.suspicion_score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            {acc.ring_id ? (
                              <span className="badge-cyber px-2 py-0.5 rounded text-xs">
                                {acc.ring_id}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-xs text-muted-foreground max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {acc.detected_patterns.map((p) => (
                                <span
                                  key={p}
                                  className="badge-suspicious px-1.5 py-0.5 rounded text-[10px]"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.suspicious_accounts.length > 50 && (
                    <p className="text-xs font-mono text-muted-foreground px-4 py-3">
                      Showing top 50 of {result.suspicious_accounts.length} flagged accounts.
                      Download JSON for full data.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* JSON Preview */}
            <div className="forensics-panel">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-normal" />
                  <span className="font-mono text-xs text-muted-foreground tracking-widest">
                    JSON OUTPUT PREVIEW
                  </span>
                </div>
                <button
                  onClick={downloadJSON}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyber/10 border border-cyber/30 text-cyber rounded font-mono text-xs hover:bg-cyber/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download Full JSON
                </button>
              </div>
              <pre className="text-xs font-mono text-muted-foreground p-4 overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(
                  {
                    suspicious_accounts: result.suspicious_accounts.slice(0, 3),
                    fraud_rings: result.fraud_rings.slice(0, 2),
                    summary: result.summary,
                  },
                  null,
                  2
                )}
                {(result.suspicious_accounts.length > 3 ||
                  result.fraud_rings.length > 2) &&
                  "\n  // … truncated for preview"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
