"use client";

import { useEffect, useRef, useState } from "react";

/* play, hold on the finished state, then replay: the change is the point,
 * not just the result */
const PLAY = 3600;
const HOLD = 4200;
const LOOP = PLAY + HOLD;

/** Drives one drive-visual panel's play/hold/replay loop. An
 * IntersectionObserver starts/stops it as the panel enters/leaves view —
 * DocsFallback mounts all twelve panels at once on mobile, so off-screen
 * ones cost nothing. `selfLoop` panels (Log Querier, RainStorm, Frogger
 * FPGA, DFA Workshop) already repeat their own motion and are excluded
 * from the interval restart, same as the source prototype.
 *
 * The "on" flag that gates every panel's CSS animations is React state,
 * not an imperative classList toggle on the raw SVG — the SVG markup is
 * static HTML rendered via dangerouslySetInnerHTML, and any prop React
 * controls (that string, `.docviz`'s own className) gets reapplied
 * verbatim on every re-render, including React's dev-only double-render
 * and a second legitimate "ready" render ~500ms after boot as the machine
 * settles. An imperative class added straight to that markup silently
 * loses that race the moment either of those re-renders happens. State
 * survives re-renders by construction, so the toggle is driven from here
 * and read back as a class on `.docviz` itself (docs-viz.css keys off
 * `.docviz.on` rather than `svg.viz.on` for exactly this reason).
 *
 * On desktop only one panel is ever mounted at a time (the loaded drive);
 * React unmounting the old DriveViz and mounting a new one when the drive
 * changes — guaranteed by the `key={doc.id}` at the call site — does the
 * cleanup the source prototype needed a MutationObserver for, for free. */
export function useDriveVizLoop(selfLoop: boolean) {
  const figRef = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  // Always delegates to whichever start/stop the current effect run closed
  // over, so the JSX-bound replay button (a real element now, not one
  // parsed out of the dangerouslySetInnerHTML string — same re-render
  // fragility would otherwise apply to its click listener) never goes
  // stale across effect re-runs.
  const replayRef = useRef<() => void>(() => {});

  useEffect(() => {
    const fig = figRef.current;
    if (!fig) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setInterval> | null = null;
    let running = false;

    function run() {
      setOn(false);
      // no offsetWidth reflow trick needed — the state update itself forces
      // a real render/paint before the next frame flips it back on
      requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    }
    function stop() {
      running = false;
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    }
    function start() {
      if (running) return;
      running = true;
      run();
      if (!reduced && !selfLoop) timer = setInterval(run, LOOP);
    }

    replayRef.current = () => {
      stop();
      start();
    };

    const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())), {
      threshold: 0.25,
    });
    io.observe(fig);

    return () => {
      io.disconnect();
      stop();
    };
  }, [selfLoop]);

  const replay = () => replayRef.current();
  return { figRef, on, replay };
}
