import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Zap,
  RefreshCw,
  Cpu,
  Save,
  CheckCircle,
} from "lucide-react";

interface Settings {
  theme: "dark" | "light";
  graphAnimations: boolean;
  performanceMode: boolean;
  graphViewMode: "simple" | "detailed" | "auto";
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  graphAnimations: true,
  performanceMode: false,
  graphViewMode: "detailed",
};

function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("rift-settings") || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light-mode");
  } else {
    root.classList.remove("light-mode");
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem("rift-settings", JSON.stringify(s));
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [saved, setSaved] = useState(false);

  // Apply theme immediately on mount and whenever it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // For theme: apply + save immediately so it persists across page navigations
      if (key === "theme") {
        applyTheme(value as "dark" | "light");
        saveSettings(next);
      }
      return next;
    });
    setSaved(false);
  };

  const save = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("rift-settings");
    applyTheme(DEFAULT_SETTINGS.theme);
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="w-4 h-px bg-cyber" /> CONFIGURATION
          </div>
          <h1 className="font-mono font-bold text-2xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Configure workspace preferences. Settings are saved locally.
          </p>
        </div>

        <div className="space-y-4">
          {/* Theme */}
          <div className="forensics-panel p-5">
            <h2 className="font-mono font-bold text-sm text-cyber mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4" /> APPEARANCE
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Dark forensics mode or light mode — saved immediately
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() =>
                    update("theme", settings.theme === "dark" ? "light" : "dark")
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                    settings.theme === "light"
                      ? "bg-cyber"
                      : "bg-secondary border border-border"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center ${
                      settings.theme === "light"
                        ? "left-8 bg-panel"
                        : "left-1 bg-muted-foreground"
                    }`}
                  >
                    {settings.theme === "light" ? (
                      <Sun className="w-3 h-3 text-cyber" />
                    ) : (
                      <Moon className="w-3 h-3 text-background" />
                    )}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => update("theme", t)}
                    className={`p-3 rounded-lg border font-mono text-sm transition-all duration-200 ${
                      settings.theme === t
                        ? "border-cyber bg-cyber/10 text-cyber"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      {t === "dark" ? (
                        <Moon className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                      {t === "dark" ? "Dark Forensics" : "Light Mode"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Graph Animations */}
          <div className="forensics-panel p-5">
            <h2 className="font-mono font-bold text-sm text-cyber mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> GRAPH VISUALIZATION
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-foreground">Graph Animations</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Smooth layout animations when rendering graph (auto-disabled for &gt;5 000 edges)
                </p>
              </div>
              <button
                onClick={() => update("graphAnimations", !settings.graphAnimations)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  settings.graphAnimations
                    ? "bg-cyber"
                    : "bg-secondary border border-border"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-panel transition-all duration-300 ${
                    settings.graphAnimations ? "left-8" : "left-1 bg-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Performance */}
          <div className="forensics-panel p-5">
            <h2 className="font-mono font-bold text-sm text-cyber mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> PERFORMANCE
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-foreground">Performance Mode</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Optimize for 10K+ transactions: limit graph to 500 nodes, skip animations
                </p>
              </div>
              <button
                onClick={() => update("performanceMode", !settings.performanceMode)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  settings.performanceMode
                    ? "bg-cyber"
                    : "bg-secondary border border-border"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-panel transition-all duration-300 ${
                    settings.performanceMode ? "left-8" : "left-1 bg-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="forensics-panel p-5 glow-border-red">
            <h2 className="font-mono font-bold text-sm text-suspicious mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> INVESTIGATION
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-foreground">Reset Investigation</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Clear all uploaded data and detection results
                </p>
              </div>
              <button
                onClick={reset}
                className="px-4 py-2 border border-suspicious/40 text-suspicious rounded font-mono text-xs hover:bg-suspicious/10 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground">
              Theme saves immediately. Other settings require clicking Save.
            </p>
            <button
              onClick={save}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all duration-200 ${
                saved
                  ? "bg-normal/20 border border-normal/40 text-normal"
                  : "bg-cyber text-panel hover:bg-cyber/90 shadow-glow-cyan"
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
