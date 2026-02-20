// ============================================================
// RIFT 2026 Forensics Detection Engine
// Money Muling Detection - Cycle, Smurfing, Shell Network
// ============================================================

export interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: Date;
}

export interface SuspiciousAccount {
  account_id: string;
  suspicion_score: number;
  detected_patterns: string[];
  ring_id: string | null;
}

export interface FraudRing {
  ring_id: string;
  member_accounts: string[];
  pattern_type: string;
  risk_score: number;
}

export interface DetectionSummary {
  total_accounts_analyzed: number;
  suspicious_accounts_flagged: number;
  fraud_rings_detected: number;
  processing_time_seconds: number;
}

export interface DetectionResult {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  summary: DetectionSummary;
}

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult {
  transactions: Transaction[];
  errors: ParseError[];
}

// ============================================================
// CSV PARSER
// ============================================================

const REQUIRED_COLUMNS = ["transaction_id", "sender_id", "receiver_id", "amount", "timestamp"];
const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split("\n");
  const errors: ParseError[] = [];
  const transactions: Transaction[] = [];

  if (lines.length < 2) {
    errors.push({ row: 0, message: "CSV file is empty or has no data rows." });
    return { transactions, errors };
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push({ row: 0, message: `Missing required column: "${col}"` });
    }
  }
  if (errors.length > 0) return { transactions, errors };

  const colIndex = (name: string) => headers.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV values
    const cols = parseCSVLine(line);
    const rowNum = i + 1;

    const tid = (cols[colIndex("transaction_id")] || "").trim();
    const sender = (cols[colIndex("sender_id")] || "").trim();
    const receiver = (cols[colIndex("receiver_id")] || "").trim();
    const amountStr = (cols[colIndex("amount")] || "").trim();
    const timestampStr = (cols[colIndex("timestamp")] || "").trim();

    if (!tid || !sender || !receiver) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: Missing required string fields.` });
      continue;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: Invalid amount "${amountStr}" — must be a number.` });
      continue;
    }

    if (!TIMESTAMP_REGEX.test(timestampStr)) {
      errors.push({
        row: rowNum,
        message: `Row ${rowNum}: Invalid timestamp "${timestampStr}" — must be YYYY-MM-DD HH:MM:SS.`,
      });
      continue;
    }

    const timestamp = new Date(timestampStr.replace(" ", "T") + "Z");
    if (isNaN(timestamp.getTime())) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: Could not parse timestamp "${timestampStr}".` });
      continue;
    }

    transactions.push({ transaction_id: tid, sender_id: sender, receiver_id: receiver, amount, timestamp });
  }

  return { transactions, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ============================================================
// GRAPH BUILDER
// ============================================================

interface GraphNode {
  id: string;
  outEdges: Map<string, number>; // receiver → count
  inEdges: Map<string, number>;  // sender → count
  transactions: Transaction[];
  totalTxCount: number;
}

function buildGraph(transactions: Transaction[]): Map<string, GraphNode> {
  const nodes = new Map<string, GraphNode>();

  const getOrCreate = (id: string): GraphNode => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        outEdges: new Map(),
        inEdges: new Map(),
        transactions: [],
        totalTxCount: 0,
      });
    }
    return nodes.get(id)!;
  };

  for (const tx of transactions) {
    const sender = getOrCreate(tx.sender_id);
    const receiver = getOrCreate(tx.receiver_id);

    sender.outEdges.set(tx.receiver_id, (sender.outEdges.get(tx.receiver_id) || 0) + 1);
    receiver.inEdges.set(tx.sender_id, (receiver.inEdges.get(tx.sender_id) || 0) + 1);

    sender.transactions.push(tx);
    sender.totalTxCount++;
    receiver.totalTxCount++;
  }

  return nodes;
}

// ============================================================
// CYCLE DETECTION (Length 3–5 only)
// ============================================================

interface CycleResult {
  cycle: string[];
}

function detectCycles(nodes: Map<string, GraphNode>): CycleResult[] {
  const cycles: CycleResult[] = [];
  const allCycleStrings = new Set<string>();

  // DFS-based cycle detection with length limit
  const dfs = (
    start: string,
    current: string,
    path: string[],
    visited: Set<string>
  ) => {
    const node = nodes.get(current);
    if (!node) return;

    for (const neighbor of node.outEdges.keys()) {
      if (neighbor === start && path.length >= 3 && path.length <= 5) {
        // Found a cycle
        const cycle = [...path];
        // Normalize: rotate to smallest node first to deduplicate
        const minIdx = cycle.indexOf(cycle.reduce((a, b) => (a < b ? a : b)));
        const normalized = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
        const key = normalized.join(",");
        if (!allCycleStrings.has(key)) {
          allCycleStrings.add(key);
          cycles.push({ cycle });
        }
        continue;
      }

      if (!visited.has(neighbor) && path.length < 5) {
        visited.add(neighbor);
        path.push(neighbor);
        dfs(start, neighbor, path, visited);
        path.pop();
        visited.delete(neighbor);
      }
    }
  };

  for (const nodeId of nodes.keys()) {
    const visited = new Set<string>([nodeId]);
    dfs(nodeId, nodeId, [nodeId], visited);
  }

  return cycles;
}

// ============================================================
// SMURFING DETECTION (Fan-In / Fan-Out in 72h window)
// ============================================================

const SMURF_THRESHOLD = 10;
const SMURF_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours

interface SmurfResult {
  type: "fan_in" | "fan_out";
  account: string;
  counterparties: string[];
}

function detectSmurfing(transactions: Transaction[]): SmurfResult[] {
  const results: SmurfResult[] = [];

  // Group transactions by receiver (fan-in) and sender (fan-out)
  const byReceiver = new Map<string, Transaction[]>();
  const bySender = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    if (!byReceiver.has(tx.receiver_id)) byReceiver.set(tx.receiver_id, []);
    byReceiver.get(tx.receiver_id)!.push(tx);

    if (!bySender.has(tx.sender_id)) bySender.set(tx.sender_id, []);
    bySender.get(tx.sender_id)!.push(tx);
  }

  // Fan-in check: 10+ unique senders to 1 receiver in 72h window
  for (const [receiver, txs] of byReceiver) {
    const sorted = [...txs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    // Sliding window
    let left = 0;
    for (let right = 0; right < sorted.length; right++) {
      while (sorted[right].timestamp.getTime() - sorted[left].timestamp.getTime() > SMURF_WINDOW_MS) {
        left++;
      }
      const window = sorted.slice(left, right + 1);
      const uniqueSenders = new Set(window.map((t) => t.sender_id));
      if (uniqueSenders.size >= SMURF_THRESHOLD) {
        results.push({ type: "fan_in", account: receiver, counterparties: [...uniqueSenders] });
        break; // Only report once per account
      }
    }
  }

  // Fan-out check: 1 sender to 10+ unique receivers in 72h window
  for (const [sender, txs] of bySender) {
    const sorted = [...txs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let left = 0;
    for (let right = 0; right < sorted.length; right++) {
      while (sorted[right].timestamp.getTime() - sorted[left].timestamp.getTime() > SMURF_WINDOW_MS) {
        left++;
      }
      const window = sorted.slice(left, right + 1);
      const uniqueReceivers = new Set(window.map((t) => t.receiver_id));
      if (uniqueReceivers.size >= SMURF_THRESHOLD) {
        results.push({ type: "fan_out", account: sender, counterparties: [...uniqueReceivers] });
        break;
      }
    }
  }

  return results;
}

// ============================================================
// SHELL NETWORK DETECTION (chain ≥ 3 hops, intermediaries ≤ 3 txs)
// ============================================================

interface ShellChainResult {
  chain: string[];
}

function detectShellNetworks(nodes: Map<string, GraphNode>): ShellChainResult[] {
  const chains: ShellChainResult[] = [];
  const reportedChains = new Set<string>();

  const dfs = (current: string, path: string[]) => {
    const node = nodes.get(current);
    if (!node) return;

    for (const neighbor of node.outEdges.keys()) {
      if (path.includes(neighbor)) continue; // no loops

      // Check if current (intermediate) node is low-activity (≤ 3 total tx)
      const isIntermediate = path.length > 0 && path.length < path.length; // will check below
      const currentNode = nodes.get(current)!;
      const isLowActivity = currentNode.totalTxCount <= 3;

      // Only continue chain if this intermediate is low-activity OR we're at start
      if (path.length > 0 && !isLowActivity) continue;

      const newPath = [...path, neighbor];
      if (newPath.length >= 3) {
        // Check all intermediates (all except first and last) are low-activity
        const intermediates = newPath.slice(1, -1);
        const allLowActivity = intermediates.every((id) => (nodes.get(id)?.totalTxCount || 0) <= 3);
        if (allLowActivity) {
          const key = newPath.join("→");
          if (!reportedChains.has(key)) {
            reportedChains.add(key);
            chains.push({ chain: newPath });
          }
        }
      }

      if (newPath.length < 7) {
        dfs(neighbor, newPath);
      }
    }
  };

  for (const nodeId of nodes.keys()) {
    dfs(nodeId, [nodeId]);
  }

  return chains;
}

// ============================================================
// FALSE POSITIVE CONTROL
// ============================================================

function isMerchantLike(account: string, nodes: Map<string, GraphNode>, transactions: Transaction[]): boolean {
  const node = nodes.get(account);
  if (!node) return false;

  // High volume spread over 30+ days with no cycle/clustering = merchant
  const accountTxs = transactions.filter(
    (t) => t.sender_id === account || t.receiver_id === account
  );

  if (accountTxs.length < 20) return false;

  const times = accountTxs.map((t) => t.timestamp.getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const spanDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);

  return spanDays >= 30;
}

// ============================================================
// HIGH VELOCITY CHECK
// ============================================================

function hasHighVelocity(account: string, transactions: Transaction[]): boolean {
  const accountTxs = transactions
    .filter((t) => t.sender_id === account || t.receiver_id === account)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const window24h = 24 * 60 * 60 * 1000;
  let left = 0;
  for (let right = 0; right < accountTxs.length; right++) {
    while (accountTxs[right].timestamp.getTime() - accountTxs[left].timestamp.getTime() > window24h) {
      left++;
    }
    if (right - left + 1 >= 5) return true;
  }
  return false;
}

// ============================================================
// MAIN DETECTION ENGINE
// ============================================================

export async function runDetection(transactions: Transaction[]): Promise<DetectionResult> {
  const startTime = performance.now();

  // Build graph
  const nodes = buildGraph(transactions);
  const allAccounts = [...nodes.keys()];

  // Score accumulator
  const scores = new Map<string, number>();
  const patterns = new Map<string, Set<string>>();
  const ringMembership = new Map<string, string>();

  const addScore = (account: string, points: number) => {
    scores.set(account, Math.min(100, (scores.get(account) || 0) + points));
  };

  const addPattern = (account: string, pattern: string) => {
    if (!patterns.has(account)) patterns.set(account, new Set());
    patterns.get(account)!.add(pattern);
  };

  const fraudRings: FraudRing[] = [];
  let ringCounter = 1;

  // --- 1. Cycle Detection ---
  const cycles = detectCycles(nodes);
  for (const { cycle } of cycles) {
    const ringId = `RING_${String(ringCounter++).padStart(3, "0")}`;
    const cycleLength = cycle.length;

    for (const account of cycle) {
      addScore(account, 45);
      addPattern(account, `cycle_length_${cycleLength}`);
      ringMembership.set(account, ringId);
    }

    // Risk score for ring = avg suspicion + bonus
    const members = [...new Set(cycle)];
    fraudRings.push({
      ring_id: ringId,
      member_accounts: members,
      pattern_type: "cycle",
      risk_score: Math.min(100, 45 + (cycleLength >= 4 ? 15 : 0)),
    });
  }

  // --- 2. Smurfing Detection ---
  const smurfs = detectSmurfing(transactions);
  for (const smurf of smurfs) {
    const { account, type, counterparties } = smurf;
    addScore(account, 30);
    addPattern(account, type === "fan_in" ? "fan_in_smurfing" : "fan_out_smurfing");

    // Check if ring already exists for this group
    const existingRingId = ringMembership.get(account);
    if (!existingRingId) {
      const ringId = `RING_${String(ringCounter++).padStart(3, "0")}`;
      ringMembership.set(account, ringId);
      const members = [account, ...counterparties.slice(0, 20)]; // cap members
      fraudRings.push({
        ring_id: ringId,
        member_accounts: members,
        pattern_type: type === "fan_in" ? "smurfing_fan_in" : "smurfing_fan_out",
        risk_score: Math.min(100, 30 + counterparties.length * 1.5),
      });
    }
  }

  // --- 3. Shell Network Detection ---
  const shellChains = detectShellNetworks(nodes);
  for (const { chain } of shellChains) {
    const intermediates = chain.slice(1, -1);
    for (const account of intermediates) {
      addScore(account, 35);
      addPattern(account, "shell_intermediary");
    }
    // Source and destination also get flagged
    addScore(chain[0], 20);
    addScore(chain[chain.length - 1], 20);
    addPattern(chain[0], "shell_chain");
    addPattern(chain[chain.length - 1], "shell_chain");

    if (!ringMembership.has(chain[0])) {
      const ringId = `RING_${String(ringCounter++).padStart(3, "0")}`;
      const members = chain;
      for (const m of members) ringMembership.set(m, ringId);
      fraudRings.push({
        ring_id: ringId,
        member_accounts: members,
        pattern_type: "shell_chain",
        risk_score: Math.min(100, 35 + chain.length * 5),
      });
    }
  }

  // --- 4. Multiple pattern bonus + velocity ---
  for (const account of allAccounts) {
    const patternSet = patterns.get(account);
    if (patternSet && patternSet.size >= 2) {
      addScore(account, 15);
    }
    if (hasHighVelocity(account, transactions)) {
      addScore(account, 10);
      addPattern(account, "high_velocity");
    }
  }

  // --- 5. False positive filter & build suspicious accounts ---
  const suspiciousAccounts: SuspiciousAccount[] = [];

  for (const [account, score] of scores) {
    if (score <= 0) continue;

    // False positive: merchant-like behavior with no suspicious pattern compound
    const patternSet = patterns.get(account) || new Set<string>();
    const hasMaliciousPattern =
      [...patternSet].some((p) => p.includes("cycle") || p.includes("smurfing") || p.includes("shell"));

    if (!hasMaliciousPattern && isMerchantLike(account, nodes, transactions)) continue;

    suspiciousAccounts.push({
      account_id: account,
      suspicion_score: Math.round(score * 10) / 10,
      detected_patterns: [...patternSet],
      ring_id: ringMembership.get(account) || null,
    });
  }

  // Sort descending by suspicion score
  suspiciousAccounts.sort((a, b) => b.suspicion_score - a.suspicion_score);

  // Update ring risk scores based on member scores
  for (const ring of fraudRings) {
    const memberScores = ring.member_accounts
      .map((m) => suspiciousAccounts.find((a) => a.account_id === m)?.suspicion_score || 0);
    if (memberScores.length > 0) {
      ring.risk_score = Math.round(
        (Math.max(...memberScores) * 0.6 + (memberScores.reduce((a, b) => a + b, 0) / memberScores.length) * 0.4) * 10
      ) / 10;
    }
  }

  const endTime = performance.now();

  return {
    suspicious_accounts: suspiciousAccounts,
    fraud_rings: fraudRings,
    summary: {
      total_accounts_analyzed: allAccounts.length,
      suspicious_accounts_flagged: suspiciousAccounts.length,
      fraud_rings_detected: fraudRings.length,
      processing_time_seconds: Math.round((endTime - startTime) / 100) / 10,
    },
  };
}
