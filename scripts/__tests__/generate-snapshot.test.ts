import { describe, it, expect } from "vitest";
import {
  sha256,
  extractText,
  extractLink,
  parseFeedItems,
  isRecord,
  buildRecords,
  buildSnapshot,
  loadPreviousSnapshot,
} from "../generate-snapshot";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("sha256", () => {
  it("produces a known SHA-256 hash", () => {
    expect(sha256("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("produces a 64-character hex string", () => {
    const hash = sha256("The Public Record Archive");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different inputs", () => {
    expect(sha256("foo")).not.toBe(sha256("bar"));
  });
});

describe("extractText", () => {
  it("returns the string as-is", () => {
    expect(extractText("hello")).toBe("hello");
  });

  it("extracts text from an object with _ property", () => {
    expect(extractText({ _: "inner text" })).toBe("inner text");
  });

  it("extracts text from an object with #text property", () => {
    expect(extractText({ "#text": "cdata text" })).toBe("cdata text");
  });

  it("prefers _ over #text", () => {
    expect(extractText({ _: "underscore", "#text": "cdata" })).toBe("underscore");
  });

  it("returns empty string for null", () => {
    expect(extractText(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(extractText(undefined)).toBe("");
  });

  it("converts non-string primitives to string", () => {
    expect(extractText(42)).toBe("42");
  });
});

describe("extractLink", () => {
  it("returns a plain string link", () => {
    expect(extractLink({ link: "https://example.com" })).toBe("https://example.com");
  });

  it("extracts href from Atom-style link object", () => {
    expect(extractLink({ link: { $: { href: "https://example.com/atom" } } })).toBe(
      "https://example.com/atom",
    );
  });

  it("extracts href from fast-xml-parser v5 @_href attribute", () => {
    expect(extractLink({ link: { "@_href": "https://example.com/v5" } })).toBe(
      "https://example.com/v5",
    );
  });

  it("returns empty string for missing link", () => {
    expect(extractLink({})).toBe("");
  });

  it("returns empty string for null link", () => {
    expect(extractLink({ link: null })).toBe("");
  });

  it("returns empty string for empty link", () => {
    expect(extractLink({ link: "" })).toBe("");
  });
});

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isRecord("hello")).toBe(false);
  });
});

