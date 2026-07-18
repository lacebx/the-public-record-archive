import type { Record } from "./data";

export type RelationshipType =
  "same publisher" | "similar topic" | "same category" | "follow-up" | "same country";

export type RelationshipReason = {
  factor: string;
  contribution: number;
  detail: string;
};

export type Relationship = {
  record: Record;
  score: number;
  type: RelationshipType;
  reasons: RelationshipReason[];
};

export type RelatedRecordSet = {
  record: Record;
  related: Relationship[];
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "its",
  "it's",
  "it",
  "this",
  "that",
  "these",
  "those",
  "we",
  "our",
  "they",
  "their",
  "he",
  "she",
  "his",
  "her",
  "him",
  "not",
  "no",
  "nor",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "some",
  "any",
  "into",
  "over",
  "up",
  "down",
  "out",
  "off",
  "about",
  "after",
  "before",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "what",
  "which",
  "who",
  "whom",
  "new",
  "one",
  "two",
  "three",
  "first",
  "last",
  "next",
  "other",
  "another",
  "also",
  "very",
  "just",
  "than",
  "too",
  "much",
  "many",
  "such",
  "like",
  "get",
  "make",
  "us",
  "say",
  "says",
  "said",
  "going",
  "go",
  "come",
  "back",
  "year",
  "years",
  "time",
  "week",
  "day",
  "month",
  "part",
]);

export function extractSignificantWords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];
  return Array.from(new Set(cleaned.split(" ").filter((w) => w.length >= 4 && !STOP_WORDS.has(w))));
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

export function parseDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function hoursBetween(a: string, b: string): number | null {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.abs(da.getTime() - db.getTime()) / 3600000;
}

export type ScoreFactors = {
  samePublisher: number;
  categoryMatch: number;
  timeProximity: number;
  titleSimilarity: number;
  keywordOverlap: number;
  sameCountry: number;
};

export type PrecomputedFeatures = {
  titleWords: string[];
  keywords: string[];
};

export function precomputeFeatures(record: Record): PrecomputedFeatures {
  return {
    titleWords: extractSignificantWords(record.title),
    keywords: extractSignificantWords(`${record.title} ${record.summary}`),
  };
}

export function computeScoreFactors(
  a: Record,
  b: Record,
  aFeatures?: PrecomputedFeatures,
  bFeatures?: PrecomputedFeatures,
): ScoreFactors {
  const samePublisher = a.publisher === b.publisher ? 30 : 0;
  const categoryMatch = a.category === b.category ? 10 : 0;
  const sameCountry = a.country === b.country ? 5 : 0;

  const hours = hoursBetween(a.published, b.published);
  let timeProximity = 0;
  if (hours !== null) {
    if (hours <= 24) timeProximity = 15;
    else if (hours <= 48) timeProximity = 10;
    else if (hours <= 168) timeProximity = 5;
  }

  const aWords = aFeatures?.titleWords ?? extractSignificantWords(a.title);
  const bWords = bFeatures?.titleWords ?? extractSignificantWords(b.title);
  const titleSimilarity = Math.round(jaccardSimilarity(aWords, bWords) * 25);

  const aKeywords = aFeatures?.keywords ?? extractSignificantWords(`${a.title} ${a.summary}`);
  const bKeywords = bFeatures?.keywords ?? extractSignificantWords(`${b.title} ${b.summary}`);
  const keywordOverlap = Math.round(jaccardSimilarity(aKeywords, bKeywords) * 20);

  return {
    samePublisher,
    categoryMatch,
    timeProximity,
    titleSimilarity,
    keywordOverlap,
    sameCountry,
  };
}

export function determineRelationshipType(factors: ScoreFactors): RelationshipType {
  if (
    factors.samePublisher >= factors.categoryMatch &&
    factors.samePublisher >= factors.titleSimilarity
  ) {
    return "same publisher";
  }
  if (factors.titleSimilarity >= 12) return "similar topic";
  if (factors.categoryMatch >= 8) return "same category";
  if (factors.timeProximity >= 10 && (factors.samePublisher > 0 || factors.titleSimilarity >= 5)) {
    return "follow-up";
  }
  return "same category";
}

export function buildReasons(factors: ScoreFactors): RelationshipReason[] {
  const reasons: RelationshipReason[] = [];
  if (factors.samePublisher > 0) {
    reasons.push({
      factor: "same publisher",
      contribution: factors.samePublisher,
      detail: "Same publisher",
    });
  }
  if (factors.categoryMatch > 0) {
    reasons.push({
      factor: "same category",
      contribution: factors.categoryMatch,
      detail: "Same category",
    });
  }
  if (factors.timeProximity > 0) {
    const label = factors.timeProximity >= 15 ? "24h" : factors.timeProximity >= 10 ? "48h" : "7d";
    reasons.push({
      factor: "time proximity",
      contribution: factors.timeProximity,
      detail: `Published within ${label}`,
    });
  }
  if (factors.titleSimilarity > 0) {
    reasons.push({
      factor: "title similarity",
      contribution: factors.titleSimilarity,
      detail: "Similar title wording",
    });
  }
  if (factors.keywordOverlap > 0) {
    reasons.push({
      factor: "keyword overlap",
      contribution: factors.keywordOverlap,
      detail: "Overlapping keywords",
    });
  }
  if (factors.sameCountry > 0) {
    reasons.push({
      factor: "same country",
      contribution: factors.sameCountry,
      detail: "Same country of origin",
    });
  }
  return reasons.sort((a, b) => b.contribution - a.contribution);
}

export function computeRelationship(
  a: Record,
  b: Record,
  aFeatures?: PrecomputedFeatures,
  bFeatures?: PrecomputedFeatures,
): Relationship | null {
  if (a.id === b.id) return null;

  const factors = computeScoreFactors(a, b, aFeatures, bFeatures);
  const totalScore = Object.values(factors).reduce((s, v) => s + v, 0);

  if (totalScore < 35) return null;

  const type = determineRelationshipType(factors);
  const reasons = buildReasons(factors);

  return {
    record: b,
    score: totalScore,
    type,
    reasons,
  };
}

export function findRelated(
  record: Record,
  candidates: Record[],
  limit = 8,
  threshold = 35,
): Relationship[] {
  const results: Relationship[] = [];
  for (const candidate of candidates) {
    const rel = computeRelationship(record, candidate);
    if (rel) results.push(rel);
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function buildRelatedIndex(records: Record[]): Map<string, Relationship[]> {
  const features = new Map<string, PrecomputedFeatures>();
  for (const r of records) {
    features.set(r.id, precomputeFeatures(r));
  }
  const map = new Map<string, Relationship[]>();
  for (const r of records) {
    const rFeatures = features.get(r.id);
    const related: Relationship[] = [];
    for (const c of records) {
      if (c.id === r.id) continue;
      const cFeatures = features.get(c.id);
      const rel = computeRelationship(r, c, rFeatures, cFeatures);
      if (rel) related.push(rel);
    }
    map.set(r.id, related.sort((a, b) => b.score - a.score).slice(0, 15));
  }
  return map;
}
