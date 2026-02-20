import { Link } from "react-router-dom";
import {
  Shield,
  Network,
  GitBranch,
  AlertTriangle,
  Upload,
  ChevronRight,
  Eye,
  Zap,
  Lock } from
"lucide-react";

const features = [
{
  icon: <GitBranch className="w-6 h-6 text-suspicious" />,
  title: "Cycle Detection",
  description: "Identifies directed transaction cycles of length 3–5 using depth-first search graph traversal.",
  badge: "RIFT 2026",
  badgeClass: "badge-suspicious"
},
{
  icon: <AlertTriangle className="w-6 h-6 text-fraud-ring" />,
  title: "Smurfing Analysis",
  description: "Detects fan-in and fan-out patterns where 10+ unique accounts transact within a 72-hour window.",
  badge: "72H WINDOW",
  badgeClass: "badge-fraud-ring"
},
{
  icon: <Network className="w-6 h-6 text-cyber" />,
  title: "Shell Network Mapping",
  description: "Uncovers layered shell chains of 3+ hops where intermediary accounts have ≤3 total transactions.",
  badge: "CHAIN ≥3",
  badgeClass: "badge-cyber"
},
{
  icon: <Eye className="w-6 h-6 text-normal" />,
  title: "Graph Visualization",
  description: "Interactive Cytoscape.js directed graph with color-coded suspicion scoring and hover analytics.",
  badge: "INTERACTIVE",
  badgeClass: "badge-normal"
},
{
  icon: <Zap className="w-6 h-6 text-fraud-ring" />,
  title: "Suspicion Scoring",
  description: "Multi-factor 0–100 scoring engine combining cycle detection, smurfing, velocity, and pattern bonuses.",
  badge: "0–100 SCALE",
  badgeClass: "badge-fraud-ring"
},
{
  icon: <Lock className="w-6 h-6 text-cyber" />,
  title: "False Positive Control",
  description: "Merchant-like behavior filter prevents legitimate high-volume accounts from being flagged.",
  badge: "FPC",
  badgeClass: "badge-cyber"
}];


const conceptCards = [
{
  term: "Money Muling",
  color: "border-suspicious/40 bg-suspicious/5",
  textColor: "text-suspicious",
  def: "A money mule is a person who transfers illegally obtained money on behalf of criminals, often unknowingly. Mules act as intermediaries to obscure the trail of illicit funds."
},
{
  term: "Graph Detection",
  color: "border-cyber/40 bg-cyber/5",
  textColor: "text-cyber",
  def: "Transaction networks are modeled as directed graphs. Account IDs are nodes; transactions are edges. Structural anomalies like cycles and long chains reveal criminal coordination."
},
{
  term: "Cycle Detection",
  color: "border-fraud-ring/40 bg-fraud-ring/5",
  textColor: "text-fraud-ring",
  def: "Circular fund routing occurs when money flows A→B→C→A, cycling through accounts to obscure its origin. We detect all directed cycles of length 3–5."
},
{
  term: "Smurfing",
  color: "border-suspicious/40 bg-suspicious/5",
  textColor: "text-suspicious",
  def: "Structuring transactions below detection thresholds. Fan-in smurfing aggregates funds from 10+ senders to one account; fan-out disperses to 10+ receivers within 72 hours."
},
{
  term: "Shell Networks",
  color: "border-cyber/40 bg-cyber/5",
  textColor: "text-cyber",
  def: "A chain of low-activity intermediary accounts (≤3 total transactions) used to layer and distance funds from their criminal origin across 3+ hops."
}];


