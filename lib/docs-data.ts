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
  /** Two-line display name for the h1 ("Anirudh" / "Moholkar"), rendered
   * with a hard <br> between them as in the source — distinct from the
   * drive's own `name` ("README"). */
  heading: [string, string];
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

export interface ExperienceJob {
  when: string;
  emphasis: string;
  title: string;
  intro: string;
  bullets: string[];
}

export interface ExperienceData {
  eyebrow: string;
  company: string;
  companyMeta: string;
  jobs: ExperienceJob[];
}

export const EXPERIENCE: ExperienceData = {
  eyebrow: "Experience",
  company: "Zebra Technologies",
  companyMeta: "Lincolnshire, Illinois · Two consecutive internships",
  jobs: [
    {
      when: "May – Aug 2026",
      emphasis: "AI & Cloud Platform",
      title: "Software Engineer Intern, AI & Cloud Platform",
      intro:
        "Owned two production systems: a conversational RAG agent over proprietary bill-of-materials data, and an autonomous agent that renegotiates the reporting cluster's own schedule.",
      bullets: [
        "Architected and deployed an enterprise RAG agent inside the Zebra Data Lake via <b>BigQuery</b> and <b>Databricks</b>, indexing BOM blueprints so analysts can query alternate suppliers and transition schemes in natural language during supplier blackouts, protecting fulfillment for Amazon, Target and Walmart.",
        "Diagnosed cluster bottlenecks from production metadata, surfacing a <b>234%</b> concurrent load peak on P3 nodes and <b>27K</b> monthly refreshes of reports nobody opened.",
        "Designed a greedy optimization algorithm using quadratic and exponential weighting to redistribute refresh windows, holding projected peak load under <b>55%</b> capacity and saving <b>$11K/month</b>.",
        "Shipped that as an autonomous agent on <b>GCP Cloud Run</b> reading Databricks Unity Catalog and PostgreSQL, negotiating new schedules directly with report owners over Microsoft Teams via the MS Graph API.",
        "Built a prompt evaluation harness with <b>150+</b> test cases, moving agent accuracy from <b>71%</b> to <b>94%</b> and cutting hallucinations <b>60%</b>.",
      ],
    },
    {
      when: "May – Aug 2025",
      emphasis: "Cloud & Computing",
      title: "Software Engineer Intern, Cloud & Computing",
      intro:
        "Rebuilt fleet metadata collection and wired it into vulnerability detection. The automation was commended directly by Zebra's Chief Information Officer, and the work earned the return offer above.",
      bullets: [
        "Engineered an asynchronous <b>Python</b> and <b>PowerShell</b> pipeline to extract and process system metadata, cutting runtime from <b>2.5 hours</b> to <b>under 2 minutes</b> across <b>10,000+</b> endpoints: a <b>98.5%</b> latency reduction.",
        "Implemented a scalable synchronization layer aggregating <b>ServiceNow</b> REST APIs against internal CMDB databases, automating vulnerability detection to isolate <b>3,386</b> security vulnerabilities.",
        "Eliminated <b>40</b> hours of manual audit work per cycle.",
      ],
    },
    {
      when: "May 2024 – Present",
      emphasis: "Executive Board",
      title: "Director of Operations, Design for America, UIUC",
      intro: "Managing delivery and architecture across the chapter's engineering teams.",
      bullets: [
        "Own SDLC and architecture across <b>7</b> teams totalling <b>56</b> members, directly leading two of them.",
        "Translated community requirements into MVPs and shipped <b>2</b> to live partners serving <b>100+</b> users.",
        "Engineered an open-source teaching workshop on a <b>Java 17</b> Spring Boot REST API with JPA, enforcing decoupled architecture through DTOs and mappers and a centralized <b>@ControllerAdvice</b> exception framework.",
      ],
    },
    {
      when: "Dec 2020 – May 2024",
      emphasis: "Founder",
      title: "Founder, Chicagoland Help Forum",
      intro: "Founded during the pandemic and run for over three years while enrolled full-time.",
      bullets: [
        "Scaled a community platform to <b>300+</b> users and raised <b>$5,400+</b> for under-served students with <b>100%</b> donor transparency.",
        "Designed and maintained a responsive <b>React</b> and <b>Node.js</b> platform generating <b>13,000+</b> page views in 2024, shipping continuous releases through a GitHub Actions CI/CD pipeline.",
      ],
    },
  ],
};

