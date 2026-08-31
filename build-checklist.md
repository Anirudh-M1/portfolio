# CRT portfolio — what's left to build

The redesign itself (monitor, tray, cables, PCB canvas, the 13 drives, the
below-the-fold sections, the onboarding tour) is done and cut over. What's
below is what's left before this can actually ship.

---

## Blocking — don't send this anywhere yet

**1. Five missing linked files**
The design points at real filenames that don't exist in `public/` yet, so
the links were omitted rather than shipped dead (same call the old design
made — see git history):

- `Anirudh_Moholkar_Resume.pdf` — nav bar
- `MP1-Distributed-Logging.pdf` — Log Querier
- `MP2-Group-Membership.pdf` — Membership
- `MP3-HyDFS.pdf` — HyDFS
- `MP4-RainStorm.pdf` — RainStorm

Drop the real files into `public/`, then re-add the corresponding `links`
entry in `lib/docs-data.ts` and the nav's Resume link in
`components/site/NavBar.tsx`.

**2. Meta + share preview**
`metadataBase` is still unset in `app/layout.tsx` (build warns about it) —
OG/Twitter image URLs resolve against `localhost:3000` until a real deploy
domain is set. Needs item 3 (deploy) first.

**3. Deploy**
Not deployed anywhere yet. Vercel or Netlify, custom domain, HTTPS, then
come back and set `metadataBase`.

---

## Worth doing before sending it to recruiters

**4. Cross-browser check on the fidelity-sensitive CSS**
Container queries (`.m2`) and the `--shingle` pocket-overlap system were
smoke-tested in one headless Chromium pass during the port. Worth a manual
look in Safari and Firefox specifically — container-query support is
recent enough to be worth confirming on an actual older device, not just
assuming.

**5. Real device pass for the tour**
The onboarding tour's spotlight-tracking math was verified against a
scripted pass, not a real trackpad/touchscreen. Walk through it once by
hand — drag targets move under scroll in the old design, and the new
tray/CRT targets have their own layout quirks worth eyeballing live.

**6. Analytics**
Plausible or similar — one script tag. Tells you if anyone actually opens
a drive, and which ones.

**7. Lighthouse / perf pass**
The PCB canvas rebuilds its bake on every resize and the levitation spring
runs a second independent rAF loop alongside the flight timeline — worth a
mobile Lighthouse pass before assuming it's fine on a mid-range phone.

---

## Not required, worth considering

- The old design's "how this was built" idea (rig, tooling, process) never
  shipped in either version — still a genuine differentiator if there's
  time for it.
- Copy-to-clipboard email instead of `mailto:`.
