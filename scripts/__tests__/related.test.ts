import { describe, it, expect } from "vitest";
import type { Record } from "../../src/lib/data";
import {
  extractSignificantWords,
  jaccardSimilarity,
  hoursBetween,
  computeScoreFactors,
  determineRelationshipType,
  buildReasons,
  computeRelationship,
  findRelated,
} from "../../src/lib/related";

function makeRecord(overrides: Partial<Record> & { id: string }): Record {
  return {
    id: overrides.id,
    publisher: overrides.publisher ?? "Test Publisher",
    title: overrides.title ?? "Test Title",
    published: overrides.published ?? "2026-07-17T10:00:00Z",
    archived: overrides.archived ?? "2026-07-17T12:00:00Z",
    status: "VERIFIED",
    hash: overrides.hash ?? "abc",
    summary: overrides.summary ?? "Test summary text",
    sourceUrl: overrides.sourceUrl ?? "https://example.com/test",
    country: overrides.country ?? "United States",
    category: overrides.category ?? "News",
  };
}

describe("extractSignificantWords", () => {
  it("extracts words of 4+ chars excluding stop words", () => {
    const words = extractSignificantWords("The quick brown fox jumps over the lazy dog");
    expect(words).toContain("quick");
    expect(words).toContain("brown");
    expect(words).toContain("jumps");
    expect(words).toContain("lazy");
    expect(words).not.toContain("the");
    expect(words).not.toContain("over");
  });

  it("deduplicates words", () => {
    const words = extractSignificantWords("quick quick brown brown");
    expect(words).toEqual(["quick", "brown"]);
  });

  it("removes punctuation", () => {
    const words = extractSignificantWords("President's speech: 'We will rebuild!'");
    expect(words).toContain("president");
    expect(words).toContain("speech");
    expect(words).toContain("rebuild");
  });

  it("returns empty array for short input", () => {
    expect(extractSignificantWords("a an the")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractSignificantWords("")).toEqual([]);
  });

  it("handles mixed case", () => {
    const words = extractSignificantWords("Breaking NEWS: Major Earthquake");
    expect(words).toContain("breaking");
    expect(words).toContain("news");
    expect(words).toContain("major");
    expect(words).toContain("earthquake");
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1 for identical sets", () => {
    expect(jaccardSimilarity(["a", "b"], ["a", "b"])).toBe(1);
  });

  it("returns 0 for disjoint sets", () => {
    expect(jaccardSimilarity(["a", "b"], ["c", "d"])).toBe(0);
  });

  it("returns correct score for partial overlap", () => {
    const score = jaccardSimilarity(["a", "b", "c"], ["b", "c", "d"]);
    // intersection = {b, c} = 2, union = {a, b, c, d} = 4, score = 0.5
    expect(score).toBe(0.5);
  });

  it("returns 0 when both sets are empty", () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });

  it("returns 0 when one set is empty", () => {
    expect(jaccardSimilarity(["a"], [])).toBe(0);
  });
});

describe("hoursBetween", () => {
  it("returns correct hours for same-day dates", () => {
    const hrs = hoursBetween("2026-07-17T10:00:00Z", "2026-07-17T14:00:00Z");
    expect(hrs).toBe(4);
  });

  it("returns correct hours for cross-day dates", () => {
    const hrs = hoursBetween("2026-07-17T10:00:00Z", "2026-07-18T10:00:00Z");
    expect(hrs).toBe(24);
  });

  it("returns null for invalid dates", () => {
    expect(hoursBetween("invalid", "2026-07-17T10:00:00Z")).toBeNull();
    expect(hoursBetween("2026-07-17T10:00:00Z", "garbage")).toBeNull();
  });

  it("returns 0 for identical dates", () => {
    expect(hoursBetween("2026-07-17T10:00:00Z", "2026-07-17T10:00:00Z")).toBe(0);
  });
});

