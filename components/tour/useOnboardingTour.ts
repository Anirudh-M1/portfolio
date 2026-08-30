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
  spot: { left: number; top: number; width: number; height: number } | null;
  blockers: { t: string; r: string; b: string; l: string };
}

/** Reads the CSS rect a step's spotlight should frame — falls back to
 * `.mon` if the target is missing or collapsed, rather than shrinking the
 * spotlight to a point somewhere off-screen. */
function targetRect(selector: string, pad: number) {
  let el = document.querySelector<HTMLElement>(selector);
  let r = el?.getBoundingClientRect();
  if (!r || r.width < 4 || r.height < 4) {
    el = document.querySelector<HTMLElement>(".mon");
    r = el?.getBoundingClientRect();
  }
  if (!r) return null;
  return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

export function useOnboardingTour() {
  const [on, setOn] = useState(false);
  const [veiled, setVeiled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [waitMsg, setWaitMsg] = useState<string | null>(null);
  const [nextEnabled, setNextEnabled] = useState(false);
  const [spot, setSpot] = useState<TourUiState["spot"]>(null);

  const typerRef = useRef<number | null>(null);
  const trackRafRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const onRef = useRef(false);
  const veiledRef = useRef(false);

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
   * to be framing. */
  const trackSpot = useCallback(() => {
    const s = TOUR_STEPS[stepIndexRef.current];
    if (s && onRef.current) {
      setSpot(veiledRef.current ? null : targetRect(s.at, s.pad ?? 12));
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
    setOn(true);
    setVeiled(false);
    setStepIndex(0);
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
    if (s && s.wait === name) setTimeout(() => stepNext(), 420);
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
    const deepLinked = typeof location !== "undefined" && location.hash.length > 1;
    let seen = false;
    try {
      seen = !!localStorage.getItem("carrier-tour-seen");
    } catch {
      /* private browsing, storage disabled — treat as unseen */
    }
    if (reduced || deepLinked || seen) return;

    const t = setTimeout(() => {
      startTour();
    }, 3400);
    return () => clearTimeout(t);
    // Runs once on mount; startTour is stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    start: startTour,
    end: endTour,
    skip,
    next: advanceOrFinish,
    signal,
  };
}
