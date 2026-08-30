import { SKILLS } from "@/lib/docs-data";

export function SkillsSection() {
  return (
    <section className="sec" id="skills">
      <div className="eyebrow">
        <span className="t">{SKILLS.eyebrow}</span>
        <span className="ln" />
      </div>
      {SKILLS.rows.map((row) => (
        <div className="job" key={row.label}>
          <span className="when">{row.label}</span>
          <div>
            <p>{row.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
