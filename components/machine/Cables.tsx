import "./machine.css";

/* Drawn in .top's own coordinate space and re-pathed by useCarrierMachine's
 * drawCables() (section E), so the cable stays plugged in at both ends
 * whenever the layout moves. Structure only for now — the `d` attributes
 * and connector transforms are set imperatively once the machine exists,
 * the same way the source prototype re-paths these on every frame the
 * board tilts or the monitor floats. */
export function Cables() {
  return (
    <svg className="cables" id="cables" aria-hidden="true">
      <defs>
        <linearGradient id="connFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C3634" />
          <stop offset=".45" stopColor="#1A2320" />
          <stop offset="1" stopColor="#0A100E" />
        </linearGradient>
      </defs>
      {/* A cable is a cylinder, so it needs three passes: a dark jacket, a
          lighter body, and a thin highlight riding its upper edge. One flat
          stroke reads as a drawn line; the highlight is what makes it read
          as round. */}
      <path className="sheath" id="c0" />
      <path className="sheath" id="c1" />
      <path className="sheath" id="c2" />
      <path className="core" id="k0" />
      <path className="core" id="k1" />
      <path className="core" id="k2" />
      <path className="shine" id="s0" />
      <path className="shine" id="s1" />
      <path className="shine" id="s2" />
      {/* Connectors are built from the parts a real one has: a moulded
          strain relief boot where the cable enters, the housing, a metal
          shell that mates with the port, and thumbscrews. A bare rectangle
          reads as a placeholder; the boot in particular is what sells it. */}
      <g className="conn" id="pA">
        <rect className="boot" x="6" y="-9" width="13" height="18" rx="4" />
        <rect className="body" x="-6" y="-15" width="14" height="30" rx="2.5" />
        <rect className="shell" x="-13" y="-12" width="8" height="24" rx="1.5" />
        <circle className="screw" cx="-9" cy="-7" />
        <circle className="screw" cx="-9" cy="7" />
        <rect className="lip" x="-6" y="-15" width="14" height="2.4" rx="1.2" />
      </g>
      <g className="conn" id="pB">
        <rect className="boot" x="-18" y="-8" width="12" height="16" rx="4" />
        <rect className="body" x="-7" y="-13" width="13" height="26" rx="2.5" />
        <rect className="shell" x="5" y="-10" width="7" height="20" rx="1.5" />
        <circle className="screw" cx="8" cy="-6" />
        <circle className="screw" cx="8" cy="6" />
        <rect className="lip" x="-7" y="-13" width="13" height="2.2" rx="1.1" />
      </g>
    </svg>
  );
}
