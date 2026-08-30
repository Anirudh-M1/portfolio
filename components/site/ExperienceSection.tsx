import { EXPERIENCE } from "@/lib/docs-data";

export function ExperienceSection() {
  return (
    <section className="sec" id="experience">
      <div className="eyebrow">
        <span className="t">{EXPERIENCE.eyebrow}</span>
        <span className="ln" />
      </div>
      <p className="co">{EXPERIENCE.company}</p>
      <span className="slabel">{EXPERIENCE.companyMeta}</span>
      {EXPERIENCE.jobs.map((job) => (
        <div className="job" key={job.title}>
          <span className="when">
            {job.when}
            <em>{job.emphasis}</em>
          </span>
          <div>
            <h4>{job.title}</h4>
            <p>{job.intro}</p>
            <ul className="pts">
              {job.bullets.map((b, i) => (
                // Bullets are authored copy (inline <b> for emphasis), not
                // user input, so dangerouslySetInnerHTML is the simplest
                // faithful render — same call the docs renderer makes.
                <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
              ))}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
