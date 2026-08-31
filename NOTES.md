# Implementation notes

Notes from the CRT-monitor-and-drive-tray redesign. Earlier notes here
described a "hanging folder drawer" concept that never shipped (superseded
first by a carrier-board 3D hero, now by this design) — removed rather than
kept alongside, since they described tokens and geometry (`TAB_H`,
`FILLET_R`, volume colors) that don't exist in this codebase at all.

## DocBody as the one renderer, not a shared data format

The source prototype got the CRT screen and the no-JS fallback to agree by
literally cloning `.docs` markup into `.crt` at runtime (`innerHTML` in,
`innerHTML` out). React can't clone a live subtree like that, so
`lib/docs-data.ts` holds the data and `components/docs/DocBody.tsx` is the
one component both contexts render — themed differently by whichever
ancestor class (`.docs` vs. `.crt .doc`) wraps it. This is also why the CRT
screen's content in `useCarrierMachine.ts` is real React state (`screen`)
rather than an HTML string builder: duplicating DocBody's rendering as a
string generator would defeat the point of having one data source.

## Two real bugs, found by actually running it

Both caught by a temporary Playwright route + a real headless Chromium
build, not by re-reading the code:

1. **Reduced-motion swap held an empty screen for 2.27s.** `load()`'s
   eject/insert stagger unconditionally awaited a fixed delay meant to keep
   two overlapping flight animations from visually colliding. Under reduced
   motion, both eject and insert resolve instantly — there's no animation
   to stagger against — so the wait was just holding "NO DEVICE" on screen
   for no reason. Fixed by skipping the wait when `reduced` is true.
2. **The tour misdetected every fresh visit as a deep link.**
   `useCarrierMachine`'s mount effect stamps the loaded drive's id onto the
   URL hash via `history.replaceState` even on a plain visit with no hash
   at all (so PREV/NEXT and real deep-linking stay consistent). The tour's
   auto-start effect read `location.hash` to detect an actual deep link,
   but React runs a child's effects before its parent's — Machine (child)
   had already rewritten the hash before the tour's own effect (parent)
   ran, so every fresh visit looked like a deep link and the tour never
   started. Fixed by capturing the hash once via `useState`'s lazy
   initializer, which runs before any effect at all, including a child's.

## ARIA list/listitem, broken by the shingle markup

`.pocket` (`role="listitem"`) sits several plain `<div>`s below `#rail`
(`role="list"` in the source) — `.bank`, `.bank-row` — needed for the
shingled-overlap visual treatment. Per the ARIA list/listitem relationship,
an owned role has to resolve through the accessibility tree without an
unrelated role breaking the chain, and two bare divs stacked in between is
enough for some browsers to stop exposing the pockets as list items at all.
This is a pre-existing issue in the source design, not something the port
introduced — fixed here rather than carried over, since accessibility
semantics aren't one of the fidelity-protected areas the port otherwise
holds to byte-for-byte. Each `.bank` is now `role="group"` with an
`aria-label` (the same string `.bank-tab` already shows visually, now
`aria-hidden` to avoid double-announcing it), and each `.bank-row` is its
own `role="list"`.

## cqw smoke test

`.m2`'s container-query sizing (`container-type: inline-size`, `cqw` units
on the notch/screw/label) was verified directly rather than assumed safe:
wired `Tray` into a throwaway route, ran a production build, and grepped
the compiled CSS in `.next/static` for the `cqw` rules. They survive this
project's Tailwind v4 / `@tailwindcss/postcss` pipeline untouched. The test
route was removed before the commit that added the sizing rules; it was
verification, not shipped code.
