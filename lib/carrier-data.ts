// Content and tuning constants for the carrier board design — ported
// verbatim from carrier-v9.html. Keep in one file so feel-tuning (spacing,
// timing, easing) means editing here, not hunting through the component.

export type DriveSpec = {
  bay: string;
  name: string;
  meta: string;
  part: string;
  kick: string;
  stack: string[];
  specs: [string, string][];
  /** [label, url] pairs shown above the Seat button. Omit an entry rather
   * than pointing it at a dead link — leave the array empty until the real
   * URL exists. */
  links: [string, string][];
};

/** Deep-link slug for a drive, e.g. "BOM Agent" -> "bom-agent". */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const DRIVES: DriveSpec[] = [
  {
    bay: "J2",
    name: "RainStorm",
    meta: "GO · STREAM PROCESSING",
    part: "ANR-RS-2280",
    kick: "DISTRIBUTED STREAM ENGINE · ECE 428",
    stack: ["Go", "Goroutines/Channels", "Distributed Scheduling", "State Management"],
    specs: [
      [
        "Problem",
        "Support arbitrary execution topologies with exactly-once delivery semantics, and be able to say so with a benchmark rather than a claim.",
      ],
      [
        "Approach",
        "Leader-worker architecture with load-based scheduling over a synchronized availability map; a custom ping/ack channel system for task monitoring and automatic restart on failure; shuffle, broadcast, and fields-grouping routing semantics.",
      ],
      ["Result", "Benchmarked directly against Spark; exactly-once delivery held under induced worker failures."],
    ],
    links: [],
  },
  {
    bay: "J3",
    name: "HyDFS",
    meta: "C++ · DISTRIBUTED FS",
    part: "ANR-HY-2280",
    kick: "FAULT-TOLERANT FILE SYSTEM · ECE 428",
    stack: ["C++", "RPC", "HTTP", "Concurrent Programming"],
    specs: [
      [
        "Problem",
        "Stay available and eventually consistent across a multi-node cluster that will see partitions and crashes.",
      ],
      [
        "Approach",
        "Replication factor of 3 with concurrent write propagation; a background merge process reconciling file blocks after partitions or crashes; control flow (metadata over RPC) kept separate from data flow (transfers over HTTP) so coordination never sits on the bulk path.",
      ],
      ["Result", "Fault-tolerant under induced multi-node failures, with recovery driven entirely by the merge process."],
    ],
    links: [],
  },
  {
    bay: "J4",
    name: "BOM Agent",
    meta: "PYTHON · RAG",
    part: "ANR-BOM-2280",
    kick: "PROCUREMENT AGENT · ZEBRA",
    stack: ["Python", "BigQuery", "Databricks", "RAG"],
    specs: [
      ["Problem", "Your framing here — proprietary Zebra work, kept at architecture level."],
      [
        "Approach",
        "Retrieval-augmented agent over an enterprise data lake, built to support supply chain procurement workflows end to end.",
      ],
      ["Result", "Your accuracy figures. Keep projected and realized clearly separate."],
    ],
    links: [],
  },
  {
    bay: "J5",
    name: "PBI Sentinel",
    meta: "PYTHON · INFRA",
    part: "ANR-PBI-2280",
    kick: "INFRASTRUCTURE AGENT · ZEBRA",
    stack: ["Python", "Power BI API", "Scheduling", "HITL"],
    specs: [
      ["Problem", "Your framing here — proprietary Zebra work, kept at architecture level."],
      [
        "Approach",
        "Agentic human-in-the-loop workflow for report hygiene: usage telemetry surfaces unused and redundant assets, and nothing gets decommissioned until an owner confirms it.",
      ],
      ["Result", "Your savings figure, labeled projected if that's what it is."],
    ],
    links: [],
  },
  {
    bay: "J6",
    name: "RV Kernel",
    meta: "C · RISC-V",
    part: "ANR-RV-2280",
    kick: "OPERATING SYSTEM KERNEL · ECE 391",
    stack: ["C", "RISC-V", "Paging", "Scheduling"],
    specs: [
      [
        "Scope",
        "Traps, paging, scheduling, and a syscall surface, with no framework underneath any of it.",
      ],
      [
        "Hardest part",
        "Name the specific subsystem or bug that cost you the most. This is the line interviewers follow up on.",
      ],
      ["Why it matters", "The layer everything above it assumes works."],
    ],
    links: [],
  },
  {
    bay: "J7",
    name: "Frogger FPGA",
    meta: "SYSTEMVERILOG",
    part: "ANR-FG-2280",
    kick: "HARDWARE IMPLEMENTATION · ECE 385",
    stack: ["SystemVerilog", "FPGA", "VGA", "Synthesis"],
    specs: [
      ["Scope", "VGA timing, sprite memory, and collision logic, all synthesized to hardware."],
      ["Hardest part", "Timing closure or memory layout, whichever it actually was."],
      ["Why it matters", "Where the abstraction bottoms out."],
    ],
    links: [],
  },
];

export const G = {
  W: 560,
  H: 996,
  bayL: 50,
  bayW: 430,
  bayH: 104,
  gap: 24,
  top: 64,
  driveW: 406,
  driveH: 104,
  lift: 28,
  pull: 210,
};

export const CAM = {
  hero: { rx: 26, ry: -19, x: 250, y: 10, s: 0.94 },
  dock: { rx: 0, ry: 0, x: 0, y: 0, s: 1 },
  tiltRX: 58,
};

export const HEADER = { scale: 1.06, rotZ: -90, marginVW: 0.07, gapPx: 52, panelMax: 470 };

export const DRAG = { ySens: 0.34, xSens: 0.26, yClamp: 58, xClamp: 24, friction: 0.93, until: 0.55 };

/** shard assembly */
export const SH = { cell: 56, sweepSpan: 0.98, shardDur: 0.7, jitter: 0.14, fieldCount: 30 };

/** copy sweeps left to right across every line at once */
export const TXT = { span: 0.72, dur: 0.6, jitter: 0.09, lead: 0.34 };

/** disassembly: collapses right to left, back toward the standing drive */
export const OUT = { textSpan: 0.42, textDur: 0.46, shardLead: 0.3, shardSpan: 0.58, shardDur: 0.6, handoff: 1.08 };

/** beat of stillness after the drive lands vertical, before the panel builds */
export const HOLD = 0.34;
