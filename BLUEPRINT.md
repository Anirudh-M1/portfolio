# Portfolio Implementation Blueprint

**Project:** Anirudh Moholkar — portfolio structured as a mounted filesystem
**Reference for mechanics only:** mosbyfiles.com (Tubik Studio, Vue + GSAP)
**Target stack:** Next.js 15 App Router · TypeScript · Tailwind · GSAP · Lenis · MDX

---

## 0. Scope note

This blueprint specifies the *interaction physics* observed on the reference
site, reimplemented from first principles. Do not copy source, assets, copy, or
palette from the reference. Content, typography, colour, and metaphor are all
different here: theirs is a paper archive, this is a distributed filesystem.

---

## 1. The physical model

Everything follows from one mental model. Hold it firmly, because most
implementation mistakes are violations of it.

> A drawer of hanging folders, viewed from the front and very slightly above.

Consequences that are non-negotiable:

1. **A folder is one rigid body.** Tab and body are a single transform target.
   They never move independently. This is the failure mode in naive builds: the
   tab lifts on hover while the panel stays, and the illusion dies instantly.
2. **Folders occupy a stack, not a list.** Opening one displaces the ones below
   by exactly its expansion delta. Displacement is animated on the same
   timeline, not left to CSS layout reflow.
3. **The silhouette is continuous.** Where a tab meets its body there is a
   concave fillet, not a butt joint. A folder cut from one piece of card has no
   seams.
4. **Depth is implied by overlap and shadow, never by 3D transforms.** Later
   folders paint over earlier ones. No `perspective`, no `rotateX`.

---

## 2. Geometry

### 2.1 Folder anatomy

```
   ────────────────────────────────────────────────────────    <- folder above, flush
        ╭──────────╮╭───────────╮                              <- tabs (h: TAB_H)
        │  HyDFS   ││ RainStorm │
   ─────╯          ╰╯           ╰──────────────────────────    <- CONCAVE fillets here
   │  /work/distributed        Distributed Systems      ⌄  │   <- header (h: HEAD_H)
   │                                                       │
   │  [body copy, revealed only when open]                 │   <- panel (h: 0 → auto)
   ────────────────────────────────────────────────────────    <- SQUARE, next folder flush
```

Read that diagram carefully. Only the tab tops are rounded. Every joint where a
tab meets the body curves *inward*. The body's own corners are square.

Tokens:

| Token       | Desktop | Mobile |
|-------------|---------|--------|
| `TAB_H`     | 52px    | 42px   |
| `HEAD_H`    | 76px    | 60px   |
| `FILLET_R`  | 20px    | 14px   |
| `TAB_GAP`   | 6px     | 4px    |
| `TAB_INSET` | 34px    | 16px   |

### 2.2 The fillet (concave corner)

This is the "CSS-only skeuomorphic" part. Where the tab's outer edge meets the
folder's top edge, the corner curves *inward*. Achieve with layered radial
gradients on the folder background, not with pseudo-element patches:

```css
.folder {
  --c: var(--folder-color);
  --r: var(--fillet-r);
  background:
    radial-gradient(circle at 0 0,     transparent var(--r), var(--c) calc(var(--r) + 0.5px)) 
      no-repeat left top / 50% 50%,
    /* mirror for the right side, plus a fill layer */
}
```

Alternative if gradient stacking gets unmanageable: render the folder silhouette
as a single inline SVG `<path>` per folder, with the tab positions passed as
props. Slower to author, far easier to reason about, and it makes the hover
morph trivial. **Prefer the SVG path approach if the gradient version costs more
than an hour.**

### 2.2b Silhouette rules — non-negotiable

These are the rules a first implementation gets wrong. Check each one visually
before moving on.

1. **Tab top corners are convex**, radius `FILLET_R`.
2. **Tab-to-body joints are concave**, radius `FILLET_R`. The curve fills the
   inside angle. If any joint bulges outward, it is wrong.
3. **Adjacent tabs within a folder butt directly together** with a single
   concave notch between them. They do not each get their own separate rounding
   with a gap in between.
4. **The folder body has square corners on all four sides.** No radius. Ever.
5. **Zero vertical gap between folders.** They are flush. `margin: 0`.
6. **Each folder's tabs overlap the folder above it**, sitting on top of its
   lower edge. Achieve with `position: absolute; bottom: 100%` on the tab row.
   Only the first folder's tabs sit against the page background.
7. The stack is one continuous mass of colour from the first folder's top edge
   to the last folder's bottom edge, interrupted only by tab silhouettes.

If the result looks like a list of cards, one of rules 4, 5, or 6 is broken.

### 2.2c Tab typography

Tabs are the primary navigation and must feel substantial, not like chips.

