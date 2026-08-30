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
      {DOCS.map((doc) => (
        <article key={doc.id} data-id={doc.id}>
          <DocBody doc={doc} />
        </article>
      ))}
    </div>
  );
}
