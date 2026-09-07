"use client";

import { useEffect, useRef, useState } from "react";

/** Drives one drive-visual panel's animation: it plays once when the panel
 * enters view and then holds its settled state continuously — it does not
 * auto-replay. An IntersectionObserver starts it as the panel enters view —
 * DocsFallback mounts all twelve panels at once on mobile, so off-screen
 * ones cost nothing — and resets `on` so it's ready to play again if the
 * panel is scrolled away and back, or the replay button is used.
 *
 * The "on" flag that gates every panel's CSS animations is React state,
 * not an imperative classList toggle on the raw SVG — the SVG markup is
 * static HTML rendered via dangerouslySetInnerHTML, and any prop React
 * controls (that string, `.docviz`'s own className) gets reapplied
 * verbatim on every re-render, including React's dev-only double-render.
 * An imperative class added straight to that markup silently loses that
 * race the moment such a re-render happens. State survives re-renders by
 * construction, so the toggle is driven from here and read back as a class
 * on `.docviz` itself (docs-viz.css keys off `.docviz.on` rather than
 * `svg.viz.on` for exactly this reason).
 *
 * On desktop only one panel is ever mounted at a time (the loaded drive);
 * React unmounting the old DriveViz and mounting a new one when the drive
 * changes — guaranteed by the `key={doc.id}` at the call site — does the
 * cleanup the source prototype needed a MutationObserver for, for free. */
export function useDriveVizLoop() {
  const figRef = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  // Always delegates to whichever play the current effect run closed over,
  // so the JSX-bound replay button (a real element now, not one parsed out
  // of the dangerouslySetInnerHTML string — same re-render fragility would
  // otherwise apply to its click listener) never goes stale across effect
  // re-runs.
  const replayRef = useRef<() => void>(() => {});

  useEffect(() => {
    const fig = figRef.current;
    if (!fig) return;
    let played = false;

    function play() {
      setOn(false);
      // no offsetWidth reflow trick needed — the state update itself forces
      // a real render/paint before the next frame flips it back on
      requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    }

    replayRef.current = play;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && !played) {
            played = true;
            play();
          } else if (!e.isIntersecting) {
            played = false;
          }
        }),
      { threshold: 0.25 },
    );
    io.observe(fig);

    return () => io.disconnect();
  }, []);

  const replay = () => replayRef.current();
  return { figRef, on, replay };
}
