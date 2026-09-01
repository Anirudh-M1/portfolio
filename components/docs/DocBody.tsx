import { Fragment } from "react";
import Image from "next/image";
import type { DriveDoc, ProjectDoc, ReadmeDoc } from "@/lib/docs-data";

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
        {doc.heading[0]} {doc.heading[1]} <span className="sub" dangerouslySetInnerHTML={{ __html: doc.sub }} />
      </h1>
      <div className="porcol">
        <span className="por">
          <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${doc.portrait.src}`} alt={doc.portrait.alt} fill sizes="300px" />
        </span>
        <div className="links">
          {doc.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <p className="lede" dangerouslySetInnerHTML={{ __html: doc.lede }} />
      {doc.paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
      ))}
    </>
  );
}

function ProjectBody({ doc }: { doc: ProjectDoc }) {
  return (
    <>
      <p className="kick">{doc.kick}</p>
      <h2>{doc.heading}</h2>
      <div className="rule" />
      <div className="tags">
        {doc.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <dl>
        {doc.fields.map((f) => (
          <Fragment key={f.term}>
            <dt>{f.term}</dt>
            <dd dangerouslySetInnerHTML={{ __html: f.body }} />
          </Fragment>
        ))}
      </dl>
      {doc.links.length > 0 && (
        <div className="links">
          {doc.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

export function DocBody({ doc }: { doc: DriveDoc }) {
  if (doc.kind === "readme") return <ReadmeBody doc={doc} />;
  return <ProjectBody doc={doc} />;
}
