import { forwardRef } from "react";
import "./machine.css";

/* Empty on purpose. A drive in flight is a handful of nested divs
 * (flyx -> flyy -> flyh -> .m2) built and animated with plain DOM calls
 * inside useCarrierMachine's insert()/ejectDrive() (section E) — the same
 * imperative approach the source prototype uses, kept rather than routed
 * through React state, since re-rendering a component tree 60 times a
 * second for a transform-only animation is exactly the kind of work
 * React's diffing is unnecessary overhead for. This component just gives
 * that code a container to mount into. */
export const FlightLayer = forwardRef<HTMLDivElement>(function FlightLayer(_props, ref) {
  return <div className="fly" id="fly" aria-hidden="true" ref={ref} />;
});
