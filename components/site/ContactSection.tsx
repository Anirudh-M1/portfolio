import { CONTACT } from "@/lib/docs-data";

export function ContactSection() {
  return (
    <section className="sec contact" id="contact">
      <div className="eyebrow">
        <span className="t">{CONTACT.eyebrow}</span>
        <span className="ln" />
      </div>
      <h3>
        {CONTACT.headingLines[0]}
        <br />
        {CONTACT.headingLines[1]}
      </h3>
      <p className="body" style={{ marginBottom: 18 }}>
        {CONTACT.body}
      </p>
      <p>
        {CONTACT.links.map((link, i) => (
          <span key={link.href}>
            <a href={link.href}>{link.label}</a>
            {i < CONTACT.links.length - 1 && <br />}
          </span>
        ))}
      </p>
    </section>
  );
}
