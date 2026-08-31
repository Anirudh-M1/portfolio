# Content and Tokens

Authoritative source for palette, type, and copy structure for the current
(CRT-monitor-and-drive-tray) design. Superseded content from an earlier
"hanging folder drawer" concept — different palette, different metaphor
entirely — has been replaced below rather than merged; nothing from that
phase shipped.

## Palette

All defined in `components/machine/machine.css`'s `:root` block — this is
the single definition site; nothing should hardcode these hex values
elsewhere. `app/icon.tsx` and `app/opengraph-image.tsx` are the one
necessary exception (Next's OG image generation can't import component CSS)
and must be kept in sync by hand.

```
--void       #04110F   page background
--fr4-lo     #051815   board substrate, darkest
--drive      #16382F   drive chip body
--drive-lo   #0C2621   drive chip, shadowed
--drive-hi   #1D4740   drive chip, highlight
--gold       #D9AC55   accent — labels, active states, the board's silkscreen gold
--copper     #946340   secondary accent — traces, connectors
--silk       #E8EEEC   primary text
--dim        #84A099   secondary text, labels
--line       rgba(232,238,236,.13)   hairlines
--case       #212A29   monitor case (+ -hi/-lo/-dk variants)
--phos       #FFD9A8   CRT phosphor (+ -hi/-lo variants)
--glass      #080D0C   CRT screen glass
--scr-key    #8FD6BC   CRT structural labels (mint)
--scr-num    #FFCB74   CRT numbers
--scr-link   #9BD2E6   CRT links (cyan)
```

## Type

| Role | Face | Weights |
|---|---|---|
| Headings, wordmarks, chip labels | Archivo | 500, 700, 800 |
| Body copy, CRT screen, boot log | IBM Plex Mono | 400, 500, 600 |

Both loaded via `next/font/google` in `app/layout.tsx`. Headings are
uppercase throughout; body copy is sentence case.

## Nav bar

Wordmark: `Anirudh Moholkar` · Role: `Distributed systems & backend
infrastructure` · Nav: `Experience · Education · Contact · GitHub` (Resume
omitted — see `build-checklist.md`).

## README drive (the default-loaded doc)

H1: `Anirudh Moholkar`, sub `Distributed systems & backend infrastructure`.
Lede: Computer Engineering at UIUC, expected May 2027, Dean's List / James
Scholar / Fiddler Innovation Award, 3.79 GPA. Body: two Zebra Technologies
internships (Cloud & Computing 2025, AI & Cloud Platform 2026), systems
philosophy paragraph, "thirteen drives" call to action. Links: GitHub,
LinkedIn, Email.

## Tray — 13 drives in 4 banks, in order

1. **00 · START** — README (the drive above)
2. **01 · INTERNSHIP** — BOM Agent, PBI Sentinel, Endpoint Sync (all Zebra
   Technologies; see `lib/docs-data.ts` for full field-by-field copy)
3. **02 · DISTRIBUTED** — Log Querier, Membership, RainStorm, HyDFS (ECE 428)
4. **03 · LOW-LEVEL** — RV Kernel (ECE 391), Frogger FPGA (ECE 385)
5. **04 · BUILT & LED** — LLM Dev Assistant, DFA Workshop, Help Forum

`lib/docs-data.ts` is the single source for all thirteen entries' exact
copy — this file intentionally doesn't duplicate it field-by-field; treat
that file as authoritative and this section as an index.

## Below the fold

Experience (Zebra Technologies ×2, Design for America, Chicagoland Help
Forum — `lib/docs-data.ts`'s `EXPERIENCE`), Education (UIUC, `EDUCATION`),
Technical Skills (four rows, `SKILLS`), Contact (`CONTACT` — email, phone,
GitHub, LinkedIn).

## Footer

`Anirudh Moholkar · 2026` · `Built with Next.js & React` (adapted from the
source prototype's "Built from scratch · no framework," which stopped being
true the moment this became a Next.js rebuild).
