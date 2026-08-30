# Content and Tokens

Authoritative source for palette, type, and copy. No layout or structural
guidance here — that is BLUEPRINT.md.

## Palette

```
--void      #0B0E14   page background
--surface   #141A26   raised panels
--line      #242C3B   hairlines, borders
--ink       #EAE7E1   primary text
--muted     #8791A5   secondary text, labels
```

Volume colours:

```
distributed  #1F3FE0
agents       #0E8467
product      #B8402A
silicon      #5C36B0
```

## Type

| Role | Face | Weights |
|------|------|---------|
| Display (hero, tabs, record titles) | Big Shoulders Display | 700, 800 |
| Body (prose) | Archivo | 400, 500 |
| Data (paths, spec tables, labels, nav) | JetBrains Mono | 400, 500, 700 |

Display is uppercase throughout. Mono is uppercase for labels, sentence case for
paths and values.

## Masthead

Wordmark: `Moholkar / Index`
Nav: Volumes · Résumé · GitHub · Contact

## Hero

H1: `Anirudh Moholkar`

Sub, mono:
```
computer engineering, uiuc · ai & data engineering @ zebra technologies
mount /work  ok  4 volumes  9 records  replication ×3
```

## Volumes

### /work/distributed — Distributed Systems
Systems built to keep working when the machines under them do not. Failure
detection, replication, and delivery guarantees written from scratch in Go and
benchmarked against production engines rather than assumed correct.

Records: HyDFS, RainStorm

### /work/agents — AI & Agents
Production agent work at Zebra Technologies, described at the architecture and
outcome level. The interesting problem in all three was not the model. It was
deciding where a human still had to sit in the loop, and proving the thing was
right often enough to remove them.

Records: Infrastructure Agent, Procurement RAG, Eval Harness

### /work/product — Product
Where the constraint is a person rather than a machine. Container design,
teacher workflows, entity models, and the rollout sequencing that decides
whether a feature is adopted or quietly ignored.

Records: Homework Assignments, Data Literacy Workshop

### /work/silicon — Systems & Hardware
The layer under everything above. Written in C and SystemVerilog, where a bug
does not throw an exception, it just hangs.

Records: RISC-V Kernel, FPGA Frogger

## Records

Spec fields and prose for all nine are pending final review. For Phase 1, render
each record's title in its tab and leave the spec sheet out of scope.

**Redaction rule:** records under /work/agents are employer work. Keep them at
architecture and outcome level. Any record carrying named internal metrics gets
`confidential: true` in its frontmatter when the content pipeline lands.

## Footer

`Buffalo Grove, IL` · `Prototype build · Aug 2026`
