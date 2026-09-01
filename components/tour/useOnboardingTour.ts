"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TOUR_STEPS, type TourWaitKind } from "@/lib/tour-steps";

const TYPE_MS = 15; // per-character delay, same cadence as the old tour

export interface TourUiState {
  on: boolean;
  veiled: boolean;
  stepIndex: number;
  total: number;
  typedText: string;
  waitMsg: string | null;
  nextLabel: string;
  nextEnabled: boolean;
  spot: { left: number; top: number; width: number; height: number; ox: number; oy: number } | null;
  blockers: { t: string; r: string; b: string; l: string };
}

/** Resolves a step's target selector to its live rect — falls back to
 * `.mon` if the target is missing or collapsed, rather than shrinking
 * the spotlight to a point somewhere off-screen. */
function resolveRect(selector: string) {
  let el = document.querySelector<HTMLElement>(selector);
  let r = el?.getBoundingClientRect();
  if (!r || r.width < 4 || r.height < 4) {
    el = document.querySelector<HTMLElement>(".mon");
    r = el?.getBoundingClientRect();
  }
  return r ?? null;
}

function padRect(r: DOMRect, pad: { left: number; right: number; top: number; bottom: number }) {
  return {
    left: r.left - pad.left,
    top: r.top - pad.top,
    width: r.width + pad.left + pad.right,
    height: r.height + pad.top + pad.bottom,
  };
}

/** Where a tilted step's spotlight should pivot, as a percentage of its
 * own box — .mon's real transform-origin (machine.css: 30% 46%),
 * converted to an absolute point and re-expressed relative to `rect`.
 * Rotating .spot around its own center (the CSS default) was the actual
 * cause of the earlier padding imbalance: .mon's pivot sits well left
 * and slightly above its own center, so a box rotating around ITS OWN
 * center swings by a different amount than .mon itself does at the
 * same angle.
 *
 * This only holds up while `rect` is reasonably close to .mon's own
 * size and position, though — for something small and off in a corner
 * like .stnav, the shared pivot can land far outside rect's own box
 * (a transform-origin of several hundred percent, measured), and
 * perspective()'s foreshortening blows up rather than gracefully
 * approximating anything at that distance: the box came out visibly
 * more distorted than the plain own-center default it was meant to
 * improve on. Falling back to 50/50 whenever the computed point would
 * land too far outside rect avoids that: worse alignment for a target
 * that far from .mon's real pivot isn't fixable by pivoting alone
 * anyway (see targetRect's own asymmetric padding), so there's nothing
 * lost by not chasing it here. */
function monTiltOrigin(rect: { left: number; top: number; width: number; height: number } | null) {
  const mon = document.querySelector<HTMLElement>(".mon");
  const monRect = mon?.getBoundingClientRect();
  if (!monRect || !rect || rect.width < 1 || rect.height < 1) return { ox: 50, oy: 50 };
  const absX = monRect.left + monRect.width * 0.3;
  const absY = monRect.top + monRect.height * 0.46;
  const ox = ((absX - rect.left) / rect.width) * 100;
  const oy = ((absY - rect.top) / rect.height) * 100;
  const MARGIN = 60; // percent outside [0,100] still treated as "close enough"
  if (ox < -MARGIN || ox > 100 + MARGIN || oy < -MARGIN || oy > 100 + MARGIN) return { ox: 50, oy: 50 };
  return { ox, oy };
}