export interface EducationData {
  eyebrow: string;
  school: string;
  /** Two lines, rendered with a hard <br> between them: the two degrees,
   * each on its own line rather than run together. */
  programLines: [string, string];
  gpaLine: string;
  gpaTag: string;
  body: string;
  bullets: string[];
}

export const EDUCATION: EducationData = {
  eyebrow: "Education",
  school: "University of Illinois Urbana-Champaign",
  programLines: [
    "B.S. Computer Engineering · Grainger College of Engineering · Expected May 2027",
    "M.C.S. Computer Science · Expected May 2028",
  ],
  gpaLine: "GPA 3.79 / 4.0",
  gpaTag: "Dean's List",
  body: "James Scholar and recipient of the <b>Fiddler Innovation Award</b>.",
  bullets: [
    "<b>Systems:</b> Computer Systems &amp; Programming, Distributed Systems, Data Structures &amp; Algorithms",
    "<b>AI:</b> Artificial Intelligence, Applied Machine Learning, Reinforcement Learning",
  ],
};

export interface SkillsRow {
  label: string;
  body: string;
}

export interface SkillsData {
  eyebrow: string;
  rows: SkillsRow[];
}

export const SKILLS: SkillsData = {
  eyebrow: "Technical Skills",
  rows: [
    {
      label: "AI & Agentic",
      body: "Agentic workflows (ReAct / Reflection), LangChain, RAG architecture, vector databases (FAISS), prompt evaluation, LLM observability.",
    },
    {
      label: "Distributed & Infra",
      body: "Fault-tolerant architecture, microservices, Docker, GCP (Cloud Run), Databricks, CI/CD pipelines.",
    },
    {
      label: "Low-Level",
      body: "Linux kernel development, multithreading and concurrency, memory management, SystemVerilog, RISC-V and SLC-3 architecture, socket programming.",
    },
    {
      label: "Languages & Tools",
      body: "Python, C, C++, Java, JavaScript, SQL, Go, Git, gRPC, REST APIs, Jira.",
    },
  ],
};

export interface ContactData {
  eyebrow: string;
  /** Two lines, rendered with a hard <br> between them — chosen as an
   * explicit break rather than left to wrap. */
  headingLines: [string, string];
  body: string;
  links: DocLink[];
}

