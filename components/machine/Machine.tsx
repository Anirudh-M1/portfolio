"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cables } from "./Cables";
import { Monitor } from "./Monitor";
import { CarrierBoard } from "./CarrierBoard";
import { Tray } from "./Tray";
import { FlightLayer } from "./FlightLayer";
import { GlanceOverlay } from "./GlanceOverlay";
import { useCarrierMachine, type TourSignalName } from "./useCarrierMachine";
import "./machine.css";

export interface MachineProps {
  /** Forwarded straight into useCarrierMachine — lets Site.tsx connect
   * the onboarding tour's gesture-gated steps without Machine needing to
   * know the tour exists. Optional so every earlier commit and any other
   * caller can keep mounting <Machine/> with no tour at all. */
  tourSignal?: (name: TourSignalName) => void;
}

/* Composition of the interactive machine: cables behind, monitor and
 * carrier board side by side in .top, the drive tray below, and the
 * flight layer for in-transit drives on top of everything.
 *
 * useCarrierMachine's mount effect flips `hidden` off .stage and boots the
 * initial drive (from the URL hash, or README) the instant it runs, so
 * the `hidden` attribute below is only ever the pre-hydration state — a
 * visitor without JS, or before this effect has run, sees nothing here at
 * all and gets the .docs fallback instead (the media-query swap between
 * the two is wired at the section H cutover). Not referenced by
 * app/page.tsx yet — the old carrier-board design still owns the page. */
export function Machine({ tourSignal }: MachineProps) {
  const machine = useCarrierMachine(tourSignal);
  const [glance, setGlance] = useState(false);
  const closeGlance = useCallback(() => setGlance(false), []);
  const openGlance = useCallback(() => {
    setGlance(true);
    tourSignal?.("glance");
  }, [tourSignal]);
  const { onChipClick, busy } = machine;
  // Picking a card closes the overview and loads that drive the same way a
  // tray chip does, with the stage scrolled into view so the swap is seen.
  // load() silently ignores clicks while a flight is still running, so a
  // pick made mid-swap is held until the machine is free rather than lost.
  const pendingRef = useRef<number | null>(null);
  const pick = useCallback(
    (i: number) => {
      setGlance(false);
      // back to the page's resting position (the machine sits right under
      // the nav bar) rather than scrolling .stage flush to the window top,
      // which pushed the page a nav-bar's height past it
      window.scrollTo({ top: 0 });
      if (busy) pendingRef.current = i;
      else void onChipClick(i);
    },
    [busy, onChipClick],
  );
  useEffect(() => {
    if (busy || pendingRef.current === null) return;
    const i = pendingRef.current;
    pendingRef.current = null;
    void onChipClick(i);
  }, [busy, onChipClick]);
  return (
    <>
      <div className="stage" id="stage" hidden={!machine.ready}>
        <div className="top">
          <Cables />
          <Monitor machine={machine} />
          <CarrierBoard machine={machine} />
        </div>
        <Tray machine={machine} onGlance={openGlance} />
      </div>
      <FlightLayer />
      {glance && <GlanceOverlay onClose={closeGlance} onPick={pick} />}
    </>
  );
}
