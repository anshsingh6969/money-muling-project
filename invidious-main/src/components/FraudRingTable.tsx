import type { FraudRing, SuspiciousAccount } from "@/lib/detectionEngine";
import { AlertTriangle, Network, GitBranch } from "lucide-react";

interface Props {
  fraudRings: FraudRing[];
  suspiciousAccounts: SuspiciousAccount[];
}

const patternIcon = (type: string) => {
  if (type.includes("cycle")) return <GitBranch className="w-4 h-4 text-suspicious" />;
  if (type.includes("shell")) return <Network className="w-4 h-4 text-cyber" />;
  return <AlertTriangle className="w-4 h-4 text-fraud-ring" />;
};

const patternLabel: Record<string, string> = {
  cycle: "Circular Fund Routing",
  smurfing_fan_in: "Smurfing – Fan-In",
  smurfing_fan_out: "Smurfing – Fan-Out",
  shell_chain: "Layered Shell Network",
};

export default function FraudRingTable({ fraudRings, suspiciousAccounts }: Props) {
  if (fraudRings.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground font-mono text-sm">
        No fraud rings detected.
      </div>
    );
  }

  const getMaxScore = (ring: FraudRing) => {
    const memberScores = ring.member_accounts
      .map((id) => suspiciousAccounts.find((a) => a.account_id === id)?.suspicion_score ?? 0);
    return memberScores.length > 0 ? Math.max(...memberScores) : ring.risk_score;
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-suspicious";
    if (score >= 40) return "text-fraud-ring";
    return "text-normal";
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 70) return "bg-suspicious";
    if (score >= 40) return "bg-fraud-ring";
    return "bg-normal";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground text-xs tracking-widest uppercase">Ring ID</th>
            <th className="text-left py-3 px-4 text-muted-foreground text-xs tracking-widest uppercase">Pattern Type</th>
            <th className="text-center py-3 px-4 text-muted-foreground text-xs tracking-widest uppercase">Members</th>
            <th className="text-left py-3 px-4 text-muted-foreground text-xs tracking-widest uppercase">Risk Score</th>
            <th className="text-left py-3 px-4 text-muted-foreground text-xs tracking-widest uppercase">Member Accounts</th>
          </tr>
        </thead>
        <tbody>
          {fraudRings.map((ring, idx) => {
            const score = ring.risk_score;
            const maxScore = getMaxScore(ring);
            const displayScore = Math.max(score, maxScore);
            return (
              <tr
                key={ring.ring_id}
                className={`border-b border-border/50 hover:bg-secondary/30 transition-colors duration-150 animate-fade-in-up`}
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
              >
                <td className="py-3 px-4">
                  <span className="badge-cyber px-2 py-1 rounded text-xs font-mono">{ring.ring_id}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {patternIcon(ring.pattern_type)}
                    <span className="text-xs text-foreground">
                      {patternLabel[ring.pattern_type] || ring.pattern_type}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-1 rounded font-bold text-xs ${
                      ring.pattern_type.includes("cycle") ? "badge-suspicious" : "badge-fraud-ring"
                    }`}
                  >
                    {ring.member_accounts.length}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getRiskColor(displayScore)}`}>
                      {displayScore.toFixed(1)}
                    </span>
                    <div className="w-20 bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full risk-bar-fill ${getRiskBarColor(displayScore)}`}
                        style={{ width: `${displayScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 max-w-xs">
                  <div className="text-xs text-muted-foreground truncate" title={ring.member_accounts.join(", ")}>
                    {ring.member_accounts.slice(0, 5).join(", ")}
                    {ring.member_accounts.length > 5 && (
                      <span className="text-cyber"> +{ring.member_accounts.length - 5} more</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
