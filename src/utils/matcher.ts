/**
 * Data Differentiator Engine
 * General-purpose 2-subsection data comparison:
 * Subsection 1: Alphanumeric String (symbols ignored)
 * Subsection 2: Numerical Value (symbols ignored, thousands commas preserved)
 *
 * Developed by: Mark David Evardo
 */

export interface DataEntry {
  id: string;
  name: string; // Subsection 1: Alphanumeric string identifier (name, title, item, label)
  contribution: number; // Subsection 2: Numerical value
  agency?: string;
  referenceId?: string;
  department?: string;
  notes?: string;
}

export type EmployeeRecord = DataEntry;

export type DiffStatus =
  | 'IDENTICAL'       // Matched string, identical numerical value
  | 'VALUES_CHANGED'  // Matched string, numerical value modified (+/- difference)
  | 'DATASET_A_ONLY'  // Present in Dataset A only (missing in Dataset B)
  | 'DATASET_B_ONLY'; // Present in Dataset B only (missing in Dataset A)

export interface MatchedPair {
  id: string;
  row1Record?: DataEntry; // Dataset A
  row2Record?: DataEntry; // Dataset B
  status: DiffStatus;
  nameSimilarityScore: number; // 0 - 100
  matchedTokens: string[];     // E.g., ["part1", "part2"]
  distinctSimilaritiesCount: number; // Number of distinct token similarities
  contributionDifference: number; // Dataset B value - Dataset A value
  percentChange: number;          // percentage change
  matchConfidence: 'EXACT' | 'HIGH' | 'MODERATE' | 'MANUAL' | 'UNMATCHED';
  matchExplanation: string;
}

export interface ReconciliationSummary {
  row1TotalCount: number;
  row1TotalAmount: number;
  row2TotalCount: number;
  row2TotalAmount: number;
  netAmountDifference: number;
  identicalCount: number;
  changedContributionCount: number;
  row1OnlyCount: number; // In Dataset A only
  row2OnlyCount: number; // In Dataset B only
  highMatchCount: number;
}

/**
 * Normalizes text: strictly strips ALL non-alphanumeric symbols and accents,
 * leaving only clean alphanumeric characters (a-z0-9) and single spaces.
 */
export function normalizeName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // remove accent marks/diacritics
    .replace(/[^a-z0-9\s]/g, ' ')           // strip ALL symbols, punctuation, quotes, hyphens, brackets
    .replace(/\s+/g, ' ')                  // collapse multiple whitespace
    .trim();
}

/**
 * Extracts distinct tokens while cleaning common suffixes/prefixes.
 */
export function extractNameTokens(name: string): string[] {
  const normalized = normalizeName(name);
  if (!normalized) return [];

  // Split into raw words
  const words = normalized.split(' ').filter(w => w.length > 0);
  
  // Standardize common compound words/names
  const tokens: string[] = [];
  const ignoredSuffixes = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v', 'mr', 'ms', 'mrs', 'dr']);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (ignoredSuffixes.has(w)) continue;

    // Handle compound prefixes like "de la", "de los", "van der", "san", "sta"
    if ((w === 'de' || w === 'del' || w === 'van') && i + 1 < words.length) {
      if ((words[i + 1] === 'la' || words[i + 1] === 'los' || words[i + 1] === 'der') && i + 2 < words.length) {
        tokens.push(`${w}${words[i + 1]}${words[i + 2]}`);
        i += 2;
        continue;
      } else {
        tokens.push(`${w}${words[i + 1]}`);
        i += 1;
        continue;
      }
    }
    
    tokens.push(w);
  }

  // Deduplicate and filter out single letters unless that's all there is
  const unique = Array.from(new Set(tokens));
  return unique.length > 1 ? unique.filter(t => t.length > 1) : unique;
}

/**
 * Levenshtein Distance for fuzzy string comparison.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Similarity ratio between two single words (0 to 1).
 */