describe("computeScoreFactors", () => {
  it("scores same publisher at 30", () => {
    const a = makeRecord({ id: "R1", publisher: "BBC", title: "Storm warning issued" });
    const b = makeRecord({ id: "R2", publisher: "BBC", title: "Storm damage reports" });
    const factors = computeScoreFactors(a, b);
    expect(factors.samePublisher).toBe(30);
  });

  it("scores different publisher at 0", () => {
    const a = makeRecord({ id: "R1", publisher: "BBC" });
    const b = makeRecord({ id: "R2", publisher: "CNN" });
    const factors = computeScoreFactors(a, b);
    expect(factors.samePublisher).toBe(0);
  });

  it("scores time proximity within 24h at 15", () => {
    const a = makeRecord({ id: "R1", published: "2026-07-17T10:00:00Z" });
    const b = makeRecord({ id: "R2", published: "2026-07-17T14:00:00Z" });
    const factors = computeScoreFactors(a, b);
    expect(factors.timeProximity).toBe(15);
  });

  it("scores time proximity within 48h at 10", () => {
    const a = makeRecord({ id: "R1", published: "2026-07-17T10:00:00Z" });
    const b = makeRecord({ id: "R2", published: "2026-07-18T20:00:00Z" });
    const factors = computeScoreFactors(a, b);
    expect(factors.timeProximity).toBe(10);
  });

  it("scores same category at 10", () => {
    const a = makeRecord({ id: "R1", category: "Technology" });
    const b = makeRecord({ id: "R2", category: "Technology" });
    const factors = computeScoreFactors(a, b);
    expect(factors.categoryMatch).toBe(10);
  });

  it("scores title similarity based on word overlap", () => {
    const a = makeRecord({ id: "R1", title: "President signs new climate agreement" });
    const b = makeRecord({ id: "R2", title: "President rejects climate deal" });
    const factors = computeScoreFactors(a, b);
    // shared words: president, climate = 2; union: 6 → jaccard = 0.333 → score ≈ 8
    expect(factors.titleSimilarity).toBeGreaterThan(5);
    expect(factors.titleSimilarity).toBeLessThanOrEqual(25);
  });
});

describe("determineRelationshipType", () => {
  it("returns same publisher when publisher score dominates", () => {
    const type = determineRelationshipType({
      samePublisher: 30,
      categoryMatch: 0,
      timeProximity: 0,
      titleSimilarity: 0,
      keywordOverlap: 0,
      sameCountry: 0,
    });
    expect(type).toBe("same publisher");
  });

  it("returns similar topic when title similarity is high", () => {
    const type = determineRelationshipType({
      samePublisher: 0,
      categoryMatch: 0,
      timeProximity: 0,
      titleSimilarity: 15,
      keywordOverlap: 0,
      sameCountry: 0,
    });
    expect(type).toBe("similar topic");
  });

  it("returns same category when category dominates", () => {
    const type = determineRelationshipType({
      samePublisher: 0,
      categoryMatch: 10,
      timeProximity: 0,
      titleSimilarity: 3,
      keywordOverlap: 0,
      sameCountry: 0,
    });
    expect(type).toBe("same category");
  });

  it("returns follow-up when time proximity is strong", () => {
    const type = determineRelationshipType({
      samePublisher: 0,
      categoryMatch: 0,
      timeProximity: 15,
      titleSimilarity: 5,
      keywordOverlap: 0,
      sameCountry: 0,
    });
    expect(type).toBe("follow-up");
  });
});

describe("buildReasons", () => {
  it("returns sorted reasons by contribution descending", () => {
    const reasons = buildReasons({
      samePublisher: 30,
      categoryMatch: 10,
      timeProximity: 5,
      titleSimilarity: 0,
      keywordOverlap: 0,
      sameCountry: 0,
    });
    expect(reasons[0].factor).toBe("same publisher");
    expect(reasons[0].contribution).toBe(30);
    expect(reasons[1].factor).toBe("same category");
    expect(reasons[2].factor).toBe("time proximity");
  });

  it("includes detail strings", () => {
    const reasons = buildReasons({
      samePublisher: 30,
      categoryMatch: 0,
      timeProximity: 15,
      titleSimilarity: 0,
      keywordOverlap: 0,
      sameCountry: 0,
    });
    expect(reasons[0].detail).toBe("Same publisher");
    expect(reasons[1].detail).toContain("24h");
  });
});

