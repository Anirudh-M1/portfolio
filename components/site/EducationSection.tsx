import { EDUCATION } from "@/lib/docs-data";

export function EducationSection() {
  return (
    <section className="sec" id="education">
      <div className="eyebrow">
        <span className="t">{EDUCATION.eyebrow}</span>
        <span className="ln" />
      </div>
      <p className="co">{EDUCATION.school}</p>
      <span className="slabel">{EDUCATION.program}</span>
      <div className="job" style={{ marginTop: 6 }}>
        <span className="when">
          {EDUCATION.gpaLine}
          <em>{EDUCATION.gpaTag}</em>
        </span>
        <div>
          <p dangerouslySetInnerHTML={{ __html: EDUCATION.body }} />
          <ul className="pts">
            {EDUCATION.bullets.map((b, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
