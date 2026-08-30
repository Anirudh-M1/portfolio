# Phase 1 notes

## Fillet approach: SVG (rect + circle), not gradients

The first pass used layered `radial-gradient`s and got the direction wrong —
the joints bulged outward instead of curving into the inside angle. Root
cause: with the old `TAB_GAP` (6px) much smaller than `FILLET_R` (20px), each
tab's independently-positioned gradient patch extended ~20px into the
*neighbouring* tab's territory, and since patches relied on true CSS
transparency + DOM stacking order to reveal what was "underneath," two
patches overlapping in a 6px gap punched holes through each other
unpredictably. That's what read as a bulge.

BLUEPRINT.md's revision removes the inter-tab gap entirely (rule 2.2b #3:
tabs butt together, single shared notch), which actually makes a clean fix
possible — see [`components/drawer/Fillet.tsx`](components/drawer/Fillet.tsx).

**Construction.** Every fillet — outer (beside the first/last tab, in
genuinely empty space) or inner (carved into a tab's own corner where it
touches its neighbour) — is the same unit-square shape:

- an SVG `<rect>` covering the whole square, and
- an SVG `<circle r="1">` centered on the corner *farthest* from the tab
  ("the cusp"), naturally clipped to the viewBox.

That circle is tangent to both straight edges of the square at once (the
tangent points sit exactly 1 radius from the far corner along each edge),
so the boundary reads as one continuous curved piece of card, not two
edges meeting at a point. `mode="outer"` fills the small sliver near the
cusp with the folder color and the rest with whatever's revealed behind
(the folder above, or the page background for the first folder);
`mode="inner"` swaps that — mostly folder color, with a small carve near
the cusp revealing what's behind. Two tabs' matching inner carves, sitting
edge-to-edge with zero gap, combine into the "valley" the blueprint's ascii
diagram shows.

I first tried authoring this as a single `<path>` with an elliptical-arc
(`A`) command and got the arc direction wrong twice by hand (an arc between
two points at a fixed radius has *two* valid centers — I kept computing
tangency for the one I wanted but the sweep-flag was selecting the other).
Rather than keep guessing flags, I built a small isolated test page,
rendered all four flag combinations, and picked visually — then replaced
the whole approach with `<circle>`, which has no flag ambiguity at all.
Confirmed correct by rendering the real page in a headless browser and
inspecting actual tab joints, not just by re-deriving the math on paper.

**Reveal color.** Since every fillet's "background" is a single known flat
color (either the page's `--void` or the previous folder's solid color —
never an image or gradient), `Folder.tsx` passes that color down explicitly
as `aboveColor` rather than relying on transparency + stacking order. This
is also what fixed the original bug's root cause: nothing depends on paint
order between sibling elements anymore, so nothing can punch through the
wrong thing.

## Font substitution: Big Shoulders → Big Shoulders Display

Google Fonts merged "Big Shoulders Display" into the single variable family
"Big Shoulders" (width axis covers what used to be the separate Display/Text
cuts). `next/font/google` only exposes the merged family, so
[`app/layout.tsx`](app/layout.tsx) imports `Big_Shoulders` — same design,
different export name.

## Tab overflow on mobile

At 375px, a folder with three long tab labels ("Infrastructure Agent",
"Procurement RAG", "Eval Harness") still doesn't fit `TAB_INSET` + all tabs
in one viewport width, even at 2.2c's mobile sizing. Rather than shrinking
type further (2.2c gives fixed sizes) or wrapping tabs to a second row
(breaks the fixed `TAB_H`), the tab row scrolls horizontally
(`overflow-x-auto`, scrollbar hidden), with a right-edge mask fade so the
overflow reads as "scroll for more" rather than a hard clip. Not motion —
native scroll, no transition attached.

## TAB_GAP is now unused

BLUEPRINT.md 2.1 still lists `TAB_GAP` (6px desktop / 4px mobile) in the
token table, but 2.2b rule 3 requires adjacent tabs to butt together with
zero gap. I left the CSS custom property defined (harmless) but nothing
reads it anymore. Flagging in case that's an oversight in the token table
rather than intentional.

## What I'd change about the geometry tokens before motion (Phase 3+)

- **`TAB_H` (52px) is tight for 3-tab folders with long titles** (`agents`
  volume), now more so with 2.2c's larger 26px tab type. The static build
  resolves it with horizontal tab-row scroll, but scroll and the Peek/Open
  gestures (4.1/4.2) will fight each other — a hover intended to lift the
  folder could instead start a scroll gesture on touch devices. Consider
  shorter labels for `agents`, or a smaller mobile `TAB_INSET`.
- **`FILLET_R` at 14px mobile vs 20px desktop** is a big proportional jump
  relative to `TAB_H` shrinking only 52→42px — the fillet reads relatively
  larger on mobile. Worth a visual pass once the Open timeline (4.2) is
  animating folder height across that same breakpoint.
- **Now that folders stack flush and tabs overlap the folder above**, the
  Open gesture's `foldersBelow` displacement (4.2) needs to also displace
  the *next* folder's absolutely-positioned tab row, not just its body —
  otherwise the next folder's tabs will visually detach from its body
  during the animation. Worth flagging before Phase 4 starts.