| Property | Desktop | Mobile |
|----------|---------|--------|
| Face | Big Shoulders Display 700 | same |
| Size | 26px | 17px |
| Case | Uppercase | Uppercase |
| Tracking | 0.01em | 0.01em |
| Padding | 0 26px | 0 16px |

Tab width is content-driven. Do not set a fixed or equal width across tabs —
uneven tab widths are what makes a real drawer look real.

### 2.3 The label-set trick

Each tab element contains the label set of *all* tabs in its folder, not just
its own, with `overflow: hidden` and a horizontal offset selecting the visible
one.

Why: when folders slide horizontally during open/close, neighbouring labels
translate through the viewport in a way that reads as physical sliding of card
stock past card stock. If each tab held only its own label, you would need to
animate opacity crossfades to fake the same effect, and it would read as digital.

```tsx
<button className="tab" style={{ '--i': index }}>
  <span className="tab__strip">
    {siblings.map(s => <span key={s.id} className="tab__label">{s.title}</span>)}
  </span>
</button>
```

```css
.tab { overflow: hidden; }
.tab__strip { display: flex; transform: translateX(calc(var(--i) * -100%)); }
.tab__label { flex: 0 0 100%; }
```

---

## 3. State machine

One folder open at a time. Model it explicitly; do not derive from DOM classes.

```ts
type StackState = {
  openFolderId: string | null;
  hoveredTabId: string | null;
  transitioning: boolean;   // locks input during folder→page transition
};
```

Transitions:

| From | Event | To | Motion |
|------|-------|-----|--------|
| any | `hoverTab(id)` | `hoveredTabId = id` | **Peek** (§4.1) |
| any | `unhoverTab` | `hoveredTabId = null` | Peek reverse |
| closed | `clickHeader(id)` | `openFolderId = id` | **Open** (§4.2) |
| open(id) | `clickHeader(id)` | `openFolderId = null` | Open reverse |
| open(a) | `clickHeader(b)` | `openFolderId = b` | Cross-fade: close a and open b on one timeline, overlapping by 60% |
| any | `clickTab(id)` | `transitioning = true` | **Extract** (§4.3), then route push |

Input is locked during `transitioning`. Unlock on route commit.

---

## 4. Motion specification

All timings assume GSAP. Use one `gsap.timeline()` per gesture. Do **not** use
CSS transitions for anything in this section: the coordination between the
moving folder and the displaced folders below it is the entire effect, and CSS
transitions cannot be kept in phase reliably.

Easing vocabulary (define once, reuse):

```ts
export const EASE = {
  lift:    'power2.out',              // fast pickup, soft settle
  settle:  'power3.out',
  drawer:  'expo.out',                // the open — long tail, feels heavy
  snap:    'back.out(1.4)',           // tab return
};
```

### 4.1 Peek — hover on a tab

The whole folder rises. Duration **220ms**, ease `lift`.

```
folder.y:        0    → -10px
folder.shadow:   0 2px 8px  → 0 14px 34px  (opacity .18 → .30)
tab.brightness:  1.00 → 1.08
```

Neighbouring folders do **not** move. The rise is small enough to read as the
folder being pinched between two fingers, not pulled out.

Reverse: **180ms**, ease `settle`. Slightly faster in than out is wrong here;
keep out shorter so it feels sprung.

### 4.2 Open — click a folder header

This is the money animation. Three things happen on one timeline:

```ts
const tl = gsap.timeline({ defaults: { ease: EASE.drawer } });

tl.to(folder,        { height: openHeight,  duration: 0.62 }, 0)
  .to(folder,        { y: -4,               duration: 0.62 }, 0)
  .to(foldersBelow,  { y: delta,            duration: 0.62 }, 0)      // exact same duration
  .to(chevron,       { rotate: 180,         duration: 0.40 }, 0)
  .fromTo(bodyCopy,  { y: 14, opacity: 0 },
                     { y: 0, opacity: 1, duration: 0.45 }, 0.18);     // trails the opening
```

Critical points:

- `foldersBelow` displacement uses the **identical duration and ease** as the
  height change. Any divergence and the stack visibly tears.
- Body copy is offset **+180ms**. It appears as the folder is already opening,
  the way paper contents become legible partway through a drawer pull.
- Measure `openHeight` from a hidden measurement pass, never animate to `auto`.

If a different folder was already open, run its close on the same timeline
starting at `0`, overlapping. Total gesture stays 620ms regardless.

### 4.3 Extract — click a tab, navigate to record

The folder is pulled out of the drawer and becomes the detail page. Use GSAP
Flip so the folder's colour block is the same DOM element across the route change.

