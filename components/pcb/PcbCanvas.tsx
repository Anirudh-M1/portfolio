"use client";

import "./pcb-canvas.css";

/* Static canvas element for the animated PCB background. The bake pass
 * (procedural trace routing) and the traveling-pulse animation land in the
 * next two commits, inside a hook this component will call — kept as its
 * own file (not part of useCarrierMachine) since this canvas isn't part of
 * the machine: it's the page's own backdrop, rendered once and shared by
 * both the interactive stage and the .docs fallback. */
export function PcbCanvas() {
  return <canvas id="pcb" aria-hidden="true" />;
}