describe("computeRelationship", () => {
  it("returns null for identical record ids", () => {
    const r = makeRecord({ id: "R1" });
    expect(computeRelationship(r, r)).toBeNull();
  });

  it("returns null when score is below threshold (35)", () => {
    const a = makeRecord({ id: "R1", publisher: "Pub A", category: "Tech", title: "Alpha" });
    const b = makeRecord({ id: "R2", publisher: "Pub B", category: "Health", title: "Beta" });
    const rel = computeRelationship(a, b);
    expect(rel).toBeNull();
  });

  it("returns a relationship for strong matches", () => {
    const a = makeRecord({
      id: "R1",
      publisher: "BBC",
      category: "News",
      title: "Storm warning issued",
      published: "2026-07-17T10:00:00Z",
    });
    const b = makeRecord({
      id: "R2",
      publisher: "BBC",
      category: "News",
      title: "Storm damage reported",
      published: "2026-07-17T14:00:00Z",
    });
    const rel = computeRelationship(a, b);
    expect(rel).not.toBeNull();
    if (rel) {
      expect(rel.score).toBeGreaterThanOrEqual(35);
      expect(rel.type).toBe("same publisher");
      expect(rel.reasons.length).toBeGreaterThan(0);
      expect(rel.record.id).toBe("R2");
    }
  });

  it("includes score and reasons in the relationship", () => {
    const a = makeRecord({
      id: "R1",
      publisher: "BBC",
      category: "News",
      title: "Election results",
      published: "2026-07-17T10:00:00Z",
    });
    const b = makeRecord({
      id: "R2",
      publisher: "BBC",
      category: "News",
      title: "Election analysis",
      published: "2026-07-17T16:00:00Z",
    });
    const rel = computeRelationship(a, b);
    expect(rel).not.toBeNull();
    if (rel) {
      expect(rel.score).toBeGreaterThan(0);
      expect(rel.reasons.length).toBeGreaterThan(1);
    }
  });
});

describe("findRelated", () => {
  it("returns empty array when no candidates meet threshold", () => {
    const record = makeRecord({
      id: "R1",
      publisher: "BBC",
      category: "News",
      title: "Sports results",
      summary: "Scores and highlights from today",
    });
    const candidates = [
      makeRecord({
        id: "R2",
        publisher: "TechBlog",
        category: "Technology",
        title: "Server deployment guide",
        summary: "How to deploy cloud infrastructure",
        published: "2026-05-01T10:00:00Z",
      }),
      makeRecord({
        id: "R3",
        publisher: "HealthNews",
        category: "Health",
        title: "New drug trial results",
        summary: "Clinical study shows promise for treatment",
        published: "2026-04-15T10:00:00Z",
      }),
    ];
    const related = findRelated(record, candidates);
    expect(related).toHaveLength(0);
  });

  it("returns related records sorted by descending score", () => {
    const record = makeRecord({
      id: "R1",
      publisher: "BBC",
      category: "News",
      title: "Election",
      published: "2026-07-17T10:00:00Z",
    });
    const candidates = [
      makeRecord({
        id: "R2",
        publisher: "BBC",
        category: "News",
        title: "Election updates",
        published: "2026-07-17T12:00:00Z",
      }),
      makeRecord({
        id: "R3",
        publisher: "BBC",
        title: "Sports results",
        published: "2026-07-17T14:00:00Z",
      }),
    ];
    const related = findRelated(record, candidates);
    expect(related.length).toBeGreaterThan(0);
    for (let i = 1; i < related.length; i++) {
      expect(related[i - 1].score).toBeGreaterThanOrEqual(related[i].score);
    }
  });

  it("respects the limit parameter", () => {
    const record = makeRecord({ id: "R1", publisher: "CNN", category: "News", title: "Breaking" });
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `R${i + 2}`, publisher: "CNN", category: "News", title: `Story ${i}` }),
    );
    const related = findRelated(record, candidates, 3);
    expect(related.length).toBeLessThanOrEqual(3);
  });

  it("applies custom threshold", () => {
    const record = makeRecord({
      id: "R1",
      publisher: "PubA",
      category: "Sports",
      title: "Game scores",
      summary: "Results from today",
      country: "UK",
    });
    const candidates = [
      makeRecord({
        id: "R2",
        publisher: "PubB",
        category: "Tech",
        title: "Server updates",
        summary: "Release notes for new version",
        country: "Japan",
        published: "2026-03-01T10:00:00Z",
      }),
    ];
    const related = findRelated(record, candidates, 5, 100);
    expect(related).toHaveLength(0);
  });
});
