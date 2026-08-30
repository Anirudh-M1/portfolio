// Hand-rolled easing/timeline system, ported byte-for-byte from the source
// prototype's <script> block. This is deliberately NOT routed through
// gsap: gsap's power curves are approximated here as plain functions
// (E.p2in/p2out/p2io/p3io/backout are literally "GSAP's power curves,
// written out" per the source's own comment), and a generic timeline()
// driver replaces gsap's Timeline. Doing the animation this way means
// gsap becomes fully removable from this project once the old
// carrier-board component that depends on it is deleted (section H).
//
// No DOM references live in this file — timeline() takes a `paint`
// callback the caller supplies, and every `set` function belongs to
// whatever state object useCarrierMachine passes in. That keeps this file
// pure math and scheduling, testable without a browser DOM, and reusable
// for both insert() and ejectDrive()'s timelines.

export const E = {
  p2in: (t: number) => t * t,
  p2out: (t: number) => 1 - (1 - t) * (1 - t),
  p2io: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  p3io: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  backout: (t: number) => {
    const k = 2.2;
    return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
  },
};

export type Ease = (t: number) => number;

/** A single track in a timeline. `dur` of 0 (or omitted) makes it a cue —
 * fires `set(to)` once, the moment `at` is reached, rather than
 * interpolating over time. */
export type Track = {
  at: number;
  dur?: number;
  ease?: Ease;
  from: number;
  to: number;
  set: (v: number) => void;
  /** internal — marks a cue as already fired */
  fired?: boolean;
};

/**
 * Drives every track off a single rAF loop and a single clock, so the
 * board, the drive, the hinge and the screw can never drift apart by a
 * frame the way four independent animations eventually would.
 *
 * @param tracks the tracks to run
 * @param paint  called once per frame after every due track has been
 *               advanced, so the caller can apply whatever DOM writes its
 *               `set` callbacks queued up
 * @param done   called once, after the last track completes and every
 *               track has been snapped to its final value
 */
export function timeline(tracks: Track[], paint: () => void, done: () => void): void {
  const end = tracks.reduce((m, t) => Math.max(m, t.at + (t.dur || 0)), 0);
  let t0: number | null = null;

  const step = (now: number) => {
    if (t0 === null) t0 = now;
    const el = (now - t0) / 1000;
    for (const tr of tracks) {
      if (el < tr.at) continue;
      // A cue that throws must not take the animation down with it — the
      // drive would be left hanging in mid-air and `busy` would stick.
      try {
        if (!tr.dur) {
          if (!tr.fired) {
            tr.fired = true;
            tr.set(tr.to);
          }
          continue;
        }
        const u = Math.min(1, (el - tr.at) / tr.dur);
        tr.set(tr.from + (tr.to - tr.from) * (tr.ease ? tr.ease(u) : u));
      } catch (err) {
        console.warn("track failed, animation continues", err);
      }
    }
    paint();
    if (el < end) {
      requestAnimationFrame(step);
    } else {
      for (const tr of tracks) {
        if (tr.dur) tr.set(tr.to);
        else if (!tr.fired) tr.set(tr.to);
      }
      paint();
      done();
    }
  };
  requestAnimationFrame(step);
}
