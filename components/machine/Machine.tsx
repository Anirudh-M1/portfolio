"use client";

import { Cables } from "./Cables";
import { Monitor } from "./Monitor";
import { CarrierBoard } from "./CarrierBoard";
import { Tray } from "./Tray";
import { FlightLayer } from "./FlightLayer";
import { useCarrierMachine } from "./useCarrierMachine";
import "./machine.css";

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
export function Machine() {
  const machine = useCarrierMachine();
  return (
    <>
      <div className="stage" id="stage" hidden={!machine.ready}>
        <div className="top">
          <Cables />
          <Monitor machine={machine} />
          <CarrierBoard machine={machine} />
        </div>
        <Tray machine={machine} />
      </div>
      <FlightLayer />
    </>
  );
}