export function wordSimilarity(w1: string, w2: string): number {
  if (w1 === w2) return 1.0;
  const clean1 = w1.replace(/\s+/g, '');
  const clean2 = w2.replace(/\s+/g, '');
  if (clean1 === clean2) return 0.98;

  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1.0;
  
  // Prefix bonus: truncated words or initials
  if (w1.length >= 3 && w2.length >= 3) {
    if (w1.startsWith(w2) || w2.startsWith(w1)) {
      return 0.88;
    }
  }

  const dist = levenshteinDistance(w1, w2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Computes string similarity score and finds distinct similarities.
 */
export function evaluateNameSimilarity(name1: string, name2: string): {
  score: number;
  matchedTokens: string[];
  distinctSimilaritiesCount: number;
  confidence: 'EXACT' | 'HIGH' | 'MODERATE' | 'UNMATCHED';
} {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  if (norm1 === norm2) {
    const tokens = extractNameTokens(name1);
    return {
      score: 100,
      matchedTokens: tokens,
      distinctSimilaritiesCount: tokens.length,
      confidence: 'EXACT'
    };
  }

  const tokens1 = extractNameTokens(name1);
  const tokens2 = extractNameTokens(name2);

  if (!tokens1.length || !tokens2.length) {
    return { score: 0, matchedTokens: [], distinctSimilaritiesCount: 0, confidence: 'UNMATCHED' };
  }

  // Cross-match tokens to find distinct matches
  const matchedTokens: string[] = [];
  const matchedIndices2 = new Set<number>();
  let totalTokenScore = 0;

  for (const t1 of tokens1) {
    let bestMatchIdx = -1;
    let bestScore = 0;

    for (let j = 0; j < tokens2.length; j++) {
      if (matchedIndices2.has(j)) continue;
      const sim = wordSimilarity(t1, tokens2[j]);
      if (sim > bestScore) {
        bestScore = sim;
        bestMatchIdx = j;
      }
    }

    if (bestMatchIdx !== -1 && bestScore >= 0.78) {
      matchedTokens.push(t1);
      matchedIndices2.add(bestMatchIdx);
      totalTokenScore += bestScore;
    }
  }

  const distinctCount = matchedTokens.length;
  const maxPossibleMatches = Math.max(tokens1.length, tokens2.length);
  const coverage = totalTokenScore / maxPossibleMatches;
  
  let finalScore = coverage * 100;
  if (distinctCount >= 2) {
    finalScore = Math.max(finalScore, Math.min(96, 75 + distinctCount * 10));
  }

  finalScore = Math.round(finalScore);

  let confidence: 'EXACT' | 'HIGH' | 'MODERATE' | 'UNMATCHED' = 'UNMATCHED';
  if (finalScore >= 95) confidence = 'HIGH';
  else if (distinctCount >= 2 && finalScore >= 70) confidence = 'HIGH';
  else if (finalScore >= 50 || distinctCount >= 1) confidence = 'MODERATE';

  return {
    score: finalScore,
    matchedTokens,
    distinctSimilaritiesCount: distinctCount,
    confidence
  };
}

/**
 * Main differentiation engine: compares Dataset A (Baseline) and Dataset B (Current).
 */
export function differentiateGroups(
  row1: DataEntry[],
  row2: DataEntry[],
  options?: {
    minDistinctTokens?: number;
    minScoreThreshold?: number;
    manualPairs?: Record<string, string>; // row1Id -> row2Id
    rejectedPairs?: string[]; // Pairs marked as 'Not a match' to isolate
  }
): { pairs: MatchedPair[]; summary: ReconciliationSummary } {
  const minDistinctTokens = options?.minDistinctTokens ?? 2;
  const minScoreThreshold = options?.minScoreThreshold ?? 65;
  const manualPairs = options?.manualPairs ?? {};
  const rejectedPairsSet = new Set<string>(options?.rejectedPairs ?? []);

  const pairs: MatchedPair[] = [];
  const assignedRow2Ids = new Set<string>();
  const manuallyPairedRow1 = new Set<string>();

  // 1. Process Manual Pairs first if any
  for (const [r1Id, r2Id] of Object.entries(manualPairs)) {
    const pairKey = `${r1Id}:::${r2Id}`;
    if (rejectedPairsSet.has(pairKey)) continue;

    const rec1 = row1.find(r => r.id === r1Id);
    const rec2 = row2.find(r => r.id === r2Id);
    if (rec1 && rec2 && !assignedRow2Ids.has(r2Id) && !manuallyPairedRow1.has(r1Id)) {
      assignedRow2Ids.add(r2Id);
      manuallyPairedRow1.add(r1Id);
      const evalRes = evaluateNameSimilarity(rec1.name, rec2.name);
      const diff = rec2.contribution - rec1.contribution;
      const status: DiffStatus = Math.abs(diff) < 0.001 ? 'IDENTICAL' : 'VALUES_CHANGED';

      pairs.push({
        id: `manual_${rec1.id}_${rec2.id}`,
        row1Record: rec1,
        row2Record: rec2,
        status,
        nameSimilarityScore: evalRes.score,
        matchedTokens: evalRes.matchedTokens,
        distinctSimilaritiesCount: evalRes.distinctSimilaritiesCount,
        contributionDifference: diff,
        percentChange: rec1.contribution !== 0 ? (diff / rec1.contribution) * 100 : 0,
        matchConfidence: 'MANUAL',
        matchExplanation: `Manually linked by user (${evalRes.distinctSimilaritiesCount} common string parts)`
      });
    }
  }

  // 2. Automated Smart Matching
  const remainingRow1 = row1.filter(r1 => !manuallyPairedRow1.has(r1.id));

  for (const rec1 of remainingRow1) {
    let bestMatch: {
      rec2: DataEntry;
      score: number;
      matchedTokens: string[];
      distinctCount: number;
      confidence: 'EXACT' | 'HIGH' | 'MODERATE' | 'UNMATCHED';
    } | null = null;

    for (const rec2 of row2) {
      if (assignedRow2Ids.has(rec2.id)) continue;

      // Check if user marked this pair as 'Not a match' (isolated)
      const pairKey = `${rec1.id}:::${rec2.id}`;
      const nameKey = `${normalizeName(rec1.name)}:::${normalizeName(rec2.name)}`;
      if (rejectedPairsSet.has(pairKey) || rejectedPairsSet.has(nameKey)) continue;

      const evalRes = evaluateNameSimilarity(rec1.name, rec2.name);

      const meetsCriteria =
        evalRes.score === 100 ||
        (evalRes.distinctSimilaritiesCount >= minDistinctTokens && evalRes.score >= 60) ||
        evalRes.score >= minScoreThreshold;

      if (meetsCriteria) {
        if (!bestMatch || evalRes.score > bestMatch.score || 
           (evalRes.score === bestMatch.score && evalRes.distinctSimilaritiesCount > bestMatch.distinctCount)) {
          bestMatch = {
            rec2,
            score: evalRes.score,
            matchedTokens: evalRes.matchedTokens,
            distinctCount: evalRes.distinctSimilaritiesCount,
            confidence: evalRes.confidence
          };
        }
      }
    }

    if (bestMatch) {
      assignedRow2Ids.add(bestMatch.rec2.id);
      const diff = bestMatch.rec2.contribution - rec1.contribution;
      const status: DiffStatus = Math.abs(diff) < 0.001 ? 'IDENTICAL' : 'VALUES_CHANGED';

      let explanation = '';
      if (bestMatch.score === 100) {
        explanation = 'Exact match on string identifier';
      } else if (bestMatch.distinctCount >= 2) {
        explanation = `Matched via ${bestMatch.distinctCount} distinct string similarities: [${bestMatch.matchedTokens.join(', ')}]`;
      } else {
        explanation = `Fuzzy string match (${bestMatch.score}% similarity)`;
      }

      pairs.push({
        id: `pair_${rec1.id}_${bestMatch.rec2.id}`,
        row1Record: rec1,
        row2Record: bestMatch.rec2,
        status,
        nameSimilarityScore: bestMatch.score,
        matchedTokens: bestMatch.matchedTokens,
        distinctSimilaritiesCount: bestMatch.distinctCount,
        contributionDifference: diff,
        percentChange: rec1.contribution !== 0 ? (diff / rec1.contribution) * 100 : 0,
        matchConfidence: bestMatch.confidence,
        matchExplanation: explanation
      });
    } else {
      // Exists in Dataset A only
      pairs.push({
        id: `row1only_${rec1.id}`,
        row1Record: rec1,
        status: 'DATASET_A_ONLY',
        nameSimilarityScore: 0,
        matchedTokens: [],
        distinctSimilaritiesCount: 0,
        contributionDifference: -rec1.contribution,
        percentChange: -100,
        matchConfidence: 'UNMATCHED',
        matchExplanation: 'Entry present in Dataset A (Baseline) but missing in Dataset B (Current)'
      });
    }
  }

  // 3. Find Unmatched Dataset B records
  for (const rec2 of row2) {
    if (!assignedRow2Ids.has(rec2.id)) {
      pairs.push({
        id: `row2only_${rec2.id}`,
        row2Record: rec2,
        status: 'DATASET_B_ONLY',
        nameSimilarityScore: 0,
        matchedTokens: [],
        distinctSimilaritiesCount: 0,
        contributionDifference: rec2.contribution,
        percentChange: 100,
        matchConfidence: 'UNMATCHED',
        matchExplanation: 'Entry present in Dataset B (Current) but missing in Dataset A (Baseline)'
      });
    }
  }

  // Calculate Summary
  const row1TotalAmount = row1.reduce((sum, r) => sum + (r.contribution || 0), 0);
  const row2TotalAmount = row2.reduce((sum, r) => sum + (r.contribution || 0), 0);
  const netAmountDifference = row2TotalAmount - row1TotalAmount;

  const identicalCount = pairs.filter(p => p.status === 'IDENTICAL').length;
  const changedContributionCount = pairs.filter(p => p.status === 'VALUES_CHANGED').length;
  const row1OnlyCount = pairs.filter(p => p.status === 'DATASET_A_ONLY').length;
  const row2OnlyCount = pairs.filter(p => p.status === 'DATASET_B_ONLY').length;
  const highMatchCount = pairs.filter(p => p.distinctSimilaritiesCount >= 2 || p.nameSimilarityScore >= 80).length;

  const summary: ReconciliationSummary = {
    row1TotalCount: row1.length,
    row1TotalAmount,
    row2TotalCount: row2.length,
    row2TotalAmount,
    netAmountDifference,
    identicalCount,
    changedContributionCount,
    row1OnlyCount,
    row2OnlyCount,
    highMatchCount
  };

  return { pairs, summary };
}

/**
 * Parses freeform pasted text into DataEntry records with zero conditions.
 *
 * Subsection 1: Alphanumeric String (automatically collapses wide spaces and joins
 * multi-column names such as Surname, First Name, Middle Name without dropping any parts).
 * Subsection 2: Numerical Value (symbols ignored, thousands commas preserved).
 */
export function parsePastedRecords(
  rawText: string,
  defaultAgency: 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'General' = 'General'
): DataEntry[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const records: DataEntry[] = [];

  // Helper to test if a token is a numerical value
  const parseAmountFromToken = (token: string): number | null => {
    // Strip leading currency symbols, currency codes, spaces, quotes
    const cleaned = token
      .replace(/^["'“”‘’₱$€£¥\s]+|["'“”‘’\s]+$/g, '')
      .replace(/^(?:PHP|USD|EUR|GBP)\s*/i, '')
      .trim();
    if (!/\d/.test(cleaned)) return null;
    if (!/^-?[\d,]+(?:\.\d+)?$/.test(cleaned)) return null;
    const num = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  };

  // Helper to clean name string (collapsing all long spaces, removing wrapping quotes)
  const cleanNameString = (str: string): string => {
    return str
      .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    let name = '';
    let amount = 0;
    let refId: string | undefined = undefined;

    let tokens: string[] = [];

    if (line.includes('\t')) {
      tokens = line.split('\t').map(t => t.trim()).filter(Boolean);
    } else if (line.includes(';')) {
      tokens = line.split(';').map(t => t.trim()).filter(Boolean);
    } else if (/\s{2,}/.test(line)) {
      // Multiple spaces separating columns or name components
      tokens = line.split(/\s{2,}/).map(t => t.trim()).filter(Boolean);
    }

    if (tokens.length >= 2) {
      // Find the numerical amount token (scanned from right to left)
      let amountIndex = -1;
      let parsedAmount: number | null = null;

      for (let i = tokens.length - 1; i >= 0; i--) {
        const amt = parseAmountFromToken(tokens[i]);
        if (amt !== null) {
          amountIndex = i;
          parsedAmount = amt;
          break;
        }
      }

      if (amountIndex !== -1 && parsedAmount !== null) {
        amount = parsedAmount;
        let nameTokens = tokens.slice(0, amountIndex);

        // Check if the very first token is a row number / index (e.g. "1", "2", "#1", "1.")
        if (nameTokens.length >= 2 && /^(?:#?\d+|\d+\.)$/.test(nameTokens[0])) {
          refId = nameTokens[0];
          nameTokens = nameTokens.slice(1);
        }

        // Extra metadata after amount if present
        if (tokens.length > amountIndex + 1 && !refId) {
          refId = tokens.slice(amountIndex + 1).join(' ').trim();
        }

        // Join ALL remaining name tokens (Surname, First Name, Middle Name, Suffixes)
        name = cleanNameString(nameTokens.join(' '));
      } else {
        // No numerical token: entire line comprises the name split across columns
        name = cleanNameString(tokens.join(' '));
        amount = 0;
      }
    } else {
      // Freeform single column line with trailing number
      const trailingNumberRegex = /(.*?)(?:[\s,;:\t]+(?:[₱$€£¥]|PHP|USD|EUR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?))\s*$/i;
      const match = line.match(trailingNumberRegex);

      if (match && match[1]) {
        const rawName = match[1];
        const rawAmt = match[2];
        amount = parseFloat(rawAmt.replace(/,/g, '')) || 0;
        name = cleanNameString(rawName.replace(/[,;:\-\s]+$/, ''));
      } else if (line.includes(',')) {
        const commaParts = line.split(',').map(p => p.trim()).filter(Boolean);
        if (commaParts.length >= 2) {
          const last = commaParts[commaParts.length - 1];
          const amt = parseAmountFromToken(last);
          if (amt !== null) {
            amount = amt;
            name = cleanNameString(commaParts.slice(0, -1).join(' '));
          } else {
            name = cleanNameString(line);
          }
        } else {
          name = cleanNameString(line);
        }
      } else {
        name = cleanNameString(line);
        amount = 0;
      }
    }

    if (name) {
      records.push({
        id: `rec_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        contribution: amount,
        agency: defaultAgency,
        referenceId: refId
      });
    }
  }

  return records;
}

/**
 * Formats numerical value with thousands separators.
 */
export function formatValue(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export const formatPHP = formatValue;

/**
 * Parses numeric inputs cleaning commas and formatting symbols.
 */
export function cleanNumberInput(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}


/**
 * Natural name order: names starting with a number come first (sorted by numeric
 * value, so "2" before "10"), then names starting with letters A → Z.
 */
export function compareNames(a: string, b: string): number {
  const x = (a || '').trim();
  const y = (b || '').trim();
  const rank = (s: string) => (s === '' ? 2 : /^\d/.test(s) ? 0 : 1);
  const r = rank(x) - rank(y);
  if (r !== 0) return r;
  return x.localeCompare(y, undefined, { sensitivity: 'base', numeric: true });
}