export default function Index() {
  return (
    <div className="min-h-screen bg-background forensics-grid">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-1 h-full opacity-10 animate-scan-horizontal"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--cyber)), transparent)" }} />

      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-cyber px-4 py-1.5 rounded-full text-xs font-mono tracking-widest mb-6 animate-fade-in-up">INVIDIOUS · MONEY MULLING DETECTION  FINANCIAL CRIME DETECTION  FINANCIAL CRIME DETECTION
            <span className="w-1.5 h-1.5 rounded-full bg-cyber animate-pulse" />
            RIFT 2026 HACKATHON · FINANCIAL CRIME DETECTION
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight mb-4 animate-fade-in-up"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}>

            <span className="text-foreground">Digital Forensics</span>
            <br />
            <span className="text-cyber">Investigation Workspace</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-muted-foreground font-mono mb-3 animate-fade-in-up"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}>

            AI-Powered Graph-Based Money Muling Detection Engine
          </p>

          <p
            className="text-sm text-muted-foreground/70 font-mono mb-10 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}>

            Upload transaction CSV data. Detect cycles, smurfing, and shell networks.
            Visualize fraud rings on an interactive directed graph.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "400ms", animationFillMode: "both" }}>

            <Link
              to="/investigation"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-cyber text-panel font-mono font-bold tracking-wider rounded-lg hover:bg-cyber/90 transition-all duration-200 shadow-glow-cyan hover:shadow-[0_0_30px_hsl(185_100%_50%/0.5)] group">

              <Upload className="w-5 h-5" />
              Start Investigation
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-border hover:border-cyber/50 text-foreground font-mono tracking-wider rounded-lg hover:bg-secondary transition-all duration-200">

              <Eye className="w-5 h-5" />
              Learn How It Works
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up"
            style={{ animationDelay: "500ms", animationFillMode: "both" }}>

            {[
            { val: "≤30s", label: "10K Transactions" },
            { val: "3", label: "Pattern Types" },
            { val: "100", label: "Max Score Scale" },
            { val: "0", label: "False Positive Rate*" }].
            map((s) =>
            <div key={s.label} className="forensics-panel p-4 text-center glow-border-cyan">
                <div className="text-2xl font-mono font-bold text-cyber">{s.val}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">{s.label}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Concept Cards */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
        <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-6 flex items-center gap-2">
          <span className="w-4 h-px bg-cyber" /> FINANCIAL CRIME CONCEPTS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conceptCards.map((card, i) =>
          <div
            key={card.term}
            className={`rounded-lg border p-5 ${card.color} animate-fade-in-up`}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>

              <h3 className={`font-mono font-bold text-sm mb-2 ${card.textColor}`}>{card.term}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.def}</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
        <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-6 flex items-center gap-2">
          <span className="w-4 h-px bg-cyber" /> ENGINE CAPABILITIES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) =>
          <div
            key={f.title}
            className="forensics-panel p-5 hover:border-cyber/40 transition-all duration-300 group animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>

              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-secondary rounded-lg group-hover:bg-secondary/70 transition-colors">
                  {f.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono font-bold text-sm text-foreground">{f.title}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${f.badgeClass}`}>{f.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
        <div className="forensics-panel glow-border-cyan p-8 text-center scan-line">
          <Shield className="w-10 h-10 text-cyber mx-auto mb-4" />
          <h2 className="font-mono font-bold text-2xl text-foreground mb-2">
            Ready to Detect Financial Crime?
          </h2>
          <p className="text-sm text-muted-foreground font-mono mb-6">
            Upload your transaction CSV and get instant fraud ring analysis with graph visualization.
          </p>
          <Link
            to="/investigation"
            className="inline-flex items-center gap-2 px-8 py-3 bg-cyber text-panel font-mono font-bold tracking-wider rounded-lg hover:bg-cyber/90 transition-all duration-200 shadow-glow-cyan">

            <Upload className="w-4 h-4" />
            Open Investigation Workspace
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber" />
            <span>Digital Forensics Investigation Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="hover:text-cyber transition-colors">Contact</Link>
            <Link to="/help" className="hover:text-cyber transition-colors">Help</Link>
            <span>Money Muling Detection Engine v1.0</span>
          </div>
        </div>
      </footer>
    </div>);

}