export type Record = {
  id: string;
  publisher: string;
  title: string;
  published: string;
  archived: string;
  status: "VERIFIED" | "PENDING";
  hash: string;
  summary: string;
  sourceUrl: string;
  country: string;
  category: string;
};

export const SNAPSHOT = {
  date: "16 July 2026",
  isoDate: "2026-07-16",
  articles: 5824,
  sources: 214,
  countries: 42,
  generated: "23:58 UTC",
  status: "VERIFIED" as const,
  hash: "9f4a3b2e8c7d1a6f5b0e2c8d4a9f7b3e6c1d5a8f2b4e9c7d3a1f6b5e0c8d4a2f",
};

export const RECORDS: Record[] = [
  {
    id: "REC-2026-07-16-000091",
    publisher: "Reuters",
    title: "OpenAI announces new governance framework for frontier model deployment",
    published: "09:17 UTC",
    archived: "09:18 UTC",
    status: "VERIFIED",
    hash: "a3f9b21e8c4d5a6f7b2e9c1d0a8f4b6e3c7d2a1f5b9e8c4d6a3f1b7e2c9d5a8f",
    summary:
      "OpenAI published an updated governance framework describing internal review procedures for the deployment of frontier models. The document, released at 09:17 UTC on 16 July 2026, details a three-stage review process, an external audit requirement, and quarterly public reporting.",
    sourceUrl: "https://reuters.com/technology/openai-governance-framework-2026-07-16",
    country: "United States",
    category: "Technology",
  },
  {
    id: "REC-2026-07-16-000090",
    publisher: "Associated Press",
    title: "European Central Bank holds benchmark rate at 2.75 percent",
    published: "08:45 UTC",
    archived: "08:46 UTC",
    status: "VERIFIED",
    hash: "b7e2c9d5a8f1b3e6c4d7a2f9b5e8c1d0a3f6b9e4c2d7a5f8b1e3c6d9a4f2b7e5",
    summary:
      "The ECB Governing Council voted to maintain its main refinancing rate at 2.75 percent, citing continued moderation in core inflation and stable wage growth across the euro area.",
    sourceUrl: "https://apnews.com/ecb-rate-decision-2026-07-16",
    country: "European Union",
    category: "Economy",
  },
  {
    id: "REC-2026-07-16-000089",
    publisher: "BBC News",
    title: "UK Parliament passes updated Online Safety Amendment Act",
    published: "07:32 UTC",
    archived: "07:33 UTC",
    status: "VERIFIED",
    hash: "c1d5a8f2b4e9c7d3a1f6b5e0c8d4a2f9b7e3c6d1a5f8b2e4c9d7a3f1b6e5c0d8",
    summary:
      "The House of Commons voted 412 to 187 in favour of the Online Safety Amendment Act, adding provisions on algorithmic transparency and independent auditing of large platforms.",
    sourceUrl: "https://bbc.co.uk/news/uk-politics-online-safety-amendment-2026",
    country: "United Kingdom",
    category: "Politics",
  },
  {
    id: "REC-2026-07-16-000088",
    publisher: "Nature",
    title: "Peer-reviewed study documents accelerated glacial retreat in Patagonia",
    published: "06:00 UTC",
    archived: "06:01 UTC",
    status: "VERIFIED",
    hash: "d8a4f2b7e5c1d9a3f6b8e2c4d7a5f1b9e6c3d0a8f2b5e7c4d1a9f3b6e8c2d5a7",
    summary:
      "A study published in Nature reports a 14 percent acceleration in the retreat rate of six major Patagonian glaciers over the 2015–2025 decade, based on satellite altimetry.",
    sourceUrl: "https://nature.com/articles/s41586-026-glacial-retreat-patagonia",
    country: "International",
    category: "Science",
  },
  {
    id: "REC-2026-07-16-000087",
    publisher: "Le Monde",
    title: "France announces national digital archive expansion program",
    published: "05:20 UTC",
    archived: "05:21 UTC",
    status: "VERIFIED",
    hash: "e5c1d9a3f6b8e2c4d7a5f1b9e6c3d0a8f2b5e7c4d1a9f3b6e8c2d5a7d8a4f2b7",
    summary:
      "The Ministry of Culture unveiled a five-year program to expand the Bibliothèque nationale de France digital archive, targeting universal public access by 2031.",
    sourceUrl: "https://lemonde.fr/culture/archive-numerique-2026-07-16",
    country: "France",
    category: "Culture",
  },
  {
    id: "REC-2026-07-16-000086",
    publisher: "The Japan Times",
    title: "Japan and South Korea sign trilateral supply chain accord with Taiwan",
    published: "03:11 UTC",
    archived: "03:12 UTC",
    status: "VERIFIED",
    hash: "f2b5e7c4d1a9f3b6e8c2d5a7d8a4f2b7e5c1d9a3f6b8e2c4d7a5f1b9e6c3d0a8",
    summary:
      "Trade ministers from Japan, South Korea, and Taiwan signed a memorandum establishing a coordinated semiconductor supply chain resilience framework.",
    sourceUrl: "https://japantimes.co.jp/business/trilateral-accord-2026-07-16",
    country: "Japan",
    category: "Economy",
  },
  {
    id: "REC-2026-07-16-000085",
    publisher: "Deutsche Welle",
    title: "Germany completes final phase of national broadband infrastructure plan",
    published: "02:44 UTC",
    archived: "02:45 UTC",
    status: "VERIFIED",
    hash: "0a8f2b5e7c4d1a9f3b6e8c2d5a7d8a4f2b7e5c1d9a3f6b8e2c4d7a5f1b9e6c3d",
    summary:
      "The Federal Ministry for Digital Affairs confirmed completion of the national fibre-to-the-home rollout, achieving 98.4 percent household coverage.",
    sourceUrl: "https://dw.com/en/germany-broadband-completion-2026-07-16",
    country: "Germany",
    category: "Infrastructure",
  },
  {
    id: "REC-2026-07-16-000084",
    publisher: "Al Jazeera",
    title: "United Nations General Assembly adopts resolution on ocean plastic governance",
    published: "01:05 UTC",
    archived: "01:06 UTC",
    status: "VERIFIED",
    hash: "7d3a1f6b5e0c8d4a2f9b7e3c6d1a5f8b2e4c9d7a3f1b6e5c0d8c1d5a8f2b4e9c",
    summary:
      "The UN General Assembly adopted Resolution A/RES/81/214 establishing a binding framework for the reduction and monitoring of marine plastic pollution.",
    sourceUrl: "https://aljazeera.com/news/un-ocean-plastic-resolution-2026-07-16",
    country: "International",
    category: "Environment",
  },
];

export const PREVIOUS_SNAPSHOTS = [
  { date: "2026-07-15", articles: 5791, sources: 213, hash: "8c4d6a3f1b7e2c9d5a8f..." },
  { date: "2026-07-14", articles: 5764, sources: 213, hash: "2b4e9c7d3a1f6b5e0c8d..." },
  { date: "2026-07-13", articles: 5702, sources: 212, hash: "4a2f9b7e3c6d1a5f8b2e..." },
  { date: "2026-07-12", articles: 5688, sources: 212, hash: "9d5a8f2b4e9c7d3a1f6b..." },
  { date: "2026-07-11", articles: 5641, sources: 211, hash: "6c1d5a8f2b4e9c7d3a1f..." },
  { date: "2026-07-10", articles: 5619, sources: 211, hash: "1f6b5e0c8d4a2f9b7e3c..." },
  { date: "2026-07-09", articles: 5573, sources: 210, hash: "5f8b2e4c9d7a3f1b6e5c..." },
];
