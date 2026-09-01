import type { useOnboardingTour } from "./useOnboardingTour";
import "./tour.css";

export interface OnboardingTourProps {
  tour: ReturnType<typeof useOnboardingTour>;
}

/* Spotlight overlay driven by useOnboardingTour: the spotlight box tracks
 * whatever the current step's target is (or disappears entirely while
 * `veiled`, for a step whose target is mid-transition), the four blocking
 * panes fill in everywhere else so nothing outside the hole is
 * clickable, and the callout card shows the step's typed text, step
 * counter, wait indicator, and Next/Skip. Not rendered by anything yet —
 * Site.tsx mounts this in section H. */
export function OnboardingTour({ tour }: OnboardingTourProps) {
  const { spot } = tour;
  const L = spot?.left ?? 0,
    T = spot?.top ?? 0,
    W = spot?.width ?? 0,
    H = spot?.height ?? 0,
    OX = spot?.ox ?? 50,
    OY = spot?.oy ?? 50;
  // Two different things: whether there's a real rect to cut the
  // click-blocking panes' hole from (only false while veiled — a step
  // whose target isn't ready to be framed yet), and whether the
  // spotlight itself should be visible once there is one. A noHole step
  // (the tray) has a perfectly good rect — its hole still needs to let
  // clicks on the tray through — it just shouldn't render a visible box
  // around it.
  const noHole = tour.veiled || !spot;
  const spotOpacity = noHole || tour.hideSpotlight ? 0 : 1;

  return (
    <div className={`tut${tour.on ? " on" : ""}`} aria-live="polite">
      <div
        className={`spot${tour.tilts ? " tilt" : ""}`}
        style={{ left: L, top: T, width: W, height: H, opacity: spotOpacity, transformOrigin: `${OX}% ${OY}%` }}
      >
        <b />
        <b />
        <b />
        <b />
      </div>
      <div
        className="blk"
        data-blk="t"
        style={noHole ? { left: 0, top: 0, width: "100%", height: "100%" } : { left: 0, top: 0, width: "100%", height: Math.max(0, T) }}
      />
      <div
        className="blk"
        data-blk="b"
        style={
          noHole
            ? { width: 0, height: 0 }
            : { left: 0, top: T + H, width: "100%", height: `calc(100vh - ${T + H}px)` }
        }
      />
      <div
        className="blk"
        data-blk="l"
        style={noHole ? { width: 0, height: 0 } : { left: 0, top: T, width: Math.max(0, L), height: H }}
      />
      <div
        className="blk"
        data-blk="r"
        style={
          noHole
            ? { width: 0, height: 0 }
            : { left: L + W, top: T, width: `calc(100vw - ${L + W}px)`, height: H }
        }
      />
      <div className="tutcard">
        <div className="bar">
          <em style={{ fontStyle: "normal" }}>ANR / GUIDE</em>
          <span>
            STEP <b className="tstep">{tour.stepIndex + 1}</b> / <b className="ttotal">{tour.total}</b>
          </span>
        </div>
        <div className="scr">
          <span className="pfx">&gt;</span>
          <span className="ttext">{tour.typedText}</span>
          <span className="car" />
        </div>
        <div className="tutwait" hidden={!tour.waitMsg}>
          <i />
          <span className="twaitmsg">{tour.waitMsg}</span>
        </div>
        <div className="tact">
          <button className="tnext pri" type="button" disabled={!tour.nextEnabled || !!tour.waitMsg} onClick={tour.next}>
            {tour.isLast ? "Finish" : "Next"}
          </button>
          <button className="tskip" type="button" onClick={tour.skip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
