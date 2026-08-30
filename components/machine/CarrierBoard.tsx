import "./machine.css";

/* The carrier board: one M.2 slot, drawn as an SVG rather than built from
 * CSS boxes like the monitor — this one has real curvature (chamfered
 * corners, rounded pads) an SVG describes far more cheaply than a stack of
 * gradients would. Static for now: the status line still reads "—" and
 * Eject is disabled — useCarrierMachine wires the real drive state and the
 * insert/eject flight animation into this in section E. */
export function CarrierBoard() {
  return (
    <div className="rig">
      <div className="righead">
        <span className="t">Carrier</span>
        <span className="ln" />
        <span className="st" id="status">
          —
        </span>
      </div>
      <div className="card">
        <div className="tilt">
          <svg viewBox="0 0 520 380" role="img" aria-label="Carrier card with one M.2 slot">
            <defs>
              <linearGradient id="fr4" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0C2C24" />
                <stop offset=".55" stopColor="#09221C" />
                <stop offset="1" stopColor="#061913" />
              </linearGradient>
              <linearGradient id="pins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#D3A03A" />
                <stop offset="1" stopColor="#8F5C33" />
              </linearGradient>
              <pattern id="weave" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(58)">
                <rect width="9" height="9" fill="none" />
                <path d="M0 0 H9" stroke="rgba(143,92,51,.16)" strokeWidth="1" />
              </pattern>
            </defs>

            <rect x="1" y="1" width="518" height="378" rx="7" fill="url(#fr4)" stroke="rgba(228,235,230,.14)" />
            <rect x="1" y="1" width="518" height="378" rx="7" fill="url(#weave)" />

            <text x="22" y="36" className="sk hi">
              ANR-CARRIER-01
            </text>
            <text x="22" y="52" className="sk">
              REV D · M.2 2280 · PCIe 4.0 x4
            </text>
            <text x="498" y="36" className="sk hi" textAnchor="end">
              MADE IN URBANA
            </text>
            <text x="498" y="52" className="sk" textAnchor="end">
              2024–2026
            </text>
            <path d="M22 64 H498" stroke="rgba(228,235,230,.12)" />
            <circle cx="14" cy="14" r="6" fill="#040E0B" stroke="rgba(211,160,58,.4)" />
            <circle cx="506" cy="14" r="6" fill="#040E0B" stroke="rgba(211,160,58,.4)" />

            {/* three lanes out of the socket, down the rail, into the switch */}
            <g className="tr">
              <path d="M456 166 H462 L470 174 V276 L462 284 H336" />
              <path d="M456 192 H470 L478 200 V284 L470 292 H336" />
              <path d="M456 218 H478 L486 226 V292 L478 300 H336" />
            </g>

            {/* socket */}
            <rect x="406" y="154" width="46" height="76" rx="2" fill="#061512" stroke="rgba(228,235,230,.16)" />
            <rect x="438" y="164" width="5" height="56" fill="url(#pins)" />
            {/* standoff the screw lands on, under the drive's notch when seated */}
            <circle cx="92" cy="192" r="8" fill="#0A211C" stroke="rgba(228,235,230,.22)" />
            <circle cx="92" cy="192" r="3" fill="#040E0B" />
            <path d="M92 148 V138 M412 148 V138" stroke="rgba(228,235,230,.1)" />
            <text x="92" y="132" className="sk">
              J1 · M.2 M-KEY · 2280
            </text>

            {/* activity LED */}
            <rect
              id="led"
              className="led"
              x="30"
              y="186"
              width="14"
              height="11"
              rx="1.5"
              fill="#0C221D"
              stroke="rgba(228,235,230,.18)"
            />
            <text x="30" y="180" className="sk d">
              D1
            </text>

            {/* boot ROM, in the empty band above the slot */}
            <rect x="296" y="88" width="66" height="30" rx="2" fill="#081E19" stroke="rgba(228,235,230,.18)" />
            <circle cx="302" cy="94" r="2.5" fill="rgba(228,235,230,.3)" />
            <text x="329" y="107" className="sk" textAnchor="middle">
              FLASH
            </text>
            <text x="384" y="107" className="sk">
              BOOT ROM
            </text>

            {/* passives */}
            <g fill="#0A211C" stroke="rgba(143,92,51,.5)">
              <rect x="128" y="96" width="10" height="6" rx="1" />
              <rect x="150" y="96" width="10" height="6" rx="1" />
              <rect x="172" y="96" width="10" height="6" rx="1" />
              <rect x="128" y="110" width="10" height="6" rx="1" />
              <rect x="150" y="110" width="10" height="6" rx="1" />
              <rect x="120" y="252" width="10" height="6" rx="1" />
              <rect x="142" y="252" width="10" height="6" rx="1" />
              <rect x="164" y="252" width="10" height="6" rx="1" />
              <rect x="238" y="112" width="10" height="6" rx="1" />
              <rect x="260" y="112" width="10" height="6" rx="1" />
              <rect x="330" y="252" width="10" height="6" rx="1" />
              <rect x="352" y="252" width="10" height="6" rx="1" />
            </g>
            <circle cx="196" cy="255" r="5" fill="#0A211C" stroke="rgba(228,235,230,.16)" />

            {/* power section */}
            <rect x="22" y="268" width="82" height="32" rx="2" fill="#081E19" stroke="rgba(228,235,230,.16)" />
            <text x="63" y="288" className="sk" textAnchor="middle">
              VREG 3V3
            </text>
            <circle cx="120" cy="284" r="9" fill="#0A211C" stroke="rgba(143,92,51,.6)" />
            <circle cx="142" cy="284" r="9" fill="#0A211C" stroke="rgba(143,92,51,.6)" />
            <rect x="22" y="314" width="12" height="10" rx="1.5" fill="#1E4A2C" stroke="rgba(132,228,95,.5)" />
            <text x="40" y="323" className="sk">
              PWR
            </text>

            {/* switch */}
            <rect x="190" y="266" width="146" height="56" rx="3" fill="#081E19" stroke="rgba(228,235,230,.2)" />
            <rect x="198" y="274" width="130" height="40" rx="2" fill="none" stroke="rgba(228,235,230,.07)" />
            <circle cx="200" cy="276" r="3" fill="rgba(228,235,230,.3)" />
            <text x="263" y="292" className="sk hi" textAnchor="middle">
              ANR-7714
            </text>
            <text x="263" y="305" className="sk" textAnchor="middle">
              PCIe SWITCH
            </text>

            {/* edge connector */}
            <path d="M62 340 H458 L446 374 H74 Z" fill="#08201A" stroke="rgba(228,235,230,.12)" />
            <g fill="url(#pins)" opacity=".72">
              {Array.from({ length: 19 }, (_, i) => (
                <rect key={i} x={84 + i * 19} y="348" width="8" height="20" />
              ))}
            </g>
            <text x="260" y="334" className="sk" textAnchor="middle">
              EDGE · x16 MECHANICAL
            </text>

            <style>{`
              .sk{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;
                  fill:rgba(228,235,230,.36)}
              .sk.hi{fill:rgba(211,160,58,.72)}
              .sk.d{font-size:11px;letter-spacing:.08em;fill:rgba(228,235,230,.5)}
              .tr path{fill:none;stroke:rgba(143,92,51,.55);stroke-width:1.4;
                  stroke-linecap:round;stroke-linejoin:round}
            `}</style>
          </svg>
          <div className="m2 seated" id="seated" hidden aria-hidden="true" />
        </div>
      </div>
      <button className="eject" id="eject" disabled>
        Eject
      </button>
    </div>
  );
}