export function useOnboardingTour() {
  const [on, setOn] = useState(false);
  const [veiled, setVeiled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [waitMsg, setWaitMsg] = useState<string | null>(null);
  const [nextEnabled, setNextEnabled] = useState(false);
  const [spot, setSpot] = useState<TourUiState["spot"]>(null);

  // Captured once, on the very first render — via useState's lazy
  // initializer, which runs before ANY effect does, including a child
  // component's. That matters here specifically: useCarrierMachine's own
  // mount effect (in Machine, a child of whatever renders this hook)
  // calls history.replaceState to stamp the loaded drive's id onto the
  // hash the instant it boots — even when nothing was actually deep-
  // linked. Reading location.hash inside THIS hook's own effect would
  // read that already-stamped value and misdetect every fresh visit as
  // a deep link, since React runs child effects before parent ones.
  const [wasDeepLinked] = useState(() => typeof window !== "undefined" && location.hash.length > 1);

  const typerRef = useRef<number | null>(null);
  const trackRafRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const onRef = useRef(false);
  const veiledRef = useRef(false);
  // Current *displayed* spotlight rect, eased toward the live target each
  // frame rather than snapped to it — see trackSpot.
  const spotCurRef = useRef<TourUiState["spot"]>(null);
  // Signals that fired before the step waiting on them (via veilUntil)
  // had actually been entered yet — reduced motion collapses a whole
  // load() to effectively zero delay, so "loaded" can arrive well before
  // the fixed 420ms "chip" advance lands on the step that wants it. Without
  // this, that step would start veiled and never find out it can reveal.
  const preFiredRef = useRef<Set<TourWaitKind>>(new Set());

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);
  useEffect(() => {
    onRef.current = on;
  }, [on]);
  useEffect(() => {
    veiledRef.current = veiled;
  }, [veiled]);

  /* The spotlight follows its target every frame rather than measuring
   * once — targets can move under scroll/resize/layout shifts, and a
   * one-shot measurement would drift out of sync with what it's supposed
   * to be framing.
   *
   * The displayed rect eases toward that live target (a fixed fraction of
   * the remaining distance per frame) instead of snapping straight to it.
   * A step's target can itself be gently moving on every frame — anything
   * inside .mon rides its idle levitation spring even at rest — so a
   * plain snap-to-target reads as jitter (CSS `transition` doesn't help
   * here either: retargeting a transition every frame off a moving value
   * just restarts it every frame, which is its own kind of choppy). The
   * same lerp also carries a step-to-step jump (a real target change, not
   * jitter) smoothly from the old rect to the new one for free, and
   * converges fast enough to read as quick rather than sluggish. */
  const trackSpot = useCallback(() => {
    const s = TOUR_STEPS[stepIndexRef.current];
    if (s && onRef.current) {
      // noHole (the tray step) hides the spotlight visually but must
      // still resolve a real rect here — the click-blocking panes cut
      // their hole from this same rect, and without one they'd cover the
      // tray completely and swallow the very click the step is waiting
      // on. Only `veiled` (mid-transition, nothing to frame yet) should
      // null the target out.
      const base = s.pad ?? 12;
      let pad = { left: base, right: base, top: base, bottom: base };
      const rawRect = veiledRef.current ? null : resolveRect(s.at);
      if (s.tilts && rawRect) {
        // Proportional to the target's own (unpadded) width rather than a
        // fixed pixel count calibrated against .mon specifically: the
        // rotation-induced compression on the far edge scales with how
        // big/far-out the target itself is, so a fixed constant that
        // looked right for .mon (~1083px wide) way overshot a target as
        // small as .stnav (~120px) — left ended up under-covered while
        // right had far more spare room than it needed, the opposite of
        // .mon's own imbalance.
        const rightBonus = rawRect.width * 0.033;
        const leftReduction = rawRect.width * 0.0065;
        pad = { left: Math.max(0, base - leftReduction), right: base + rightBonus, top: base + 16, bottom: base + 16 };
      }
      const target = rawRect ? padRect(rawRect, pad) : null;
      const cur = spotCurRef.current;
      let rect: { left: number; top: number; width: number; height: number } | null;
      if (!target || !cur) {
        rect = target;
      } else {
        const EASE = 0.3;
        rect = {
          left: cur.left + (target.left - cur.left) * EASE,
          top: cur.top + (target.top - cur.top) * EASE,
          width: cur.width + (target.width - cur.width) * EASE,
          height: cur.height + (target.height - cur.height) * EASE,
        };
      }
      const next = rect ? { ...rect, ...(s.tilts ? monTiltOrigin(rect) : { ox: 50, oy: 50 }) } : null;
      spotCurRef.current = next;
      setSpot(next);
    }
    trackRafRef.current = requestAnimationFrame(trackSpot);
  }, []);

  const typeText = useCallback((str: string, done?: () => void) => {
    if (typerRef.current !== null) clearInterval(typerRef.current);
    setTypedText("");
    const reduced =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTypedText(str);
      done?.();
      return;
    }
    let k = 0;
    typerRef.current = window.setInterval(() => {
      k++;
      setTypedText(str.slice(0, k));
      if (k >= str.length && typerRef.current !== null) {
        clearInterval(typerRef.current);
        typerRef.current = null;
        done?.();
      }
    }, TYPE_MS);
  }, []);

  const renderStep = useCallback(
    (i: number) => {
      const s = TOUR_STEPS[i];
      setWaitMsg(null);
      setNextEnabled(false);
      // A step with veilUntil starts dimmed with no hole at all, revealed
      // later by signal() once the thing it's waiting on actually
      // happens — unless that signal already fired early (see
      // preFiredRef), in which case there's nothing left to wait for.
      // Everything else shows its hole immediately, same as before.
      const alreadyFired = !!s.veilUntil && preFiredRef.current.has(s.veilUntil);
      if (s.veilUntil) preFiredRef.current.delete(s.veilUntil);
      setVeiled(!!s.veilUntil && !alreadyFired);
      typeText(s.text, () => {
        if (s.wait) setWaitMsg(s.waitMsg ?? "");
        setNextEnabled(true);
      });
    },
    [typeText],
  );

  const stepNext = useCallback(() => {
    if (!onRef.current) return;
    setStepIndex((i) => {
      if (i >= TOUR_STEPS.length - 1) {
        return i;
      }
      const next = i + 1;
      renderStep(next);
      return next;
    });
  }, [renderStep]);

  const endTour = useCallback(() => {
    setOn(false);
    setVeiled(false);
    if (typerRef.current !== null) clearInterval(typerRef.current);
    if (trackRafRef.current !== null) cancelAnimationFrame(trackRafRef.current);
    trackRafRef.current = null;
    try {
      localStorage.setItem("carrier-tour-seen", "1");
    } catch {
      /* private browsing, storage disabled — nothing to persist to */
    }
  }, []);

  /* If the current step is the last one, Finish behaves like end. */
  const advanceOrFinish = useCallback(() => {
    if (stepIndexRef.current >= TOUR_STEPS.length - 1) {
      endTour();
    } else {
      stepNext();
    }
  }, [endTour, stepNext]);

  const startTour = useCallback(() => {
    // Full skip, not just a faster version: this guard covers BOTH the
    // auto-start effect and the "?" button's manual replay, since both
    // call straight into this function. A guided overlay whose whole
    // point is spotlight motion and typewriter reveal has nothing left to
    // offer once both of those are turned off — there's no reduced-
    // motion variant of this feature to fall back to, only skipping it.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // The tour's steps all target parts of the interactive stage (.mon,
    // .rail, #crt...) which only sit where the spotlight math expects
    // them when the page is scrolled to the top — replaying via the "?"
    // button after reading Experience/Education/Contact further down
    // would otherwise start the tour on whatever those sections look
    // like mid-scroll. Instant, not smooth: starting the tour while a
    // scroll animation is still finishing is one more moving part than
    // this needs, for a jump that's expected to be immediate anyway.
    window.scrollTo({ top: 0, behavior: "instant" });
    setOn(true);
    setVeiled(false);
    setStepIndex(0);
    spotCurRef.current = null;
    preFiredRef.current.clear();
    if (trackRafRef.current !== null) cancelAnimationFrame(trackRafRef.current);
    trackRafRef.current = requestAnimationFrame(trackSpot);
    renderStep(0);
  }, [renderStep, trackSpot]);

  /* Gesture-gated advancement: a step with `wait` only moves on once the
   * matching real interaction actually happens, not on a timer. Called
   * from useCarrierMachine's load()/step() (wired in the next commit),
   * the same way the old tour's tourSignal() was called from pull()/
   * seat()/endDrag()/applyCamera() — the interaction functions themselves
   * report what just happened, rather than the tour polling for it. */
  const signal = useCallback((name: TourWaitKind) => {
    if (!onRef.current) return;
    const s = TOUR_STEPS[stepIndexRef.current];
    if (!s) return;
    if (s.wait === name) setTimeout(() => stepNext(), 420);
    // Independent of the above: a step can be showing (typing its text,
    // even already advanced past by wait) while still veiled, waiting on
    // a *different* signal to reveal its hole — currently only "loaded",
    // fired once a clicked drive actually finishes seating.
    if (s.veilUntil === name) {
      setVeiled(false);
    } else if (name === "loaded") {
      // The waiting step hasn't been entered yet (see preFiredRef) —
      // remember it instead of dropping it on the floor.
      preFiredRef.current.add(name);
    }
  }, [stepNext]);

  const skip = useCallback(() => {
    endTour();
  }, [endTour]);

  /* Runs once per browser, and never on a deep-linked landing — jumping
   * straight to a specific drive means the visitor already knows where
   * they're going, and starting the tour would reset them to the
   * README/step 0 they didn't ask for. Also skipped outright under
   * reduced motion (checked again in the next commit, alongside
   * Escape-to-skip) and if the seen-flag is already set. */
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = !!localStorage.getItem("carrier-tour-seen");
    } catch {
      /* private browsing, storage disabled — treat as unseen */
    }
    if (reduced || wasDeepLinked || seen) return;

    const t = setTimeout(() => {
      startTour();
    }, 3400);
    return () => clearTimeout(t);
    // Runs once on mount; startTour is stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Escape always gets you out, matching every other dismissible overlay
   * on the web — Skip is the click equivalent, but a keyboard-only or
   * just-startled visitor shouldn't have to hunt for the button. Only
   * listens while the tour is actually on, so it doesn't compete with
   * whatever else on the page might want Escape. */
  useEffect(() => {
    if (!on) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [on, endTour]);

  /* The nav-bar-links step leaves .bar nav itself clickable (it's the
   * spotlight's hole) — clicking Experience/Education/Contact is a
   * visitor choosing to go read that section, not a tour gesture, so
   * the tour ends rather than staying on screen, still dimmed, over
   * whatever they scrolled down to actually look at. Drops the scroll
   * lock synchronously here rather than only through endTour's own
   * state update: the browser's own smooth-scroll-to-anchor for the
   * click is about to run as part of the same event, and needs
   * overflow:hidden already gone by then, not on React's next tick. */
  useEffect(() => {
    if (!on) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest?.(".bar nav a")) return;
      document.documentElement.classList.remove("tour-on");
      document.body.classList.remove("tour-on");
      endTour();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [on, endTour]);

  /* Scroll also drives the monitor's own levitation spring
   * (useCarrierMachine's floatStep), which isn't an interaction worth
   * having mid-tour — locked for as long as the tour is on screen. Both
   * html and body get the class: whichever one the browser treats as the
   * actual scrolling element varies, so overflow:hidden has to be on both
   * to reliably block scroll everywhere. */
  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("tour-on");
    document.body.classList.add("tour-on");
    return () => {
      document.documentElement.classList.remove("tour-on");
      document.body.classList.remove("tour-on");
    };
  }, [on]);

  useEffect(
    () => () => {
      if (typerRef.current !== null) clearInterval(typerRef.current);
      if (trackRafRef.current !== null) cancelAnimationFrame(trackRafRef.current);
    },
    [],
  );

  return {
    on,
    veiled,
    stepIndex,
    total: TOUR_STEPS.length,
    typedText,
    waitMsg,
    nextEnabled,
    isLast: stepIndex >= TOUR_STEPS.length - 1,
    spot,
    tilts: !!TOUR_STEPS[stepIndex]?.tilts,
    // Visual-only: spot still holds a real rect (so the click-blocking
    // panes still cut a working hole over the target), this just tells
    // OnboardingTour to render that hole's spotlight invisibly.
    hideSpotlight: !!TOUR_STEPS[stepIndex]?.noHole,
    start: startTour,
    end: endTour,
    skip,
    next: advanceOrFinish,
    signal,
  };
}
