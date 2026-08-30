import { DocBody } from "@/components/docs/DocBody";
import type { useCarrierMachine } from "./useCarrierMachine";
import "./machine.css";

export interface MonitorProps {
  machine: ReturnType<typeof useCarrierMachine>;
}

/* The monitor: bezel-less panel, built from boxes rather than an SVG since
 * the whole form is flat planes — CSS renders those more crisply than a
 * scaled vector would. The CRT's content now comes from useCarrierMachine:
 * an idle message, a typed boot log, or the completed drive doc rendered
 * through DocBody — the same renderer the .docs fallback uses, so the
 * screen and the fallback can never show different copy for the same
 * drive. PREV/NEXT are still unwired; that's section E's nav commit. */
export function Monitor({ machine }: MonitorProps) {
  const { screen, crtRef, onCrtClick } = machine;
  return (
    <div className="mon">
      <div className="panel">
        <div className="screen">
          <div
            className="crt"
            id="crt"
            ref={crtRef}
            tabIndex={0}
            role="region"
            aria-live="polite"
            aria-label="Monitor"
            onClick={onCrtClick}
          >
            {screen.kind === "idle" && (
              <div className="doc none">
                <b>NO DEVICE</b>
                <p>
                  The slot is empty. Choose a drive from the tray to load it.
                  <span className="cur" />
                </p>
              </div>
            )}
            {screen.kind === "boot" && (
              <pre className="post" dangerouslySetInnerHTML={{ __html: screen.lines.join("\n") }} />
            )}
            {screen.kind === "ready" && (
              <div className="doc">
                <DocBody doc={screen.doc} />
              </div>
            )}
          </div>
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
