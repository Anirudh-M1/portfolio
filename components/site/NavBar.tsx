import "./nav-bar.css";

const LINKS = [
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Contact", href: "#contact" },
  // Resume link is intentionally omitted: the source design points it at
  // /Anirudh_Moholkar_Resume.pdf, which doesn't exist in public/ yet. Ship
  // it once the actual file is supplied rather than linking to a 404.
  { label: "GitHub", href: "https://github.com/Anirudh-M1" },
];

export function NavBar() {
  return (
    <header className="bar">
      <span className="who">Anirudh Moholkar</span>
      <span className="role">Distributed systems &amp; backend infrastructure</span>
      <nav>
        {LINKS.map((l) => (
          <a key={l.label} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
