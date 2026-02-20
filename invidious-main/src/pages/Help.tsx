import { BookOpen, GitBranch, AlertTriangle, Network, BarChart2, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const sections = [
  {
    id: "money-muling",
    icon: <AlertTriangle className="w-5 h-5 text-suspicious" />,
    title: "What is Money Muling?",
    color: "border-suspicious/30",
    content: `A money mule is a person—often unknowing—who transfers illegally obtained money on behalf of criminals. Mules receive funds into their account and forward them, taking a cut as "commission."

Mule networks are used to launder proceeds of fraud, drug trafficking, cybercrime, and more. They deliberately create complexity and distance between the criminal and the illicit funds.

Key indicators:
• Accounts that receive funds from many sources then immediately forward them
• Circular transaction patterns that route funds back to origin
• Short bursts of high-frequency activity followed by silence`,
  },
  {
    id: "fraud-rings",
    icon: <Network className="w-5 h-5 text-fraud-ring" />,
    title: "What are Fraud Rings?",
    color: "border-fraud-ring/30",
    content: `Fraud rings are coordinated groups of accounts acting in concert to launder money. Unlike individual mules, fraud rings have organized, structured transaction patterns detectable through graph analysis.

This engine detects three ring archetypes:
1. Circular Routing Rings — accounts forming directed cycles
2. Smurfing Rings — fan-in or fan-out networks of 10+ accounts within 72 hours
3. Shell Chain Rings — linked low-activity accounts forming a laundering chain

Each ring is assigned a unique Ring ID and risk score.`,
  },
  {
    id: "cycle-detection",
    icon: <GitBranch className="w-5 h-5 text-cyber" />,
    title: "What is Cycle Detection?",
    color: "border-cyber/30",
    content: `Cycle detection identifies when money flows in a circle through a network of accounts, e.g.:

ACC_A → ACC_B → ACC_C → ACC_A

This is a classic money laundering technique. Funds are cycled to create the appearance of legitimate transactions and make tracing difficult.

The engine uses Depth-First Search (DFS) to find all directed cycles of length 3 to 5. Longer cycles are excluded to avoid false positives from legitimate business networks.

Detection adds +45 to suspicion score. Accounts in a cycle share the same Ring ID.`,
  },
  {
    id: "smurfing",
    icon: <AlertTriangle className="w-5 h-5 text-fraud-ring" />,
    title: "What is Smurfing?",
    color: "border-fraud-ring/30",
    content: `Smurfing (also called structuring) involves breaking large illicit amounts into smaller transactions to avoid detection thresholds.

Fan-In Smurfing: 10 or more unique sender accounts send funds to a single receiver account within a 72-hour window. The receiver aggregates funds for the criminal.

Fan-Out Smurfing: A single sender account distributes funds to 10 or more unique receiver accounts within a 72-hour window. Funds are dispersed to create complexity.

Both patterns add +30 to the account's suspicion score. The 72-hour window is evaluated using a sliding window algorithm.`,
  },
  {
    id: "shell-network",
    icon: <Network className="w-5 h-5 text-cyber" />,
    title: "What is a Shell Network?",
    color: "border-cyber/30",
    content: `A shell network uses a chain of temporary, low-activity accounts to layer funds across multiple hops, making the transaction trail difficult to trace.

Detection criteria:
• Chain length ≥ 3 hops (e.g., A → B → C → D)
• All intermediate accounts (B, C) have ≤ 3 total transactions
• Low-activity intermediaries suggest accounts created solely for layering

Shell intermediaries receive +35 to suspicion score. The chain endpoints receive +20. All members share a Ring ID with pattern type "shell_chain."`,
  },
  {
    id: "scoring",
    icon: <BarChart2 className="w-5 h-5 text-cyber" />,
    title: "How is the Suspicion Score Calculated?",
    color: "border-cyber/30",
    content: `Each account's suspicion score is computed on a 0–100 scale by accumulating points from detected patterns:

+45 — Circular fund routing (cycle detection)
+30 — Fan-in smurfing (≥10 unique senders in 72h)
+30 — Fan-out smurfing (≥10 unique receivers in 72h)
+35 — Shell chain intermediary
+20 — Shell chain endpoint
+15 — Multiple pattern bonus (2+ distinct patterns)
+10 — High velocity (≥5 transactions within 24 hours)

Maximum score: 100 (capped)

False Positive Control: Accounts with high transaction volume spread over 30+ days with no cycle or 72-hour clustering are classified as merchant-like and excluded.

Results are sorted in descending order of suspicion score.`,
  },
  {
    id: "csv-upload",
    icon: <Upload className="w-5 h-5 text-normal" />,
    title: "How to Upload CSV Correctly",
    color: "border-normal/30",
    content: `The CSV must contain exactly these column headers (case-insensitive):

• transaction_id — Unique string identifier for the transaction
• sender_id — String ID of the sending account
• receiver_id — String ID of the receiving account
• amount — Numeric value (float or integer, e.g. 1500.00)
• timestamp — Date/time in exactly YYYY-MM-DD HH:MM:SS format

Example row:
TXN_0001,ACC_001,ACC_002,750.00,2024-01-15 09:30:00

Common validation errors:
✗ Missing columns → file is rejected immediately
✗ Wrong timestamp format (e.g. "15/01/2024") → row skipped
✗ Non-numeric amount → row skipped
✗ Missing sender/receiver ID → row skipped

The engine can process up to 10,000+ transactions in under 30 seconds.`,
  },
];

export default function Help() {
  const [openId, setOpenId] = useState<string | null>("money-muling");

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="w-4 h-px bg-cyber" /> DOCUMENTATION
          </div>
          <h1 className="font-mono font-bold text-2xl text-foreground flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-cyber" />
            Help & Documentation
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-2">
            RIFT 2026 · Money Muling Detection Engine Reference Guide
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`forensics-panel border ${section.color} overflow-hidden transition-all duration-200`}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
                onClick={() => setOpenId(openId === section.id ? null : section.id)}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  <span className="font-mono font-bold text-sm text-foreground">{section.title}</span>
                </div>
                {openId === section.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openId === section.id && (
                <div className="px-5 pb-5 border-t border-border/50">
                  <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">
                    {section.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick reference */}
        <div className="mt-8 forensics-panel glow-border-cyan p-5">
          <h2 className="font-mono font-bold text-sm text-cyber mb-4">QUICK SCORE REFERENCE</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Cycle Detection", pts: "+45", cls: "text-suspicious" },
              { label: "Fan-In Smurfing", pts: "+30", cls: "text-fraud-ring" },
              { label: "Fan-Out Smurfing", pts: "+30", cls: "text-fraud-ring" },
              { label: "Shell Intermediary", pts: "+35", cls: "text-cyber" },
              { label: "Multi-Pattern Bonus", pts: "+15", cls: "text-cyber" },
              { label: "High Velocity (24h)", pts: "+10", cls: "text-normal" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between bg-secondary/30 rounded px-3 py-2">
                <span className="text-xs font-mono text-muted-foreground">{item.label}</span>
                <span className={`text-xs font-mono font-bold ${item.cls}`}>{item.pts}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-muted-foreground/60 mt-3">Maximum score: 100 (capped)</p>
        </div>
      </div>
    </div>
  );
}
