# Anirudh Moholkar — Portfolio

Next.js 15 (App Router) + TypeScript + Tailwind v4 portfolio, built around a
CRT-monitor-and-drive-tray metaphor: thirteen projects live as M.2 drives in a
tray, and loading one boots its write-up onto a monitor screen sitting beside
a physical carrier board.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind v4 (`@tailwindcss/postcss`) — the machine's visual design is plain
  CSS custom properties and container queries, not Tailwind utility classes
- No animation library. The insert/eject flight, the monitor's levitation
  spring, and the CRT boot-log typing are hand-rolled `requestAnimationFrame`
  code (`lib/carrier-motion.ts`, `components/machine/useCarrierMachine.ts`)

## Structure

| Path | What it is |
|---|---|
| `lib/docs-data.ts` | Single source of truth for all 13 drives plus Experience/Education/Skills/Contact — both the interactive screen and the no-JS/small-screen fallback render from this |
| `lib/carrier-motion.ts` | Easings + timeline driver the insert/eject flight animations run on |
| `lib/tour-steps.ts` | Onboarding tour step data |
| `components/docs/` | `DocBody` (shared renderer for a drive's content), `DocsFallback` (plain-document view), `docs.css`/`docs-crt.css` (two themes for the same markup) |
| `components/machine/` | The interactive stage: monitor, carrier board, cables, tray, flight layer, and `useCarrierMachine` (the hook that drives all of it) |
| `components/pcb/` | The animated procedural PCB canvas behind the whole page |
| `components/tour/` | The onboarding tour overlay |
| `components/site/` | Nav bar, below-the-fold sections, footer, the "?" tour replay button, and `Site.tsx` (composes everything) |

## Responsive story

One layout, not a desktop/mobile split: `components/site/site.css`'s media
query (`max-width:960px, max-height:600px`) swaps the interactive stage for
`DocsFallback` — the same content, same `lib/docs-data.ts` source, just a
plain document instead of a monitor and a tray. There's no `matchMedia` or
`next/dynamic` branch in the React tree for this; it's CSS.

## Fidelity-sensitive constants

`PERSP = 3000`, `AXIS = 0.50526`, `FY = 0.78` in
`components/machine/useCarrierMachine.ts` must stay numerically identical to
`perspective(3000px)` and `.tilt`'s `transform-origin: 50% 50.526%` in
`components/machine/machine.css` — a mismatch desyncs the cable loom from the
board's visual tilt. Search both files for these names before changing
either.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build + type check + lint
npm run lint    # eslint only
```

## Known gaps

Five links are intentionally omitted pending real files in `public/`:
`Anirudh_Moholkar_Resume.pdf` (nav bar) and four ECE 428 report PDFs
(`MP1-Distributed-Logging.pdf`, `MP2-Group-Membership.pdf`, `MP3-HyDFS.pdf`,
`MP4-RainStorm.pdf`, linked from Log Querier/Membership/HyDFS/RainStorm).
See `build-checklist.md`.
