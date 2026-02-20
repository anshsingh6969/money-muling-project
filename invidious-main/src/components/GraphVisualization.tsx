import { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import type { Transaction, SuspiciousAccount } from "@/lib/detectionEngine";

export type GraphViewMode = "simple" | "detailed" | "auto";

interface Props {
  transactions: Transaction[];
  suspiciousAccounts: SuspiciousAccount[];
  animationsEnabled?: boolean;
  viewMode?: GraphViewMode;
  isDarkTheme?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAccountMap(suspiciousAccounts: SuspiciousAccount[]) {
  const map = new Map<string, SuspiciousAccount>();
  for (const acc of suspiciousAccounts) map.set(acc.account_id, acc);
  return map;
}

function getNodeColors(score: number): { bg: string; border: string } {
  if (score >= 60) return { bg: "#dc2626", border: "#ef4444" };
  if (score >= 30) return { bg: "#ea580c", border: "#f97316" };
  return { bg: "#16a34a", border: "#22c55e" };
}

function getEdgeType(
  sourceAcc: SuspiciousAccount | undefined
): "cycle" | "smurfing" | "shell" | "normal" {
  if (!sourceAcc) return "normal";
  const patterns = sourceAcc.detected_patterns ?? [];
  if (patterns.some((p) => p.includes("cycle"))) return "cycle";
  if (patterns.some((p) => p.includes("fan"))) return "smurfing";
  if (patterns.some((p) => p.includes("shell"))) return "shell";
  return "normal";
}

// ─── Style builders ────────────────────────────────────────────────────────────
// We use `any[]` to bypass the strict cytoscape stylesheet typings while still
// passing valid cytoscape style objects at runtime.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStylesheet(mode: GraphViewMode, dark: boolean): any[] {
  const edgeColor = dark ? "#334155" : "#94a3b8";
  const labelColor = dark ? "#e2e8f0" : "#1e293b";
  const selectedEdge = "#00e5ff";
  const textBg = dark ? "#0f172a" : "#f8fafc";

  if (mode === "simple") {
    return [
      {
        selector: "node",
        style: {
          "background-color": "data(bg)",
          "border-color": "data(border)",
          "border-width": 1.5,
          width: 22,
          height: 22,
          label: "",
          "font-size": "9px",
          "font-family": "JetBrains Mono, monospace",
          "text-valign": "bottom",
          "text-halign": "center",
          "text-margin-y": 4,
          color: labelColor,
          "min-zoomed-font-size": 8,
        },
      },
      {
        selector: "node:selected",
        style: { "border-width": 2.5, "border-color": "#00e5ff" },
      },
      {
        selector: "node.hovered",
        style: { label: "data(label)", "border-width": 2.5, "border-color": "#00e5ff" },
      },
      {
        selector: "edge",
        style: {
          width: 1.5,
          "line-color": edgeColor,
          "target-arrow-color": edgeColor,
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          opacity: 0.6,
          label: "",
        },
      },
      {
        selector: "edge:selected",
        style: { "line-color": selectedEdge, "target-arrow-color": selectedEdge, opacity: 1 },
      },
    ];
  }

  // Detailed / Auto-dark
  return [
    {
      selector: "node",
      style: {
        "background-color": "data(bg)",
        "border-color": "data(border)",
        "border-width": "data(borderWidth)",
        width: "data(size)",
        height: "data(size)",
        label: "data(scoreLabel)",
        color: labelColor,
        "font-size": "8px",
        "font-family": "JetBrains Mono, monospace",
        "text-valign": "center",
        "text-halign": "center",
        "min-zoomed-font-size": 7,
      },
    },
    // High suspicion glow
    {
      selector: "node[score >= 60]",
      style: {
        "border-width": 3,
        "border-color": "#ef4444",
        "background-color": "#dc2626",
        "shadow-blur": 20,
        "shadow-color": "#ef4444",
        "shadow-opacity": 0.6,
        "shadow-offset-x": 0,
        "shadow-offset-y": 0,
      },
    },
    // Medium suspicion glow
    {
      selector: "node[score >= 30][score < 60]",
      style: {
        "border-width": 2.5,
        "border-color": "#f97316",
        "background-color": "#ea580c",
        "shadow-blur": 14,
        "shadow-color": "#f97316",
        "shadow-opacity": 0.5,
        "shadow-offset-x": 0,
        "shadow-offset-y": 0,
      },
    },
    { selector: "node:selected", style: { "border-width": 4, "border-color": "#00e5ff" } },
    { selector: "node.faded", style: { opacity: 0.12 } },
    { selector: "node.highlighted", style: { "border-color": "#00e5ff", "border-width": 3, opacity: 1 } },
    // Normal edges
    {
      selector: "edge[edgeType = 'normal']",
      style: {
        width: "data(edgeWidth)",
        "line-color": edgeColor,
        "target-arrow-color": edgeColor,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        opacity: 0.7,
        label: "data(label)",
        color: "#64748b",
        "font-size": "8px",
        "font-family": "JetBrains Mono, monospace",
        "text-background-color": textBg,
        "text-background-opacity": 0.8,
        "text-background-padding": "2px",
      },
    },
    // Cycle edges – bold solid red
    {
      selector: "edge[edgeType = 'cycle']",
      style: {
        width: "data(edgeWidth)",
        "line-color": "#dc2626",
        "target-arrow-color": "#dc2626",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "line-style": "solid",
        opacity: 0.85,
        label: "data(label)",
        color: "#ef4444",
        "font-size": "8px",
        "font-family": "JetBrains Mono, monospace",
        "text-background-color": textBg,
        "text-background-opacity": 0.8,
        "text-background-padding": "2px",
      },
    },
    // Smurfing edges – dotted orange
    {
      selector: "edge[edgeType = 'smurfing']",
      style: {
        width: "data(edgeWidth)",
        "line-color": "#f97316",
        "target-arrow-color": "#f97316",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "line-style": "dotted",
        opacity: 0.8,
        label: "data(label)",
        color: "#f97316",
        "font-size": "8px",
        "font-family": "JetBrains Mono, monospace",
      },
    },
    // Shell chain edges – dashed purple
    {
      selector: "edge[edgeType = 'shell']",
      style: {
        width: "data(edgeWidth)",
        "line-color": "#a78bfa",
        "target-arrow-color": "#a78bfa",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "line-style": "dashed",
        opacity: 0.75,
        label: "data(label)",
        color: "#a78bfa",
        "font-size": "8px",
        "font-family": "JetBrains Mono, monospace",
      },
    },
    {
      selector: "edge:selected",
      style: { "line-color": selectedEdge, "target-arrow-color": selectedEdge, opacity: 1 },
    },
    { selector: "edge.faded", style: { opacity: 0.06 } },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GraphVisualization({
  transactions,
  suspiciousAccounts,
  animationsEnabled = true,
  viewMode = "detailed",
  isDarkTheme = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Keep refs in sync for use inside closures without triggering re-effects
  const modeRef = useRef(viewMode);
  const darkRef = useRef(isDarkTheme);
  modeRef.current = viewMode;
  darkRef.current = isDarkTheme;

  // Resolve the actual display mode (auto collapses to simple/detailed based on theme)
  const resolveMode = useCallback(
    (m: GraphViewMode, dark: boolean): "simple" | "detailed" =>
      m === "auto" ? (dark ? "detailed" : "simple") : m,
    []
  );

  // Apply styles to existing cy instance without a full rebuild
  const applyStyles = useCallback(() => {
    if (!cyRef.current) return;
    const resolved = resolveMode(modeRef.current, darkRef.current);
    cyRef.current.style(buildStylesheet(resolved, darkRef.current));
  }, [resolveMode]);

  // ── Main effect: build graph when data changes ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || transactions.length === 0) return;

    const accMap = buildAccountMap(suspiciousAccounts);

    // Build aggregated edges
    const edgeMap = new Map<
      string,
      { source: string; target: string; weight: number; amount: number; edgeType: string }
    >();
    const nodeSet = new Set<string>();
    const limitedTx = transactions.slice(0, 2000);

    for (const tx of limitedTx) {
      nodeSet.add(tx.sender_id);
      nodeSet.add(tx.receiver_id);
      const key = `${tx.sender_id}→${tx.receiver_id}`;
      if (edgeMap.has(key)) {
        const e = edgeMap.get(key)!;
        e.weight++;
        e.amount += tx.amount;
      } else {
        edgeMap.set(key, {
          source: tx.sender_id,
          target: tx.receiver_id,
          weight: 1,
          amount: tx.amount,
          edgeType: getEdgeType(accMap.get(tx.sender_id)),
        });
      }
    }

    const maxWeight = Math.max(...[...edgeMap.values()].map((e) => e.weight), 1);

    const nodes: cytoscape.NodeDefinition[] = [...nodeSet].map((id) => {
      const acc = accMap.get(id);
      const score = acc?.suspicion_score ?? 0;
      const { bg, border } = getNodeColors(score);
      const size = score > 60 ? 44 : score > 30 ? 34 : 24;

      return {
        data: {
          id,
          label: id.length > 10 ? id.slice(0, 10) + "…" : id,
          fullId: id,
          score,
          patterns: acc?.detected_patterns?.join(", ") || "None",
          ringId: acc?.ring_id || "—",
          totalTx: transactions.filter(
            (t) => t.sender_id === id || t.receiver_id === id
          ).length,
          bg,
          border,
          borderWidth: score > 60 ? 3 : score > 30 ? 2.5 : 1.5,
          size,
          scoreLabel: score > 0 ? `${Math.round(score)}` : "",
        },
      };
    });

    const edges: cytoscape.EdgeDefinition[] = [...edgeMap.values()].map((e, i) => ({
      data: {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        weight: e.weight,
        amount: e.amount.toFixed(2),
        label: e.weight > 1 ? `×${e.weight}` : "",
        edgeType: e.edgeType,
        edgeWidth: Math.max(1, Math.min(5, 1.5 + (e.weight / maxWeight) * 3)),
      },
    }));

    // Destroy previous
    if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; }
    if (tooltipRef.current) { tooltipRef.current.remove(); tooltipRef.current = null; }

    const shouldAnimate = animationsEnabled && nodes.length < 200 && edges.length < 5000;
    const resolved = resolveMode(viewMode, isDarkTheme);

    const cy = cytoscape({
      container: containerRef.current,
      elements: { nodes, edges },
      style: buildStylesheet(resolved, isDarkTheme),
      layout: {
        name: "cose",
        animate: shouldAnimate,
        animationDuration: 700,
        // @ts-ignore
        nodeRepulsion: 8000,
        idealEdgeLength: 80,
        edgeElasticity: 0.45,
        nestingFactor: 1.2,
        gravity: 0.25,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        randomize: true,
      } as cytoscape.LayoutOptions,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      minZoom: 0.1,
      maxZoom: 5,
    });

    // ── Tooltip ─────────────────────────────────────────────────────────────
    const tooltip = document.createElement("div");
    tooltip.style.cssText = `
      position:fixed;background:rgba(15,23,42,0.97);border:1px solid rgba(0,229,255,0.3);
      color:#e2e8f0;padding:10px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;
      font-size:12px;pointer-events:none;z-index:9999;display:none;max-width:280px;
      line-height:1.7;box-shadow:0 0 20px rgba(0,229,255,0.15);
    `;
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    // Node hover
    cy.on("mouseover", "node", (e) => {
      const d = e.target.data();
      const isSimple = resolveMode(modeRef.current, darkRef.current) === "simple";

      if (isSimple) {
        e.target.addClass("hovered");
        tooltip.innerHTML = `
          <div style="color:#00e5ff;font-weight:700;">${d.fullId}</div>
          <div style="color:#94a3b8;font-size:10px;">Transactions: ${d.totalTx}</div>
        `;
      } else {
        tooltip.innerHTML = `
          <div style="color:#00e5ff;font-weight:700;margin-bottom:5px;border-bottom:1px solid rgba(0,229,255,0.25);padding-bottom:4px;">${d.fullId}</div>
          <div>Transactions: <span style="color:#e2e8f0">${d.totalTx}</span></div>
          <div>Suspicion Score: <span style="color:${d.score >= 60 ? "#ef4444" : d.score >= 30 ? "#f97316" : "#22c55e"};font-weight:700">${d.score}</span></div>
          <div>Ring: <span style="color:#94a3b8">${d.ringId}</span></div>
          <div style="margin-top:3px;">Patterns: <span style="color:#94a3b8;font-size:10px">${d.patterns || "None"}</span></div>
        `;
      }
      tooltip.style.display = "block";
    });

    cy.on("mousemove", "node", (e) => {
      const ev = e.originalEvent as MouseEvent;
      tooltip.style.left = `${ev.clientX + 16}px`;
      tooltip.style.top = `${ev.clientY - 12}px`;
    });

    cy.on("mouseout", "node", (e) => {
      e.target.removeClass("hovered");
      tooltip.style.display = "none";
    });

    // Node click → highlight neighbourhood (Detailed / Auto-dark)
    cy.on("tap", "node", (e) => {
      const resolved2 = resolveMode(modeRef.current, darkRef.current);
      if (resolved2 === "simple") return;
      const neighbourhood = e.target.closedNeighborhood();
      cy.elements().removeClass("highlighted faded");
      cy.elements().not(neighbourhood).addClass("faded");
      neighbourhood.addClass("highlighted");
    });

    cy.on("tap", (e) => {
      if (e.target === cy) cy.elements().removeClass("highlighted faded");
    });

    // Edge hover
    cy.on("mouseover", "edge", (e) => {
      const d = e.target.data();
      const typeLabel: Record<string, string> = {
        cycle: "🔴 Cycle", smurfing: "🟠 Smurfing", shell: "🟣 Shell Chain", normal: "⬜ Normal",
      };
      tooltip.innerHTML = `
        <div style="color:#00e5ff;font-weight:700;margin-bottom:5px;">${d.source} → ${d.target}</div>
        <div>Type: <span style="color:#e2e8f0">${typeLabel[d.edgeType] ?? "Normal"}</span></div>
        <div>Transactions: <span style="color:#e2e8f0">${d.weight}</span></div>
        <div>Total Amount: <span style="color:#e2e8f0">$${parseFloat(d.amount).toLocaleString()}</span></div>
      `;
      tooltip.style.display = "block";
    });

    cy.on("mousemove", "edge", (e) => {
      const ev = e.originalEvent as MouseEvent;
      tooltip.style.left = `${ev.clientX + 16}px`;
      tooltip.style.top = `${ev.clientY - 12}px`;
    });

    cy.on("mouseout", "edge", () => { tooltip.style.display = "none"; });

    cyRef.current = cy;

    return () => {
      tooltip.remove();
      tooltipRef.current = null;
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, suspiciousAccounts, animationsEnabled]);

  // ── Reactively re-style when mode or theme changes (no graph rebuild) ───────
  useEffect(() => {
    applyStyles();
  }, [viewMode, isDarkTheme, applyStyles]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const resolvedMode = resolveMode(viewMode, isDarkTheme);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" id="cy" />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 forensics-panel px-3 py-2 text-xs font-mono flex flex-col gap-1 opacity-90">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-suspicious inline-block" />
          <span className="text-muted-foreground">Suspicious (≥60)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-fraud-ring inline-block" />
          <span className="text-muted-foreground">Fraud Ring (30–60)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-normal inline-block" />
          <span className="text-muted-foreground">Normal</span>
        </div>
        {resolvedMode === "detailed" && (
          <div className="border-t border-border mt-1 pt-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 inline-block" style={{ borderTop: "2px solid #dc2626" }} />
              <span className="text-muted-foreground">Cycle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 inline-block" style={{ borderTop: "2px dotted #f97316" }} />
              <span className="text-muted-foreground">Smurfing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 inline-block" style={{ borderTop: "2px dashed #a78bfa" }} />
              <span className="text-muted-foreground">Shell</span>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="absolute top-3 right-3 text-xs font-mono text-muted-foreground/60">
        {resolvedMode === "detailed"
          ? "Click node to highlight · Scroll/drag to navigate"
          : "Scroll to zoom · Drag to pan · Hover for details"}
      </div>
    </div>
  );
}
