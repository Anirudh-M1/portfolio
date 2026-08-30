export function SiteFooter() {
  return (
    <footer>
      <span className="slabel">Anirudh Moholkar · 2026</span>
      {/* Source prototype's line here was "Built from scratch · no
          framework" — true of the hand-rolled HTML/CSS/JS prototype, no
          longer true once it's a Next.js/React rebuild. Adapted rather
          than carried over verbatim so the footer stays honest. */}
      <span className="slabel">Built with Next.js &amp; React</span>
    </footer>
  );
}
