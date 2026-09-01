import { DOCS } from "@/lib/docs-data";
import { DocBody } from "./DocBody";
import "./docs.css";

/* The no-JS / small-screen fallback. No interactivity at all — every
 * drive's content just sits in the document, in tray order, each as its
 * own <article>. This is also effectively the SSR content search engines
 * and no-JS visitors get, so it has to be real markup, not a loading
 * shell the interactive machine fills in later. */
export function DocsFallback() {
  return (
    <div className="docs" id="docs">
      {/* This container only ever renders where the interactive stage
       * doesn't fit (site.css's body.js media query) or can't run at all
       * (no-JS) — so this note never shows up alongside the real 3D
       * machine, only in place of it. */}
      <p className="docsnote">Viewing on mobile. For the full interactive 3D experience, use a desktop.</p>
      {DOCS.map((doc) => (
        <article key={doc.id} data-id={doc.id}>
          <DocBody doc={doc} />
        </article>
      ))}
    </div>
  );
}
