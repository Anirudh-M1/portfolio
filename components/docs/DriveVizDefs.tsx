/* Shared <defs> for every drive's visual panel — patterns, gradients,
 * markers and the "reg" corner mark, referenced by every DriveViz panel
 * via url(#id). Must exist exactly once in the DOM (ids aren't unique
 * across duplicates), which is why this mounts once in Site.tsx rather
 * than inside DriveViz itself: DocsFallback renders all twelve panels at
 * once on mobile, so a defs block per-panel would mean twelve copies of
 * the same ids. Ported verbatim from drive-visuals.html. */
export function DriveVizDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <pattern id="bpGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0 H0 V16" fill="none" stroke="rgba(150,185,172,.075)" strokeWidth="1" />
        </pattern>
        <pattern id="bpFine" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0 H0 V8" fill="none" stroke="rgba(150,185,172,.05)" strokeWidth=".5" />
        </pattern>
        <pattern id="hatchHot" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#E07B45" strokeWidth="1" opacity=".55" />
        </pattern>
        <linearGradient id="fadeAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3B34A" stopOpacity=".26" />
          <stop offset="1" stopColor="#E3B34A" stopOpacity=".06" />
        </linearGradient>
        <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3B34A" stopOpacity="0" />
          <stop offset="1" stopColor="#E3B34A" stopOpacity=".3" />
        </linearGradient>
        <marker id="ar" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 z" fill="rgba(150,185,172,.5)" />
        </marker>
        <marker id="arG" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 z" fill="#7FCFAA" />
        </marker>
        <marker id="arA" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 z" fill="#E3B34A" />
        </marker>
        <g id="reg">
          <path d="M0 0 h9 M0 0 v9" stroke="rgba(150,185,172,.28)" fill="none" />
        </g>
      </defs>
    </svg>
  );
}