```
Phase 1 (240ms):  folder.y -= 26        others.y += 8    (drawer makes room)
Phase 2 (520ms):  Flip.from(state) — folder scales to full viewport,
                  colour block becomes the page header
Phase 3 (300ms):  record content fades up, stagger 60ms
```

Route push fires at the start of Phase 2. Next's App Router will have the
destination ready if you prefetch on hover during Peek.

### 4.4 Scroll

Lenis, `lerp: 0.085`, `wheelMultiplier: 1`. Register with GSAP ticker:

```ts
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

### 4.5 Reduced motion

Under `prefers-reduced-motion: reduce`: disable Lenis entirely, set all
durations to 0.01, skip Flip and route-transition directly. The state machine
is unchanged — only the timelines degrade.

---

## 5. Content model

MDX content collections. One file per record. Adding a project is adding a file.

```
content/
  volumes/
    distributed.yml
    agents.yml
    product.yml
    silicon.yml
  records/
    hydfs.mdx
    rainstorm.mdx
    ...
```

```yaml
# volumes/distributed.yml
id: distributed
path: /work/distributed
title: Distributed Systems
color: '#1F3FE0'
order: 1
blurb: >
  Systems built to keep working when the machines under them do not.
```

```yaml
# records/hydfs.mdx (frontmatter)
---
id: hydfs
volume: distributed
title: HyDFS
order: 1
spec:
  - [Type, Fault-tolerant distributed file system]
  - [Language, Go]
  - [Replication, 'Factor 3, ring-ordered']
  - [Membership, Gossip-based failure detection]
diagram: /diagrams/hydfs-ring.svg
confidential: false
---
```

`confidential: true` records render the spec table but suppress named metrics —
use this for anything Zebra-adjacent so the redaction rule lives in data rather
than in prose you have to remember to police.

---

## 6. File structure

```
app/
  layout.tsx
  page.tsx                      # drawer index
  cases/[slug]/page.tsx         # record spec sheet
  providers/
    SmoothScroll.tsx            # Lenis + GSAP ticker
    TransitionProvider.tsx      # Flip state across routes
components/
  drawer/
    Drawer.tsx                  # owns StackState
    Folder.tsx                  # rigid body: tabs + header + panel
    FolderSilhouette.tsx        # SVG path or gradient fillets
    Tab.tsx                     # label-strip trick
  record/
    SpecSheet.tsx
    FieldTable.tsx
    DiagramFrame.tsx
lib/
  motion.ts                     # EASE, durations, timeline factories
  content.ts                    # MDX loaders, typed
```

Keep every duration and easing in `lib/motion.ts`. Tuning feel means editing one
file, which you will do many times.

---

## 7. Build order

Do not build these in parallel. Each phase should look finished before the next.

1. **Static silhouette.** Folders, tabs, fillets, correct colours and type. No
   motion at all. Get the geometry right first — motion cannot rescue bad shape.
2. **Label-strip trick.** Verify sliding reads correctly before adding gestures.
3. **Peek.** Smallest gesture, fastest feedback loop on easing feel.
4. **Open/close with displacement.** The hard one. Budget real time here.
5. **Content pipeline.** MDX wired, all nine records rendering.
6. **Record pages.** Static, no transition.
7. **Extract transition.** Last, because it depends on everything above.
8. **Reduced motion, keyboard, mobile.** Then Lighthouse.

---

## 8. Quality floor

- Keyboard: tabs and headers are real `<button>`/`<a>`, arrow keys move between
  tabs within a folder, `Escape` closes an open folder. Visible focus ring that
  survives on coloured backgrounds.
- Every folder header carries `aria-expanded` and controls its panel by `id`.
- The drawer is navigable with JS disabled: folders render open, tabs are plain
  links. Progressive enhancement is cheap here and an interviewer may check.
- Lighthouse: performance ≥ 90 mobile, accessibility 100.
- Animate only `transform` and `opacity`. The one exception is folder `height`
  during Open; if that janks on mobile, switch to a `scaleY` on a wrapper with
  counter-scaled content.

---

## 9. Known-hard parts

Ranked by how much time they will actually take.

1. **Displacement staying in phase during rapid clicking.** Kill the previous
   timeline before starting a new one; do not let two timelines write `y` on the
   same folder. Use `gsap.killTweensOf(target)` or a single reusable timeline
   per folder.
2. **The fillet at responsive breakpoints.** Radius must scale with tab height
   or the joint looks wrong at mobile sizes.
3. **Flip across an App Router boundary.** The element must exist in both trees.
   Simplest reliable approach: render the folder colour block in the shared
   layout and drive it from context, not in the page.
4. **Measuring `openHeight` before fonts load.** Measure after
   `document.fonts.ready` or the first open will be the wrong height.
