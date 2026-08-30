import Image from "next/image";
import type { DriveDoc, ReadmeDoc } from "@/lib/docs-data";

/* DocBody renders the actual content for a drive — the same markup shape
 * is used in two very different-looking places: the plain `.docs` no-JS/
 * small-screen fallback, and the phosphor-styled CRT screen once the
 * machine exists. Rather than each place owning its own copy, both wrap
 * this component and let their own CSS (docs.css / docs-crt.css) theme the
 * same class names differently — which is exactly how the source
 * prototype's single `.docs` markup got reused for the CRT via a clone. */

function ReadmeBody({ doc }: { doc: ReadmeDoc }) {
  return (
    <>
      <h1>
        {doc.heading[0]}
        <br />
        {doc.heading[1]} <span className="sub" dangerouslySetInnerHTML={{ __html: doc.sub }} />
      </h1>
      <span className="por">
        <Image src={doc.portrait.src} alt={doc.portrait.alt} fill sizes="300px" />
      </span>
      <p className="lede" dangerouslySetInnerHTML={{ __html: doc.lede }} />
      {doc.paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
      ))}
      <div className="links">
        {doc.links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}

export function DocBody({ doc }: { doc: DriveDoc }) {
  if (doc.kind === "readme") return <ReadmeBody doc={doc} />;
  // Project-variant rendering lands in the next commit.
  return null;
}
