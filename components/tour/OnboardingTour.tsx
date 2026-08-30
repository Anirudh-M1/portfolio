import { TOUR_STEPS } from "@/lib/tour-steps";
import "./tour.css";

/* Static overlay markup — inert for now. useOnboardingTour (next commit)
 * drives the spotlight's position, the typewriter text, the step counter
 * and the wait indicator; this component just needs to exist with the
 * right shape and class names for that hook to attach to. Not rendered by
 * anything yet — Site.tsx mounts this in section H. */
export function OnboardingTour() {
  return (
    <div className="tut" aria-live="polite">
      <div className="spot">
        <b />
        <b />
        <b />
        <b />
      </div>
      <div className="blk" data-blk="t" />
      <div className="blk" data-blk="r" />
      <div className="blk" data-blk="b" />
      <div className="blk" data-blk="l" />
      <div className="tutcard">
        <div className="bar">
          <em style={{ fontStyle: "normal" }}>ANR / GUIDE</em>
          <span>
            STEP <b className="tstep">1</b> / <b className="ttotal">{TOUR_STEPS.length}</b>
          </span>
        </div>
        <div className="scr">
          <span className="pfx">&gt;</span>
          <span className="ttext" />
          <span className="car" />
        </div>
        <div className="tutwait" hidden>
          <i />
          <span className="twaitmsg" />
        </div>
        <div className="tact">
          <button className="tnext pri" type="button">
            Next
          </button>
          <button className="tskip" type="button">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