describe("parseFeedItems", () => {
  const defaultFeed = {
    source: "Test Source",
    country: "Test Country",
    category: "Test Category",
    url: "https://example.com",
  };

  it("parses RSS 2.0 items", () => {
    const xml = readFileSync(resolve(__dirname, "../../tests/fixtures/sample-rss.xml"), "utf-8");
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles).toHaveLength(3);
    expect(articles[0]).toMatchObject({
      title: "First Article",
      description: "Description of first article",
      link: "https://example.com/first",
      published: "Mon, 15 Jul 2026 10:00:00 GMT",
      source: "Test Source",
      country: "Test Country",
      category: "Test Category",
    });
    expect(articles[1].title).toBe("Second Article");
    expect(articles[2].title).toBe("(untitled)");
    expect(articles[2].description).toBe("Article with no title");
  });

  it("parses Atom feed items", () => {
    const xml = readFileSync(resolve(__dirname, "../../tests/fixtures/sample-atom.xml"), "utf-8");
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles).toHaveLength(2);
    expect(articles[0]).toMatchObject({
      title: "Atom Article 1",
      link: "https://example.com/atom/1",
      published: "2026-07-15T10:00:00Z",
      source: "Test Source",
    });
  });

  it("assigns the feed URL as fallback when an item has no link", () => {
    const xml = readFileSync(resolve(__dirname, "../../tests/fixtures/sample-rss.xml"), "utf-8");
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles[1].link).toBe("https://example.com/second");
  });

  it("excludes items without title or description", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><item><link>https://example.com</link></item></channel></rss>`;
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles).toHaveLength(0);
  });

  it("returns empty array for empty feed", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>`;
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles).toHaveLength(0);
  });

  it("returns empty array for malformed XML", () => {
    const articles = parseFeedItems("not xml", defaultFeed);
    expect(articles).toHaveLength(0);
  });

  it("uses fallback values for missing fields", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>Only Title</title></item></channel></rss>`;
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Only Title");
    expect(articles[0].description).toBe("Only Title");
    expect(articles[0].link).toBe(defaultFeed.url);
  });

  it("truncates descriptions to 2000 chars", () => {
    const longDesc = "X".repeat(3000);
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>Long</title><description>${longDesc}</description></item></channel></rss>`;
    const articles = parseFeedItems(xml, defaultFeed);
    expect(articles[0].description.length).toBe(2000);
  });
});

describe("buildRecords", () => {
  const articles = [
    {
      title: "Article 1",
      description: "Desc 1",
      link: "https://example.com/1",
      published: "Mon, 15 Jul 2026 10:00:00 GMT",
      source: "Source A",
      country: "US",
      category: "News",
    },
    {
      title: "Article 2",
      description: "Desc 2",
      link: "https://example.com/2",
      published: "Mon, 15 Jul 2026 11:00:00 GMT",
      source: "Source B",
      country: "UK",
      category: "Tech",
    },
  ];

  it("creates sequential IDs", () => {
    const records = buildRecords(articles, "2026-07-16", "2026-07-16T12:00:00.000Z");
    expect(records[0].id).toBe("REC-2026-07-16-000001");
    expect(records[1].id).toBe("REC-2026-07-16-000002");
  });

  it("assigns VERIFIED status", () => {
    const records = buildRecords(articles, "2026-07-16", "2026-07-16T12:00:00.000Z");
    expect(records[0].status).toBe("VERIFIED");
  });

  it("computes a SHA-256 hash for each record", () => {
    const records = buildRecords(articles, "2026-07-16", "2026-07-16T12:00:00.000Z");
    for (const r of records) {
      expect(r.hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("truncates summary to 1000 chars", () => {
    const longArticles = [
      {
        title: "Long",
        description: "D".repeat(2000),
        link: "https://example.com",
        published: "Mon, 15 Jul 2026 10:00:00 GMT",
        source: "Src",
        country: "US",
        category: "News",
      },
    ];
    const records = buildRecords(longArticles, "2026-07-16", "2026-07-16T12:00:00.000Z");
    expect(records[0].summary.length).toBe(1000);
  });

  it("includes all metadata fields", () => {
    const records = buildRecords(articles, "2026-07-16", "2026-07-16T12:00:00.000Z");
    expect(records[0]).toMatchObject({
      publisher: "Source A",
      title: "Article 1",
      published: "Mon, 15 Jul 2026 10:00:00 GMT",
      archived: "2026-07-16T12:00:00.000Z",
      sourceUrl: "https://example.com/1",
      country: "US",
      category: "News",
    });
  });
});

describe("buildSnapshot", () => {
  const now = "2026-07-16T12:00:00.000Z";
  const records = buildRecords(
    [
      {
        title: "A1",
        description: "D1",
        link: "https://a.com/1",
        published: "Mon, 15 Jul 2026 10:00:00 GMT",
        source: "Src A",
        country: "US",
        category: "News",
      },
      {
        title: "A2",
        description: "D2",
        link: "https://a.com/2",
        published: "Mon, 15 Jul 2026 11:00:00 GMT",
        source: "Src A",
        country: "US",
        category: "Tech",
      },
      {
        title: "A3",
        description: "D3",
        link: "https://b.com/3",
        published: "Mon, 15 Jul 2026 12:00:00 GMT",
        source: "Src B",
        country: "UK",
        category: "News",
      },
    ],
    "2026-07-16",
    now,
  );

  it("computes article count from records length", () => {
    const snapshot = buildSnapshot(records, "2026-07-16", "July 16, 2026", "12:00:00 UTC");
    expect(snapshot.articles).toBe(3);
  });

  it("computes unique source count", () => {
    const snapshot = buildSnapshot(records, "2026-07-16", "July 16, 2026", "12:00:00 UTC");
    expect(snapshot.sources).toBe(2);
  });

  it("computes unique country count", () => {
    const snapshot = buildSnapshot(records, "2026-07-16", "July 16, 2026", "12:00:00 UTC");
    expect(snapshot.countries).toBe(2);
  });

  it("sets VERIFIED status", () => {
    const snapshot = buildSnapshot(records, "2026-07-16", "July 16, 2026", "12:00:00 UTC");
    expect(snapshot.status).toBe("VERIFIED");
  });

  it("computes a SHA-256 hash of the records JSON", () => {
    const snapshot = buildSnapshot(records, "2026-07-16", "July 16, 2026", "12:00:00 UTC");
    expect(snapshot.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("includes date and generation metadata", () => {
    const snapshot = buildSnapshot(records, "2026-07-16", "July 16, 2026", "12:00:00 UTC");
    expect(snapshot).toMatchObject({
      date: "July 16, 2026",
      isoDate: "2026-07-16",
      generated: "12:00:00 UTC",
    });
  });
});

describe("loadPreviousSnapshot", () => {
  it("returns a snapshot when data/latest.json exists", async () => {
    const result = await loadPreviousSnapshot();
    expect(result).not.toBeNull();
    if (result) {
      expect(result).toHaveProperty("isoDate");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("records");
    }
  });
});