export const CONTACT: ContactData = {
  eyebrow: "Contact",
  headingLines: ["Open to Software", "Engineering roles"],
  body: "Happy to talk about any of the projects above.",
  links: [
    { label: "moholkar.anirudh@gmail.com", href: "mailto:moholkar.anirudh@gmail.com" },
    { label: "github.com/Anirudh-M1", href: "https://github.com/Anirudh-M1" },
    { label: "linkedin.com/in/amm21", href: "https://linkedin.com/in/amm21" },
  ],
};

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
    cap: "N/A",
    mount: "/home",
    heading: ["Anirudh", "Moholkar"],
    sub: "Software engineer, systems and product",
    portrait: { src: "/portrait.jpg", alt: "Anirudh Moholkar" },
    lede:
      "BS Computer Engineering, University of Illinois Urbana-Champaign, <b>May 2027</b><br />MCS Computer Science, University of Illinois Urbana-Champaign, <b>May 2028</b>",
    paragraphs: [
      "Dean's List, James Scholar, Fiddler Innovation Award, <b>3.79</b> GPA.",
      "Two consecutive engineering internships at <b>Zebra Technologies</b>: Cloud &amp; Computing in 2025, then AI &amp; Cloud Platform in 2026. Both shipped to production, with work commended directly by Zebra's CIO.",
      "I build systems that hold up when something fails. That's meant fault-tolerant storage across distributed nodes, stream processing under load, work down at the kernel level, and lately agentic AI over enterprise data. What I care about most is owning a problem end to end: finding it in the metrics, designing the fix, and being accountable for what it actually saved.",
      "There are thirteen drives in the tray below, each going deeper into my projects. Pick one and it'll load up.",
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
        body: "When a component supplier goes dark, analysts have to hand cross-reference bill-of-materials blueprints to find alternate parts and transition schemes. It is slow, and it is exactly the moment you cannot afford slow: downstream fulfillment for <b>Amazon</b>, <b>Target</b> and <b>Walmart</b> depends on the answer.",
      },
      {
        term: "Approach",
        body: "Architected and deployed a conversational RAG agent inside the Zebra Data Lake, indexing proprietary BOM blueprints through <b>BigQuery</b> and <b>Databricks</b> so analysts can ask for alternate suppliers in natural language instead of reading spreadsheets.",
      },
      {
        term: "Evaluation",
        body: "Built a prompt evaluation harness with <b>150+</b> test cases and ran the agent against it every change. Accuracy moved from <b>71%</b> to <b>94%</b> and hallucinations dropped <b>60%</b>. The harness mattered more than any single prompt. Without it, \"better\" was just a feeling.",
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
        body: "Analyzed production metadata and found the cluster was hitting a <b>234%</b> concurrent load peak on P3 nodes, and that <b>27,000</b> report refreshes a month were running for reports nobody opened. The zombie reports were the evidence that the scheduling was unmanaged. They justified the work rather than being the fix.",
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
  {
    kind: "project",
    bank: "01 · INTERNSHIP",
    id: "endpoint",
    name: "Endpoint Pipeline",
    tag: "PYTHON · AUTOMATION",
    part: "ANR-EP-2280",
    cap: "512 GB",
    mount: "/endpoint",
    kick: "Distributed infrastructure automation · Zebra Technologies",
    heading: "Endpoint Pipeline",
    tags: ["Python", "AsyncIO", "PowerShell", "ServiceNow", "CMDB", "REST"],
    fields: [
      {
        term: "Problem",
        body: "Collecting system metadata across the fleet took <b>2.5 hours</b> per run, which meant it effectively ran once and nobody trusted it as current.",
      },
      {
        term: "Approach",
        body: "Rebuilt the collector as an asynchronous Python and PowerShell pipeline, so endpoints are queried concurrently instead of walked in sequence.",
      },
      {
        term: "Security",
        body: "Added a synchronization layer aggregating <b>ServiceNow</b> REST APIs against the internal CMDB, automating vulnerability detection across the estate. It isolated <b>3,386</b> security vulnerabilities and removed <b>40</b> hours of manual audit per cycle.",
      },
      {
        term: "Result",
        body: "Runtime went from 2.5 hours to <b>under 2 minutes</b> across <b>10,000+</b> endpoints: a <b>98.5%</b> latency reduction. The work was commended directly by Zebra's <b>Chief Information Officer</b>.",
      },
    ],
    links: [],
  },
  {
    kind: "project",
    bank: "02 · DISTRIBUTED",
    id: "logquery",
    name: "Log Querier",
    tag: "GO · RPC",
    part: "ANR-LQ-2280",
    cap: "128 GB",
    mount: "/logquery",
    kick: "Distributed logging · ECE 428 · MP1",
    heading: "Log Querier",
    tags: ["Go", "RPC", "Distributed grep"],
    fields: [
      {
        term: "Problem",
        body: "Query log files scattered across a cluster from any single machine, without copying them all to one place first.",
      },
      {
        term: "Approach",
        body: "Every server holds a bidirectional RPC connection to every other. Connections form lazily: if a peer is not up yet the server keeps running and links when it appears, so the mesh tolerates nodes starting in any order. A query fans out from the local server, each remote runs <b>grep</b> against its own file, and results are aggregated on the caller.",
      },
      {
        term: "Benchmark",
        body: "Five trials across five pattern frequencies on four machines, against <b>~60 MB</b> of generated logs at <b>~150,000</b> lines per file. Latency is dominated by transfer and scales with match count rather than file size. With count-only queries it flattens to <b>~100 ms</b> across every pattern.",
      },
      {
        term: "Why it is here",
        body: "This became the instrumentation the next three projects were benchmarked and debugged with. It is the bottom of the stack.",
      },
    ],
    // The source links to a report PDF (/MP1-Distributed-Logging.pdf) that
    // doesn't exist in public/ yet. Per the plan, omit the link entirely
    // rather than ship a dead one — add it back once the file exists.
    links: [],
  },
  {
    kind: "project",
    bank: "02 · DISTRIBUTED",
    id: "membership",
    name: "Membership",
    tag: "GO · SWIM",
    part: "ANR-MB-2280",
    cap: "256 GB",
    mount: "/membership",
    kick: "Group membership · ECE 428 · MP2",
    heading: "Membership",
    tags: ["Go", "Gossip", "SWIM", "UDP"],
    fields: [
      {
        term: "Problem",
        body: "Every node needs an accurate view of who is alive, over lossy UDP, without the traffic growing out of control as the cluster does.",
      },
      {
        term: "Approach",
        body: "Built both protocols and measured them against each other. Gossip carries the full membership list in every heartbeat. Ping-ack sends a direct ping, falls back to indirect pings routed through peers, and carries only the five most recent events. Both run with and without a suspicion layer, where a node goes SUSPICIOUS before FAILED and can refute the claim by incrementing its incarnation number.",
      },
      {
        term: "Tuning",
        body: "Parameters were derived rather than guessed: a 3s detection and 6s cluster-wide dissemination requirement gives a protocol period of 0.1s, putting a full round trip through ten nodes at 1.9s.",
      },
      {
        term: "Result",
        body: "Gossip bandwidth climbs with cluster size because the payload is the membership list; ping-ack stays nearly flat, capped at five events per message. Gossip gains most from suspicion since it has no other defence against a dropped heartbeat. Ping-ack's indirect probes already provide that, so without suspicion ping-ack detects faster and false-positives less.",
      },
      {
        term: "Why it is here",
        body: "Both HyDFS and RainStorm run their failure detection on this layer rather than reimplementing it.",
      },
    ],
    // Source links to /MP2-Group-Membership.pdf — omitted, same reason as
    // Log Querier (file not supplied yet).
    links: [],
  },
  {
    kind: "project",
    bank: "02 · DISTRIBUTED",
    id: "rainstorm",
    name: "RainStorm",
    tag: "GO · STREAMING",
    part: "ANR-RS-2280",
    cap: "512 GB",
    mount: "/rainstorm",
    kick: "Distributed stream engine · ECE 428",
    heading: "RainStorm",
    tags: ["Go", "Goroutines", "RPC", "Scheduling", "Fault tolerance"],
    fields: [
      {
        term: "Problem",
        body: "Run continuous stateful operators over a stream without losing records when a worker dies mid-flight.",
      },
      {
        term: "Approach",
        body: "A leader-worker model where the leader schedules by load against a synchronized availability map. Operators run over a worker pool with at-least-once delivery, and state is checkpointed through HyDFS underneath. Routing supports shuffle, broadcast and fields-grouping.",
      },
      {
        term: "Fault tolerance",
        body: "A ping/ack channel system monitors tasks in real time and restarts them on failure, with the leader reassigning work when a member drops out.",
      },
      {
        term: "Benchmark",
        body: "Measured head-to-head against Spark Streaming on two Kaggle datasets: 7M lines of US traffic accidents and 23M lines of listening history for 500K users. On grep-replace Spark ran 503 tuples/sec to RainStorm's 322; on aggregate-transform, 2812 to 1757.",
      },
      {
        term: "Why it is slower",
        body: "About 40%, and the cause is specific: every output tuple and every log entry is a separate HyDFS append, so a run produces millions of one-line files and millions of requests. The bottleneck is the storage layer beneath it, not the scheduler. Batching appends and combining file output is the fix, and knowing exactly where the cost sits was the point of measuring.",
      },
    ],
    // Source links to /MP4-RainStorm.pdf — omitted, same reason as the
    // other ECE 428 MPs (file not supplied yet).
    links: [],
  },
  {
    kind: "project",
    bank: "02 · DISTRIBUTED",
    id: "hydfs",
    name: "HyDFS",
    tag: "GO · DISTRIBUTED FS",
    part: "ANR-HY-2280",
    cap: "512 GB",
    mount: "/hydfs",
    kick: "Fault-tolerant file system · ECE 428",
    heading: "HyDFS",
    tags: ["Go", "RPC", "HTTP", "Replication", "Eventual consistency"],
    fields: [
      {
        term: "Problem",
        body: "Keep files available and eventually consistent across a cluster where nodes crash and rejoin without warning.",
      },
      {
        term: "Approach",
        body: "A hybrid architecture that separates control flow from data flow: metadata moves over RPC, bulk transfers over HTTP, so metadata operations are not stuck behind large file writes. Files are stored as independent blocks, one per append, which is what makes concurrent writers cheap. Failure detection is not reimplemented here: it runs on the gossip membership layer from MP2.",
      },
      {
        term: "Consistency",
        body: "Eventual consistency at a replication factor of log(N) ≈ 3, with a background merge every 3 seconds reconciling blocks after a partition and re-replicating automatically on rejoin.",
      },
      {
        term: "Result",
        body: "Re-replication completes in ~3.6–3.9s and stays flat from 200 KB to 1 MB files: the cost is detection and merge interval, not transfer.",
      },
      {
        term: "What I would change",
        body: "Merge time is flat at ~0.17s no matter how many concurrent appends run, because appends already write to every replica synchronously. Merge downloads nothing in the common case, so it is insurance against partitions rather than part of the write path. Useful to know, but it means the design pays for a reconciliation pass it rarely needs.",
      },
    ],
    // Source links to /MP3-HyDFS.pdf — omitted, same reason as the other
    // ECE 428 MPs (file not supplied yet).
    links: [],
  },
  {
    kind: "project",
    bank: "03 · LOW-LEVEL",
    id: "kernel",
    name: "RV Kernel",
    tag: "C · RISC-V",
    part: "ANR-RV-2280",
    cap: "128 GB",
    mount: "/kernel",
    kick: "Operating system kernel · ECE 391",
    heading: "RV Kernel",
    tags: ["C", "RISC-V", "Virtual memory", "Scheduling", "IPC", "GDB"],
    fields: [
      {
        term: "Scope",
        body: "A kernel in C supporting full process lifecycles: context switching, a preemptive scheduler, and concurrent user-mode execution.",
      },
      {
        term: "Virtual memory",
        body: "A virtual memory manager with page table handling, lazy page allocation, and mapping logic specialized for per-process stack segments.",
      },
      {
        term: "System infrastructure",
        body: "An ELF loader for user binaries, and pipes for inter-process communication and I/O redirection.",
      },
      {
        term: "Result",
        body: "Reduced memory overhead <b>28%</b> under concurrent workloads by optimizing page allocation and address translation, and diagnosed low-level race conditions that only appeared under contention.",
      },
    ],
    links: [],
  },
  {
    kind: "project",
    bank: "03 · LOW-LEVEL",
    id: "frogger",
    name: "Frogger FPGA",
    tag: "SYSTEMVERILOG",
    part: "ANR-FR-2280",
    cap: "64 GB",
    mount: "/frogger",
    kick: "Hardware design · ECE 385",
    heading: "Frogger FPGA",
    tags: ["SystemVerilog", "FPGA", "MicroBlaze", "HDMI"],
    fields: [
      {
        term: "Scope",
        body: "A playable Frogger implemented in SystemVerilog on FPGA, with a MicroBlaze soft processor handling control and HDMI output driving the display.",
      },
      {
        term: "Related",
        body: "Also implemented SLC-3.2, a 16-bit RISC microprocessor in SystemVerilog, focused on instruction cycle timing and memory interfacing.",
      },
      {
        term: "Why it is here",
        body: "Most of my work is a few layers up. This is the layer everything else is standing on, and it is useful to have actually built it.",
      },
    ],
    links: [],
  },
  {
    kind: "project",
    bank: "04 · BUILT & LED",
    id: "llmdev",
    name: "LLM Assistant",
    tag: "PYTHON · AST RAG",
    part: "ANR-LD-2280",
    cap: "256 GB",
    mount: "/llm-assistant",
    kick: "Semantic code retrieval · personal",
    heading: "LLM Dev Assistant",
    tags: ["Python", "LangChain", "FAISS", "FastAPI", "AsyncIO", "AST"],
    fields: [
      {
        term: "Problem",
        body: "Naive RAG over source code chunks by line count, which splits functions in half and retrieves fragments that do not mean anything on their own.",
      },
      {
        term: "Approach",
        body: "Chunk by Abstract Syntax Tree instead: split on real functional boundaries like classes and methods, so every retrieved unit is something a model can reason about whole.",
      },
      {
        term: "Scale",
        body: "An asynchronous ingestion pipeline parallelizes embedding generation, holding sub-second retrieval across <b>10+</b> concurrent repositories, served behind FastAPI with logging on query-to-explanation performance and retrieval accuracy.",
      },
    ],
    links: [{ label: "Repository", href: "https://github.com/Anirudh-M1/llm-dev-assistant" }],
  },
  {
    kind: "project",
    bank: "04 · BUILT & LED",
    id: "dfa",
    name: "DFA Workshop",
    tag: "JAVA · SPRING BOOT",
    part: "ANR-DF-2280",
    cap: "256 GB",
    mount: "/dfa",
    kick: "Director of Operations · Design for America, UIUC",
    heading: "DFA Workshop",
    tags: ["Java 17", "Spring Boot", "JPA", "REST", "Maven"],
    fields: [
      {
        term: "Role",
        body: "Managing SDLC and architecture across <b>7</b> teams and <b>56</b> members, directly leading two. Translated community requirements into MVPs and shipped <b>2</b> to live partners serving <b>100+</b> users.",
      },
      {
        term: "Problem",
        body: "The teaching material was a monolithic single-file client. It worked, but it taught nobody how real systems are layered.",
      },
      {
        term: "Approach",
        body: "Rebuilt it as a Java 17 Spring Boot REST API with a strict Controller → Service → Repository chain, using DTOs and mappers to stop JPA entities leaking to clients, plus a centralized <b>@ControllerAdvice</b> handler that returns structured ApiError JSON instead of white-label stack traces.",
      },
      {
        term: "Frontend",
        body: "Decoupled layout, presentation and scripts, with an async fetch pipeline using lazy rendering and a fallback state cache so the client stays stable when the API does not.",
      },
    ],
    links: [{ label: "Repository", href: "https://github.com/Anirudh-M1/Full-Stack-Data-Design-Workshop" }],
  },
  {
    kind: "project",
    bank: "04 · BUILT & LED",
    id: "chicagoland",
    name: "Help Forum",
    tag: "REACT · FOUNDER",
    part: "ANR-CH-2280",
    cap: "256 GB",
    mount: "/chicagoland",
    kick: "Founder · Chicagoland Help Forum",
    heading: "Help Forum",
    tags: ["React", "Node.js", "GitHub Actions", "CI/CD"],
    fields: [
      {
        term: "Origin",
        body: "Founded during the pandemic to connect under-served students in the Chicago area with people who could help them.",
      },
      {
        term: "Impact",
        body: "Scaled to <b>300+</b> users and raised <b>$5,400+</b> with <b>100%</b> donor transparency, sustained over <b>3</b> years while enrolled full-time.",
      },
      {
        term: "Engineering",
        body: "A responsive full-stack React and Node.js platform that served <b>13,000+</b> page views in 2024, with continuous feature releases shipped through a <b>GitHub Actions</b> CI/CD pipeline.",
      },
      {
        term: "Why it is here",
        body: "It is the longest-running thing I have built, and the only one where I was accountable for the money.",
      },
    ],
    links: [],
  },
];
