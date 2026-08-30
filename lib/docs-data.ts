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
export const DOCS: DriveDoc[] = [];
