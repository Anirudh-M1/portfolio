// Step data for the onboarding tour. Adapted from the old carrier-board
// design's walkthrough, not ported verbatim — that tour's gestures
// (drag-to-orbit the board, scroll-to-dock) don't exist in this design's
// interaction model at all. What's kept is the old tour's proven
// mechanics (spotlight-and-dim overlay, gesture-gated advancement via a
// signal rather than a timer, typewriter callout text, a localStorage
// seen-flag, a persistent "?" replay button); what's rebuilt is which DOM
// the steps point at and what they wait for — a tray chip click, the CRT
// screen, PREV/NEXT, and the nav bar links.
//
// Selectors rather than live element references, since this data has to
// exist before the machine/tour DOM does — useOnboardingTour resolves
// `at` against the current document each time it needs the target rect.

export type TourWaitKind = "chip" | "nav" | "loaded";

export interface TourStep {
  text: string;
  /** CSS selector for the element the spotlight frames. Falls back to
   * `.mon` if nothing matches — a missing target shouldn't collapse the
   * spotlight to a point somewhere off-screen. */
  at: string;
  pad?: number;
  wait?: TourWaitKind;
  waitMsg?: string;
  last?: boolean;
  /** Step renders veiled (full dim, no spotlight hole) until this signal
   * fires, instead of showing the hole the instant the step becomes
   * active. Distinct from `wait`: `wait` gates *advancing past* a step;
   * this gates the *reveal* of a step already showing — for the "it
   * boots right there" step specifically, whose target (#crt) sits
   * behind a fly-in/eject-and-insert sequence that takes far longer than
   * the fixed delay `signal()` advances steps on, so the hole would
   * otherwise land on the CRT well before anything is actually on it. */
  veilUntil?: TourWaitKind;
  /** True if `at` resolves to something inside .mon — those steps apply
   * .mon's own resting tilt (--mon-tilt) to the spotlight box so it
   * reads as flush against the monitor's tilted plane rather than a flat
   * rectangle floating in front of it. Left off for steps whose target
   * isn't part of the monitor (the tray, the top nav bar), which don't
   * tilt at all. */
  tilts?: boolean;
  /** No spotlight hole at all for this step — dim, but nothing framed.
   * Used for the tray step: highlighting the whole rail was redundant
   * once the spotlight itself already goes dark during a load (the
   * veilUntil steps), so the tray doesn't need its own separate
   * "look here" treatment on top of that. The text and the wait-for-a-
   * click gating are unaffected — this only turns off the hole. */
  noHole?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    text: "This is the machine. Thirteen projects live on the drives in the tray below: pick one and it loads onto the board.",
    at: ".mon",
    pad: 16,
    tilts: true,
  },
  {
    text: "Try it: click any drive in the tray.",
    at: ".rail",
    pad: 10,
    wait: "chip",
    waitMsg: "Click a drive in the tray",
  },
  {
    text: "It boots right there on the screen, like an old terminal coming up, then the project's actual write-up.",
    at: "#crt",
    pad: 12,
    veilUntil: "loaded",
    tilts: true,
  },
  {
    text: "Step through the rest without touching the tray at all.",
    at: ".stnav",
    pad: 10,
    wait: "nav",
    waitMsg: "Click PREV or NEXT",
    tilts: true,
  },
  {
    text: "Experience, Education and Contact are up here the whole time, whatever's loaded on the screen.",
    at: ".bar nav",
    pad: 12,
  },
  {
    text: "That's the whole machine. The ? in the corner brings this back any time.",
    at: ".mon",
    pad: 16,
    last: true,
    tilts: true,
  },
];
