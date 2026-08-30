// Single source of truth for every drive's content — the interactive CRT
// screen and the no-JS/small-screen `.docs` fallback both render straight
// from this data instead of two copies of the same copy drifting apart.
//
// The old prototype got this "for free" by scraping `innerHTML` off a
// hidden `<article>` per drive. That trick doesn't survive the move to
// React (SSR has nothing to scrape from until the client has already
// hydrated), so the data comes first here and both renderers read it.
//
// `body` fields are stored as small HTML strings rather than React nodes on
// purpose: the source copy uses inline `<b>` for emphasis throughout, and
// every value below is fully authored (not user input), so rendering it via
// `dangerouslySetInnerHTML` in `DocBody` is the simplest faithful port —
// no markdown parser, no rich-text AST, just the handful of tags the copy
// actually uses.

export type DocLink = { label: string; href: string };
export type DocField = { term: string; body: string };

interface DriveDocBase {
  /** Tray bank label, e.g. "01 · INTERNSHIP". Drives sharing a bank render
   * as one shingled group in the tray. */
  bank: string;
  /** Deep-link slug — also the `#hash` the machine boots from. */
  id: string;
  name: string;
  tag: string;
  part: string;
  cap: string;
  mount: string;
}

export interface ReadmeDoc extends DriveDocBase {
  kind: "readme";
  sub: string;
  portrait: { src: string; alt: string };
  lede: string;
  paragraphs: string[];
  links: DocLink[];
}

export interface ProjectDoc extends DriveDocBase {
  kind: "project";
  kick: string;
  /** h2 shown on the screen/doc — usually equals `name`, but a few entries
   * (Endpoint Pipeline, LLM Dev Assistant, DFA Workshop, Help Forum) use a
   * fuller title than the short name that fits the tray chip. */
  heading: string;
  tags: string[];
  fields: DocField[];
  links: DocLink[];
}

export type DriveDoc = ReadmeDoc | ProjectDoc;

/** Drives in tray order — this is also load order for keyboard/PREV-NEXT
 * navigation and the order banks are built in. */
export const DOCS: DriveDoc[] = [
  {
    kind: "readme",
    bank: "00 · START",
    id: "readme",
    name: "README",
    tag: "START HERE",
    part: "ANR-RM-2280",
    cap: "—",
    mount: "/home",
    sub: "Distributed systems &amp; backend infrastructure",
    portrait: { src: "/portrait.jpg", alt: "Anirudh Moholkar" },
    lede:
      "Computer Engineering at the University of Illinois Urbana-Champaign, graduating <b>May 2027</b>. Dean's List, James Scholar, Fiddler Innovation Award, <b>3.79</b> GPA.",
    paragraphs: [
      "Two consecutive engineering internships at <b>Zebra Technologies</b> — Cloud &amp; Computing in 2025, then AI &amp; Cloud Platform in 2026. Both shipped to production. The 2025 automation work was commended directly by Zebra's CIO.",
      "I build systems that hold up when something fails: fault-tolerant distributed storage, stream processing, kernels, and lately agentic AI over enterprise data. I care most about owning a problem end to end — finding it in the metrics, designing the fix, and being accountable for what it actually saved.",
      "Thirteen drives are in the tray below. Pick one and it loads.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/Anirudh-M1" },
      { label: "LinkedIn", href: "https://linkedin.com/in/amm21" },
      { label: "Email", href: "mailto:moholkar.anirudh@gmail.com" },
    ],
  },
  {
    kind: "project",
    bank: "01 · INTERNSHIP",
    id: "bom",
    name: "BOM Agent",
    tag: "PYTHON · RAG",
    part: "ANR-BM-2280",
    cap: "1 TB",
    mount: "/bom-agent",
    kick: "Agentic RAG over enterprise data · Zebra Technologies",
    heading: "BOM Agent",
    tags: ["Python", "RAG", "LangChain", "BigQuery", "Databricks", "Evals"],
    fields: [
      {
        term: "Problem",
        body: "When a component supplier goes dark, analysts have to hand cross-reference bill-of-materials blueprints to find alternate parts and transition schemes. It is slow, and it is exactly the moment you cannot afford slow — downstream fulfillment for <b>Amazon</b>, <b>Target</b> and <b>Walmart</b> depends on the answer.",
      },
      {
        term: "Approach",
        body: "Architected and deployed a conversational RAG agent inside the Zebra Data Lake, indexing proprietary BOM blueprints through <b>BigQuery</b> and <b>Databricks</b> so analysts can ask for alternate suppliers in natural language instead of reading spreadsheets.",
      },
      {
        term: "Evaluation",
        body: "Built a prompt evaluation harness with <b>150+</b> test cases and ran the agent against it every change. Accuracy moved from <b>71%</b> to <b>94%</b> and hallucinations dropped <b>60%</b>. The harness mattered more than any single prompt — without it, \"better\" was just a feeling.",
      },
      {
        term: "Result",
        body: "Deployed to production. Manual cross-referencing during supplier blackouts is gone.",
      },
    ],
    links: [],
  },
  {
    kind: "project",
    bank: "01 · INTERNSHIP",
    id: "pbi",
    name: "PBI Sentinel",
    tag: "PYTHON · INFRA",
    part: "ANR-PB-2280",
    cap: "512 GB",
    mount: "/pbi-sentinel",
    kick: "Autonomous infrastructure optimization · Zebra Technologies",
    heading: "PBI Sentinel",
    tags: ["Python", "GCP Cloud Run", "Databricks", "PostgreSQL", "MS Graph API", "Optimization"],
    fields: [
      {
        term: "Diagnosis",
        body: "Analyzed production metadata and found the cluster was hitting a <b>234%</b> concurrent load peak on P3 nodes, and that <b>27,000</b> report refreshes a month were running for reports nobody opened. The zombie reports were the evidence that the scheduling was unmanaged — they justified the work rather than being the fix.",
      },
      {
        term: "Approach",
        body: "Designed a greedy optimization algorithm using quadratic and exponential weighting to rank refresh jobs and redistribute them into optimal windows. The savings come from the redistribution, not from deleting anything.",
      },
      {
        term: "Autonomy",
        body: "Wrapped it in an agent on <b>GCP Cloud Run</b> reading Databricks Unity Catalog and PostgreSQL, which negotiates new refresh times directly with report owners over <b>Microsoft Teams</b> via the MS Graph API. It asks rather than reassigns, which is why people accepted it.",
      },
      {
        term: "Result",
        body: "Projected peak load held under <b>55%</b> capacity, saving <b>$11K/month</b>.",
      },
    ],
    links: [],
  },
];
