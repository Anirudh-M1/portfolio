import "./machine.css";

/* Static markup for the monitor: bezel-less panel, built from boxes rather
 * than an SVG since the whole form is flat planes — CSS renders those more
 * crisply than a scaled vector would. This component is inert for now
 * (empty screen, power light off, PREV/NEXT with no handlers) — the
 * useCarrierMachine hook that boots a drive into it and wires the buttons
 * lands in section E. */
export function Monitor() {
  return (
    <div className="mon">
      <div className="panel">
        <div className="screen">
          <div className="crt" id="crt" tabIndex={0} role="region" aria-live="polite" aria-label="Monitor" />
          <div className="statusline">
            <span id="stMount" aria-hidden="true">
              —
            </span>
            <span id="stPart" aria-hidden="true" />
            <span id="stLink" aria-hidden="true">
              NO LINK
            </span>
            <span className="stnav">
              <button type="button" id="prevD" aria-label="Previous drive">
                &#8249; PREV
              </button>
              <button type="button" id="nextD" aria-label="Next drive">
                NEXT &#8250;
              </button>
            </span>
          </div>
          <div className="glass" aria-hidden="true" />
        </div>
        <div className="chin" aria-hidden="true">
          <span className="wordmark">ANIRUDH</span>
          <span className="pwr" id="pwr" />
        </div>
      </div>
    </div>
  );
}
