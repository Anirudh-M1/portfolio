# Portfolio Implementation Blueprint

**Project:** Anirudh Moholkar — portfolio structured as a CRT monitor wired
to a physical M.2 carrier board, with a drive tray beneath it
**Target stack:** Next.js 15 App Router · TypeScript · Tailwind v4 · no
animation library

This replaces an earlier blueprint for a "hanging folder drawer" concept
(referencing mosbyfiles.com) that never shipped, and the carrier-board 3D
hero design that shipped before this one. Both are gone from the codebase;
this document describes what's actually built.

---

## 1. The physical model

> A monitor and a one-slot M.2 carrier board sit side by side on a desk.
> Thirteen drives live in a tray below. Loading one animates it out of the
> tray, into the socket, and boots its write-up onto the screen.

Non-negotiable consequences:

1. **The board is flat in layout, tilted only by CSS transform.** `.card`
   carries no transform of its own — `.tilt` inside it does
   (`rotateX(20deg)` at rest). This is what lets the flight animation
   target the slot with plain arithmetic instead of inverting a 3D matrix:
   `.card`'s `getBoundingClientRect()` is always the honest untilted box.
2. **The tilt's rotation axis is pinned to the slot's own vertical centre**
   (`transform-origin: 50% 50.526%`, where 50.526% = 38.947% + 23.158%/2 —
   `.m2.seated`'s own top+height/2). Tilting the board neither moves nor
   scales the slot row. `AXIS = 0.50526` in `useCarrierMachine.ts` must
   stay numerically identical to this value.
3. **Perspective is shared and pinned.** `.card`/`.fly` both declare
   `perspective: 3000px` (`PERSP` in the hook), and `fit()` pins
   `#fly`'s `perspective-origin` to the board's own axis every time the
   layout can resize. A drive in flight is projected exactly the way the
   board itself is — same vanishing point, same axis.
4. **The cable loom is derived, not measured.** `.card`'s rect never
   changes shape under tilt (see #1), so the board-side cable anchor is
   computed by applying the same rotation + perspective divide the browser
   applies to the board (`boardAnchor()` in the hook), at height `FY=0.78`
   (fraction of card height) — down at the edge connector, off the axis
   enough to visibly swing.
5. **The monitor levitates.** Nothing holds it up in the physical model, so
   it's a damped spring (`SPRING=0.026, DAMP=0.108`) nudged by scroll
   velocity, with rotation derived from position/velocity rather than
   simulated separately.

---

## 2. Motion engine

Hand-rolled, not a library — `lib/carrier-motion.ts` exports `E` (five
easing functions, written out from GSAP's power-curve formulas) and
`timeline(tracks, paint, done)`, a generic driver: every track (board tilt,
drive position, hinge angle, screw opacity) advances off one `rAF` loop and
one clock, so they can't drift apart by a frame the way independent tweens
would. `insert()`/`ejectDrive()` in `useCarrierMachine.ts` each build a
`Track[]` and hand it to `timeline()`.

Most of the hook is otherwise as imperative as a vanilla script would be —
direct `getElementById` DOM writes rather than React state — because the
static markup already carries every id/class the logic needs. Two things
are real React state instead: `screen` (idle/booting/ready — because
`DocBody` has to be the one renderer for a drive's content in both this
screen and the no-JS fallback) and `loadedIndex`/`busy` (low-frequency UI
state read by a few components for aria-current/disabled).

## 3. Container queries

`.m2` declares `container-type: inline-size`; the drive chip's notch,
screw, and label type are all sized in `cqw` so they scale with the chip's
own width rather than the viewport's — a raw percentage stretched the round
notch into an ellipse whenever the chip's own aspect ratio changed. Smoke-
tested directly against this project's Tailwind v4/PostCSS pipeline (see
the commit that added it); `cqw` survives untouched.

## 4. One responsive layout, not two

`components/site/site.css`'s single media query
(`max-width:960px, max-height:600px`) plus a `js` class on `<body>`
(set once `useCarrierMachine`'s mount effect confirms it can actually drive
the machine) decides between the interactive stage and the plain-document
`DocsFallback`. There is no `matchMedia`/`next/dynamic` branch in the React
tree for this at all — both render unconditionally; CSS picks.

## 5. Onboarding tour

Adapted, not ported, from an earlier carrier-board design's tour: that
tour's gestures (drag-to-orbit, scroll-to-dock) don't exist in this
interaction model. What's kept is the mechanism — a spotlight punched
through a dimmed overlay, four click-blocking panes, gesture-gated
advancement via a `signal()` call from the real interaction handlers
(`useCarrierMachine`'s `load()`/`step()`), not a timer — retargeted at this
design's actual DOM (a tray chip, the CRT screen, PREV/NEXT, the nav bar).
