"use client";

import { DRIVE_VIZ_SVG } from "@/lib/drive-viz-svgs";
import { useDriveVizLoop } from "./useDriveVizLoop";
import "./docs-viz.css";

/** One drive's animated SVG panel, mounted beside/below its spec sheet.
 * README has no panel — DOCS never asks for one, so this simply isn't
 * rendered for it. Render with `key={id}` at the call site: without a
 * fresh mount when the drive changes, the previous drive's observer/state
 * would carry over onto the new panel's markup.
 *
 * The generated SVG content is static per drive (see drive-viz-svgs.ts),
 * so it's the one piece still rendered via dangerouslySetInnerHTML; the
 * button and the "on" class that gates every animation are real,
 * React-controlled JSX — see useDriveVizLoop for why that split matters. */
export function DriveViz({ id }: { id: string }) {
  const svg = DRIVE_VIZ_SVG[id];
  const { figRef, on, replay } = useDriveVizLoop();
  if (!svg) return null;
  return (
    <figure className={`docviz${on ? " on" : ""}`} ref={figRef as React.RefObject<HTMLElement>}>
      <button className="replay" type="button" onClick={replay}>
        replay
      </button>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </figure>
  );
}
