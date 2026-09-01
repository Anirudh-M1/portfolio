"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOCS, type DriveDoc } from "@/lib/docs-data";
import { E, timeline } from "@/lib/carrier-motion";

/* useCarrierMachine is the React home for the source prototype's big IIFE.
 * Most of it stays exactly as imperative as the source — direct
 * getElementById DOM writes driven from refs/effects rather than React
 * state — because the static markup built in section D already carries
 * every id and class the original script queried for, e.g.
 * `.chip`/`.pocket` inside #rail, `#led`, `#seated`, `#stage`. Porting
 * against those same selectors is the lowest-risk path: the behavior is
 * identical to the source, not just similar.
 *
 * Two things ARE React state rather than raw DOM, on purpose:
 *  - `screen` (what the CRT shows) — because DocBody needs to be the one
 *    renderer for a drive's content in both the fallback and the screen
 *    (see lib/docs-data.ts), and DocBody is a React component. Text only
 *    updates a few times a second at most (typed boot lines, then a
 *    completed doc), so re-rendering for it costs nothing.
 *  - `loadedIndex`/`busy` — read by Tray/CarrierBoard for aria-current,
 *    the eject button's disabled state, and the hint text, all similarly
 *    low-frequency.
 * Everything that has to move at 60fps — the flight animation, the
 * levitation spring, cable redraws — stays outside React entirely once
 * those land in later commits, for the same reason FlightLayer is an
 * empty imperative mount point rather than a stateful component.
 */

export type ScreenState =
  | { kind: "idle" }
  | { kind: "boot"; lines: string[] }
  | { kind: "ready"; doc: DriveDoc };

const reduced =
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canAnimate = typeof Element !== "undefined" && !!Element.prototype.animate;

/* Shared drive-face markup for DOM built OUTSIDE React's tree — the
 * seated slot on the board, and (once insert()/ejectDrive() land) the
 * mid-flight flier. Deliberately the same shape as Tray's DriveFace JSX,
 * just as an HTML string: both render notch/screw/controller/NAND/label,
 * ported from the source's own `guts()` helper, which every one of these
 * three contexts called into. */
function gutsHTML(d: DriveDoc, withScrew: boolean): string {
  return `<span class="notch"></span>${withScrew ? '<span class="screw"></span>' : ""}
    <span class="ctrl"></span><span class="nand n1"></span><span class="nand n2"></span>
    <span class="lab"><b>${d.name}</b><span class="meta"><i>${d.tag}</i><em>${d.part}</em></span></span>
    <span class="pads"></span><span class="key"></span>`;
}

function fromHash(): number {
  if (typeof location === "undefined") return 0;
  const i = DOCS.findIndex((d) => d.id === location.hash.slice(1));
  return i < 0 ? 0 : i;
}

/* The slot's box as a fraction of the card's UNTILTED layout box. Same
 * numbers .seated uses in CSS (17.692%/38.947%/61.538%/23.158%), so the
 * flight target and the drive that ends up sitting there can never drift
 * apart. */
const SLOT = { l: 0.17692, t: 0.38947, w: 0.61538, h: 0.23158 };

const REST = 20; // board at rest — matches --tilt in machine.css
const WORK = 58; // board tilted up to receive a drive
const LIFT = 28; // hinge angle a real M.2 goes in at
const PULL = 96; // board units the mount sits back by

/* The slot rect, derived rather than measured. .card carries no transform
 * of its own — the tilt lives on .tilt inside it — so its rect is the
 * honest untilted layout box, and because the rotation axis runs through
 * the slot's own centre (see .tilt's transform-origin in machine.css),
 * that centre is fixed under the tilt. This is the true flight target,
 * not an approximation of a projected one. */
function slotRect() {
  const card = document.querySelector<HTMLElement>(".card");
  const c = card!.getBoundingClientRect();
  const w = SLOT.w * c.width,
    h = SLOT.h * c.height;
  const l = c.left + SLOT.l * c.width,
    t = c.top + SLOT.t * c.height;
  return { left: l, top: t, width: w, height: h, cx: l + w / 2, cy: t + h / 2 };
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function setHash(h: string) {
  try {
    if (history.replaceState) history.replaceState(null, "", h);
  } catch {
    /* file:// — deep links just won't update */
  }
}

/** Names the onboarding tour's two gesture-gated steps care about: a
 * drive loaded via a tray chip, versus one loaded via PREV/NEXT. Kept as
 * a param rather than an import from the tour so this hook has no
 * dependency on the tour existing at all — Machine can be used (and was,
 * for several commits) with no tour mounted. */
export type TourSignalName = "chip" | "nav";

export function useCarrierMachine(tourSignal?: (name: TourSignalName) => void) {
  const crtRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<ScreenState>({ kind: "idle" });
  const [loadedIndex, setLoadedIndex] = useState<number | null>(null);
  // Starts false so .stage renders `hidden` for the very first paint (and
  // for a visitor whose JS never runs at all) — flipped true once the
  // mount effect below has actually booted a drive into the machine, the
  // same "reveal only once it's real" behavior the source's own
  // `stage.hidden = false` line has.
  const [ready, setReady] = useState(false);
  // True for the whole duration of a load — both the outgoing eject and
  // the incoming insert. Gates PREV/NEXT (next commit) and stops a second
  // chip click from starting a flight mid-flight.
  const [busy, setBusy] = useState(false);
  const loadedIndexRef = useRef<number | null>(null);
  useEffect(() => {
    loadedIndexRef.current = loadedIndex;
  }, [loadedIndex]);
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const timersRef = useRef<number[]>([]);
  const skipPostRef = useRef<(() => void) | null>(null);
  const ledTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    skipPostRef.current = null;
  }, []);

  const setStatusline = useCallback((d: DriveDoc | null) => {
    const bar = document.querySelector<HTMLElement>(".statusline");
    if (!bar) return;
    const set = (id: string, v: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    if (d) {
      set("stMount", d.mount);
      set("stPart", d.cap && d.cap !== "—" ? `${d.part} · ${d.cap}` : d.part);
      set("stLink", "PCIe 4.0 x4");
      bar.classList.add("live");
    } else {
      set("stMount", "—");
      set("stPart", "");
      set("stLink", "NO LINK");
      bar.classList.remove("live");
    }
  }, []);

  const idle = useCallback(() => {
    clearTimers();
    setStatusline(null);
    setScreen({ kind: "idle" });
  }, [clearTimers, setStatusline]);

  /* Renders the completed doc and, once mounted, staggers each of its
   * top-level children in — matching the source's per-child .animate()
   * reveal on `.doc > *`. Skipped outright under reduced motion. */
  const render = useCallback((d: DriveDoc) => {
    setScreen({ kind: "ready", doc: d });
  }, []);

  const boot = useCallback(
    (d: DriveDoc) => {
      clearTimers();
      if (reduced) {
        render(d);
        return;
      }
      const dots = ".".repeat(Math.max(2, 15 - d.mount.length));
      const lines = [
        "ANR BIOS v2.7",
        "",
        "Detecting M.2 device ......... <b>OK</b>",
        `  MODEL     <b>${d.part}</b>`,
        `  CAPACITY  <b>${d.cap}</b>`,
        "  LINK      <b>PCIe 4.0 x4</b>",
        `Mounting ${d.mount} ${dots} <b>OK</b>`,
        "",
      ];
      setScreen({ kind: "boot", lines: [] });
      skipPostRef.current = () => {
        clearTimers();
        render(d);
      };
      lines.forEach((_, k) => {
        timersRef.current.push(
          window.setTimeout(() => {
            setScreen((prev) => (prev.kind === "boot" ? { kind: "boot", lines: lines.slice(0, k + 1) } : prev));
          }, 55 * (k + 1)),
        );
      });
      timersRef.current.push(
        window.setTimeout(() => {
          clearTimers();
          render(d);
        }, 55 * lines.length + 340),
      );
    },
    [clearTimers, render],
  );

  const onCrtClick = useCallback(() => {
    skipPostRef.current?.();
  }, []);

  const ledOn = useCallback((i: number) => {
    const led = document.getElementById("led");
    if (!led) return;
    led.classList.add("lit");
    if (ledTimerRef.current !== null) clearTimeout(ledTimerRef.current);
    ledTimerRef.current = window.setTimeout(() => {
      led.classList.remove("lit");
      setLoadedIndex((cur) => {
        if (cur === i) led.classList.add("mounted");
        return cur;
      });
    }, 850);
  }, []);

  const ledOff = useCallback(() => {
    if (ledTimerRef.current !== null) clearTimeout(ledTimerRef.current);
    const led = document.getElementById("led");
    led?.classList.remove("lit", "mounted");
  }, []);

  /* The drive lives in the slot from the moment the link trains, not when
   * the board finishes laying back down. */
  const land = useCallback((i: number) => {
    const seated = document.getElementById("seated");
    if (!seated) return;
    seated.innerHTML = gutsHTML(DOCS[i], true);
    seated.hidden = false;
    const sc = seated.querySelector<HTMLElement>(".screw");
    if (sc) sc.style.opacity = "1";
  }, []);

  const mountState = useCallback(
    (i: number) => {
      setLoadedIndex(i);
      const rail = document.getElementById("rail");
      const chips = rail ? [...rail.querySelectorAll<HTMLButtonElement>(".chip")] : [];
      chips.forEach((c, k) => c.setAttribute("aria-current", k === i ? "true" : "false"));
      const hint = document.getElementById("hint");
      if (hint) hint.textContent = "Select another to swap";
      const status = document.getElementById("status");
      if (status) status.textContent = DOCS[i].mount;
      setStatusline(DOCS[i]);
      ledOn(i);
      boot(DOCS[i]);
      setHash("#" + DOCS[i].id);
    },
    [boot, ledOn, setStatusline],
  );

  /* Board tilt drives at 60fps during a flight, so it's a plain mutable
   * ref rather than React state — re-rendering the whole tree every frame
   * for a single transform would be the exact overhead FlightLayer's
   * imperative approach already avoids. drawCables() (a later commit)
   * hooks in here too, since the loom has to swing with the board. */
  const tiltNowRef = useRef(REST);
  const drawCablesRef = useRef<() => void>(() => {});
  const paintTilt = useCallback(() => {
    const tilt = document.querySelector<HTMLElement>(".tilt");
    if (tilt) tilt.style.transform = `rotateX(${tiltNowRef.current}deg)`;
    drawCablesRef.current();
  }, []);

  /* Cables run from the back of the monitor panel to the board's edge
   * connector. The board-side anchor can't be measured: .card carries no
   * transform of its own (the tilt lives on .tilt inside it), so its rect
   * is identical whether the board is lying flat or standing at 58deg.
   * Re-reading rects every frame would give a cable that never moves —
   * the anchor is derived from the tilt angle instead, applying the same
   * rotation and perspective divide the browser applies to the board, so
   * the plug stays welded to the edge while it swings.
   *
   * PERSP/AXIS/FY are load-bearing across both this file and machine.css:
   * PERSP must equal .card/.fly's `perspective: 3000px`, and AXIS must
   * equal .tilt's `transform-origin: 50% 50.526%`. A mismatch between
   * either pair desyncs the cable from the board's visual tilt — copied
   * verbatim from the source rather than re-derived. */
  const PERSP = 3000;
  const AXIS = 0.50526;
  const FY = 0.78; // down by the edge connector, where a loom really plugs in

  const geoRef = useRef<{ ax: number; ay: number; cx: number; cy: number; cw: number; ch: number } | null>(null);
  // ox/oy are what drawCables reads; x/y/vx/vy/idle drive the spring
  // itself. Kept as one ref (not state) since it's written every rAF tick.
  const floatRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, idle: 0, ox: 0, oy: 0 });

  const cacheGeo = useCallback(() => {
    const topEl = document.querySelector<HTMLElement>(".top");
    const mon = document.querySelector<HTMLElement>(".mon");
    const card = document.querySelector<HTMLElement>(".card");
    if (!topEl || !mon || !card) return;
    const tb = topEl.getBoundingClientRect();
    const mb = mon.getBoundingClientRect();
    const cb = card.getBoundingClientRect();
    if (!tb.width || !mb.width || !cb.width) {
      geoRef.current = null;
      return;
    }
    geoRef.current = {
      ax: mb.right - tb.left - mb.width * 0.05,
      ay: mb.top - tb.top + mb.height * 0.68,
      cx: cb.left - tb.left,
      cy: cb.top - tb.top,
      cw: cb.width,
      ch: cb.height,
    };
  }, []);

  /* The board's left edge at height FY, after rotateX(tiltNow) + perspective. */
  const boardAnchor = useCallback(() => {
    const g = geoRef.current!;
    const th = (tiltNowRef.current * Math.PI) / 180;
    const dy = (FY - AXIS) * g.ch;
    const z = dy * Math.sin(th); // below the axis swings forward
    const sc = PERSP / (PERSP - z);
    return {
      x: g.cx + g.cw / 2 - (g.cw / 2) * sc,
      y: g.cy + AXIS * g.ch + dy * Math.cos(th) * sc,
    };
  }, []);

  const drawCables = useCallback(() => {
    if (!geoRef.current) cacheGeo();
    if (!geoRef.current) return;
    const ax = geoRef.current.ax + floatRef.current.ox,
      ay = geoRef.current.ay + floatRef.current.oy;
    const b = boardAnchor();
    const run = b.x - ax;

    for (let k = 0; k < 3; k++) {
      const sag = 34 + k * 20,
        off = (k - 1) * 7;
      const d =
        `M${ax} ${ay + off} C${ax + run * 0.34} ${ay + sag + off} ` +
        `${ax + run * 0.66} ${b.y + sag + off} ${b.x} ${b.y + off}`;
      document.getElementById("c" + k)?.setAttribute("d", d);
      document.getElementById("k" + k)?.setAttribute("d", d);
      document.getElementById("s" + k)?.setAttribute("d", d);
    }
    // Connectors are groups; the whole assembly (boot, housing, shell,
    // screws) travels together via one transform.
    document.getElementById("pA")?.setAttribute("transform", `translate(${ax} ${ay})`);
    document.getElementById("pB")?.setAttribute("transform", `translate(${b.x} ${b.y})`);
  }, [boardAnchor, cacheGeo]);

  useEffect(() => {
    drawCablesRef.current = drawCables;
  }, [drawCables]);

  /* ---------- levitation ----------
   * Nothing holds the monitor up, so it behaves like a mass on a spring.
   * Scrolling shoves it the opposite way — the panel has inertia, so when
   * the world moves it lags, overshoots, and settles. The same offset
   * feeds drawCables() so the loom stays plugged in while it moves.
   *
   * x'' = -k*x - c*x' — critically-ish damped, tuned to settle in about a
   * second rather than wobble like jelly. Rotation is derived from
   * position and velocity, not simulated separately: a suspended object
   * pitches as it swings, and deriving it keeps the two in sync for free.
   */
  const SPRING = 0.026,
    DAMP = 0.108,
    KICK = 0.3,
    MAXV = 30;
  const maxDRef = useRef(42);
  const lastScrollYRef = useRef(0);
  const floatRafRef = useRef<number | null>(null);

  /* Travel is capped by whatever gap actually exists between the bar and
   * the tray at this viewport, so the panel can never swing into either
   * no matter how the layout resolves. Measured at rest by subtracting
   * the offset that is currently applied. */
  const measureFloatRange = useCallback(() => {
    const bar = document.querySelector<HTMLElement>(".bar");
    const tray = document.querySelector<HTMLElement>(".tray");
    const mon = document.querySelector<HTMLElement>(".mon");
    if (!bar || !tray || !mon) return;
    const m = mon.getBoundingClientRect();
    const head = m.top - floatRef.current.oy - bar.getBoundingClientRect().bottom;
    const leg = tray.getBoundingClientRect().top - (m.bottom - floatRef.current.oy);
    const room = Math.min(head, leg) - 10;
    maxDRef.current = Math.max(8, Math.min(42, room));
  }, []);

  const nudge = useCallback((dy: number, dx: number) => {
    const f = floatRef.current;
    // pushed the other way: the panel resists the direction you scrolled
    f.vy -= Math.max(-70, Math.min(70, dy)) * KICK * 0.19;
    f.vx -= Math.max(-70, Math.min(70, dx || 0)) * KICK * 0.04;
  }, []);

  const floatStep = useCallback(() => {
    const f = floatRef.current;
    f.idle += 0.0034;

    // Driven only by scroll that actually happened — reading the wheel
    // event directly would keep pushing the panel when the page cannot
    // move (at the top of the document, scrolling up fires wheel events
    // forever while scrollY stays 0), so the monitor would drift with
    // nothing moving behind it. scrollY delta is zero at both limits,
    // which is the behavior we want, and it still picks up scrollbar
    // drags, keyboard paging and touch.
    const sy = scrollY,
      ds = sy - lastScrollYRef.current;
    lastScrollYRef.current = sy;
    if (Math.abs(ds) > 0.5) nudge(ds, 0);

    f.vy += -SPRING * f.y - DAMP * f.vy;
    f.vx += -SPRING * f.x - DAMP * f.vx;
    f.vy = Math.max(-MAXV, Math.min(MAXV, f.vy));
    f.vx = Math.max(-MAXV, Math.min(MAXV, f.vx));
    f.y += f.vy;
    f.x += f.vx;
    // hard travel limit — it must never reach the tray below or the bar above
    const MAXD = maxDRef.current;
    if (f.y > MAXD) {
      f.y = MAXD;
      f.vy *= -0.35;
    }
    if (f.y < -MAXD) {
      f.y = -MAXD;
      f.vy *= -0.35;
    }
    if (f.x > MAXD) {
      f.x = MAXD;
      f.vx *= -0.35;
    }
    if (f.x < -MAXD) {
      f.x = -MAXD;
      f.vx *= -0.35;
    }

    // a slow drift so it still reads as suspended when nothing is happening
    const by = Math.sin(f.idle) * 2.6,
      bx = Math.cos(f.idle * 0.72) * 1.5;
    const ox = f.x + bx,
      oy = f.y + by;
    f.ox = ox;
    f.oy = oy;

    // pitch with vertical travel, yaw with horizontal — a hanging object
    // leads with its bottom edge as it swings
    const rx = 2.5 - oy * 0.016 - f.vy * 0.05;
    const ry = 9 + ox * 0.012 + f.vx * 0.04;

    const mon = document.querySelector<HTMLElement>(".mon");
    if (mon) {
      mon.style.transform =
        `translate3d(${ox.toFixed(2)}px,${oy.toFixed(2)}px,0) ` +
        `perspective(2600px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
    }

    drawCables();

    floatRafRef.current = requestAnimationFrame(floatStep);
  }, [drawCables, nudge]);

  /* Keep the geometry honest whenever the layout can change size. Sizes
   * the BOARD first — it's the thing being looked at — then gives the
   * monitor whatever space is left, both derived from measured space
   * rather than hand-tuned max-widths (which kept pushing the board off
   * screen every time the numbers changed elsewhere). */
  const fit = useCallback(() => {
    const topEl = document.querySelector<HTMLElement>(".top");
    const mon = document.querySelector<HTMLElement>(".mon");
    const card = document.querySelector<HTMLElement>(".card");
    const fly = document.getElementById("fly");
    // Pins the flight layer's vanishing point to the board's own rotation
    // axis (50.526%, same fraction AXIS uses above), so a drive in flight
    // is projected exactly the way the board itself is — without this, a
    // flier and the board it's approaching would recede toward two
    // different vanishing points and visibly fail to line up.
    if (card && fly) {
      const c = card.getBoundingClientRect();
      fly.style.perspectiveOrigin = `${c.left + c.width / 2}px ${c.top + c.height * 0.50526}px`;
    }
    if (topEl && mon) {
      const rowH = topEl.clientHeight,
        rowW = topEl.clientWidth;
      if (rowH > 0 && rowW > 0) {
        const gap = parseFloat(getComputedStyle(topEl).columnGap) || 24;
        const byH = Math.max(0, rowH - 104) * 1.78;
        mon.style.maxWidth = Math.max(280, Math.min(byH, rowW * 0.74, 1240)) + "px";
        /* The monitor is sized by the height available to it, so on short
         * viewports it can't use the width it's given and the surplus
         * sits empty between the two objects. Handing that remainder to
         * the carrier column instead kills the dead gap and stops the
         * board's SVG rendering below 1:1.
         *
         * The carrier column needs a floor, but expressing it as
         * minmax(300px,1fr) let the two columns demand more than the row
         * actually has on narrow laptops, pushing the whole stage past
         * the viewport — so the floor comes out of the monitor's width
         * instead, leaving the track itself free to shrink. */
        const monW = Math.max(280, Math.min(parseFloat(mon.style.maxWidth) || 0, rowW - 300 - gap));
        mon.style.maxWidth = monW + "px";
        topEl.style.gridTemplateColumns = `${monW}px minmax(0,1fr)`;
      }
    }
    cacheGeo();
    measureFloatRange();
    drawCables();
  }, [cacheGeo, drawCables, measureFloatRange]);

  /* A drive in flight. Its box is parked on the slot and everything is
   * expressed as a transform away from there, so "arrived" is transform
   * identity — exactly the pose the seated drive already has. */
  const makeFlight = useCallback((d: DriveDoc, chipRect: DOMRect) => {
    const fly = document.getElementById("fly");
    const el = document.createElement("div");
    el.className = "flyx";
    el.innerHTML = `<div class="flyy"><div class="flyh"><div class="m2">${gutsHTML(d, true)}</div></div></div>`;
    fly?.appendChild(el);

    const yEl = el.firstElementChild as HTMLElement;
    const hEl = yEl.firstElementChild as HTMLElement;
    const screw = hEl.querySelector<HTMLElement>(".screw")!;
    const st = { u: 1, hinge: 0, pull: 1, screw: 0 };
    const ok = (n: number) => (Number.isFinite(n) ? n : 0);

    function paint() {
      // Re-measured every frame, not cached once at flight start. The
      // board is a live target — the levitation spring keeps bobbing it
      // in response to scroll for the whole time a flight is in the air
      // — so a slot sampled once at t=0 goes stale mid-flight and the
      // drive arrives wherever the board *used to be* rather than where
      // it actually settled. Re-reading slotRect()/`.card` here is what
      // keeps the landing point (and the pre-insertion pull-back
      // distance, which scales off the board's own width) locked to
      // wherever the board really is on the frame the flight finishes,
      // scroll included.
      const slot = slotRect();
      const card = document.querySelector<HTMLElement>(".card")!.getBoundingClientRect();
      el.style.left = `${slot.left}px`;
      el.style.top = `${slot.top}px`;
      el.style.width = `${slot.width}px`;
      el.style.height = `${slot.height}px`;
      // If .card hasn't been laid out yet, slot.width is 0 and this
      // division is NaN — which the CSS parser silently voids, making
      // the drive vanish with no transform at all. Guard the
      // denominator explicitly.
      const geo = {
        dx: chipRect.left + chipRect.width / 2 - slot.cx,
        dy: chipRect.top + chipRect.height / 2 - slot.cy,
        s: slot.width > 0 ? chipRect.width / slot.width : 1,
        pull: (PULL / 520) * card.width,
      };
      const u = st.u;
      const tx = ok((1 - u) * -geo.pull * st.pull + u * geo.dx);
      const ty = ok(u * geo.dy);
      const sc = ok(1 + (geo.s - 1) * u) || 1;
      el.style.transform = `rotateX(${ok(tiltNowRef.current * (1 - u))}deg)`;
      yEl.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
      hEl.style.transform = `rotateY(${ok(st.hinge)}deg)`;
      screw.style.opacity = String(st.screw);
      paintTilt();
    }
    return { st, paint, remove: () => el.remove() };
  }, [paintTilt]);

  const insert = useCallback(
    (i: number) => {
      const d = DOCS[i];
      const rail = document.getElementById("rail");
      const pockets = rail ? [...rail.querySelectorAll<HTMLElement>(".pocket")] : [];
      const chips = rail ? [...rail.querySelectorAll<HTMLElement>(".chip")] : [];
      pockets[i]?.classList.add("out");

      if (reduced) {
        tiltNowRef.current = REST;
        paintTilt();
        mountState(i);
        land(i);
        return Promise.resolve();
      }

      const F = makeFlight(d, chips[i]!.getBoundingClientRect());
      const s = F.st;
      F.paint();

      return new Promise<void>((done) => {
        timeline(
          [
            // the drive leaves the tray and crosses to the board
            { at: 0, dur: 0.9, ease: E.p3io, from: 1, to: 0, set: (v) => (s.u = v) },
            // the board lies back to meet it
            { at: 0.58, dur: 0.74, ease: E.p3io, from: REST, to: WORK, set: (v) => (tiltNowRef.current = v) },
            // the drive cocks up to its insertion angle while it is still
            // short of the socket, and finishes before the pads start to enter
            { at: 0.34, dur: 0.62, ease: E.p3io, from: 0, to: LIFT, set: (v) => (s.hinge = v) },
            // pads slide home along the drive's own axis
            { at: 1.2, dur: 0.62, ease: E.p2io, from: 1, to: 0, set: (v) => (s.pull = v) },
            { at: 1.82, dur: 0, from: 0, to: 1, set: () => mountState(i) },
            // and it presses flat, the way a real M.2 does
            { at: 1.82, dur: 0.5, ease: E.p2io, from: LIFT, to: 0, set: (v) => (s.hinge = v) },
            { at: 2.14, dur: 0.34, ease: E.p2out, from: 0, to: 1, set: (v) => (s.screw = v) },
            // board lays back down at the same pace it tilted up
            { at: 2.43, dur: 0.7, ease: E.p3io, from: WORK, to: REST, set: (v) => (tiltNowRef.current = v) },
          ],
          F.paint,
          done,
        );
      }).then(() => {
        // every transform is identity and the board is back at rest, so
        // the flier and the seated drive are the same pixels — the swap
        // is invisible
        land(i);
        F.remove();
      });
    },
    [land, makeFlight, mountState, paintTilt],
  );

  const ejectDrive = useCallback(
    (i: number, opts?: { silent?: boolean }) => {
      const d = DOCS[i];
      const rail = document.getElementById("rail");
      const chips = rail ? [...rail.querySelectorAll<HTMLElement>(".chip")] : [];
      const pockets = rail ? [...rail.querySelectorAll<HTMLElement>(".pocket")] : [];

      setLoadedIndex(null);
      chips[i]?.setAttribute("aria-current", "false");
      const status = document.getElementById("status");
      if (status) status.textContent = "—";

      if (reduced) {
        ledOff();
        const seated = document.getElementById("seated");
        if (seated) {
          (seated as HTMLElement).hidden = true;
          seated.innerHTML = "";
        }
        pockets[i]?.classList.remove("out");
        if (!opts?.silent) idle();
        return Promise.resolve();
      }

      const F = makeFlight(d, chips[i]!.getBoundingClientRect());
      const s = F.st;
      // hand off at rest, where the flier and the seated drive coincide
      s.u = 0;
      s.hinge = 0;
      s.pull = 0;
      s.screw = 1;
      const seated = document.getElementById("seated");
      if (seated) {
        (seated as HTMLElement).hidden = true;
        seated.innerHTML = "";
      }
      F.paint();
      if (!opts?.silent) idle();

      return new Promise<void>((done) => {
        timeline(
          [
            { at: 0, dur: 0.7, ease: E.p3io, from: REST, to: WORK, set: (v) => (tiltNowRef.current = v) },
            { at: 0.48, dur: 0.26, ease: E.p2in, from: 1, to: 0, set: (v) => (s.screw = v) },
            { at: 0.7, dur: 0.48, ease: E.backout, from: 0, to: LIFT, set: (v) => (s.hinge = v) },
            { at: 0.86, dur: 0, from: 0, to: 1, set: () => ledOff() },
            { at: 1.22, dur: 0.6, ease: E.p2io, from: 0, to: 1, set: (v) => (s.pull = v) },
            { at: 1.87, dur: 0.7, ease: E.p3io, from: WORK, to: REST, set: (v) => (tiltNowRef.current = v) },
            { at: 1.87, dur: 0.7, ease: E.p3io, from: LIFT, to: 0, set: (v) => (s.hinge = v) },
            // and back to its pocket in the tray
            { at: 2.27, dur: 0.85, ease: E.p3io, from: 0, to: 1, set: (v) => (s.u = v) },
          ],
          F.paint,
          done,
        );
      }).then(() => {
        F.remove();
        pockets[i]?.classList.remove("out");
      });
    },
    [idle, ledOff, makeFlight],
  );

  /* Swap orchestration. When a drive is already seated, the outgoing
   * eject and the incoming insert overlap deliberately: the outgoing
   * drive is already heading back to the tray when the next one lifts.
   * Their board-tilt tracks never collide — eject finishes laying the
   * board down at 2.57s into its own timeline, insert starts raising it
   * again at 2.27 + 0.58 = 2.85s into its own — so the 2270ms wait below
   * is what staggers the two timelines by that same margin. */
  const load = useCallback(
    async (i: number, opts?: { viaNav?: boolean }) => {
      if (busyRef.current || i === loadedIndexRef.current) return;
      setBusy(true);
      // Reports which real interaction triggered this load — a tray chip,
      // or PREV/NEXT — to the onboarding tour, if one is mounted. The
      // tour's gesture-gated steps only advance off this, never off a
      // timer, so this has to fire from the interaction itself rather
      // than from some later point where "how it started" is lost.
      tourSignal?.(opts?.viaNav ? "nav" : "chip");
      try {
        skipPostRef.current?.();
        clearTimers();
        if (loadedIndexRef.current !== null) {
          // silent: true — a swap already knows where it's going next, so
          // the outgoing doc (and statusline) stays on screen through the
          // eject and the stagger below instead of blanking to "NO DEVICE"
          // for a drive selection that isn't actually in question. That
          // idle screen is still correct for onEject(), the one caller
          // with no next drive queued.
          const back = ejectDrive(loadedIndexRef.current, { silent: true });
          // The 2270ms stagger only means something when there's an
          // actual flight to stagger against — under reduced motion,
          // eject/insert both resolve instantly, so waiting first just
          // holds the empty "NO DEVICE" state on screen for no reason.
          if (!reduced) await wait(2270);
          await Promise.all([back, insert(i)]);
        } else {
          await insert(i);
        }
      } catch (err) {
        console.warn("insert failed", err);
      } finally {
        setBusy(false);
      }
    },
    [clearTimers, ejectDrive, insert, tourSignal],
  );

  /* Screen-side stepper, wired to PREV/NEXT. Wraps around, and starts at
   * the first drive when the slot is empty so NEXT always does
   * something. Tells load() it came from nav rather than a chip, which is
   * the only thing that distinguishes the tour's "chip" step from its
   * "nav" step — both ultimately call the same load(). */
  const step = useCallback(
    (dir: 1 | -1) => {
      if (busyRef.current) return;
      const n = DOCS.length;
      const i = loadedIndexRef.current === null ? (dir > 0 ? 0 : n - 1) : (loadedIndexRef.current + dir + n) % n;
      void load(i, { viaNav: true });
    },
    [load],
  );

  const onEject = useCallback(async () => {
    if (busyRef.current || loadedIndexRef.current === null) return;
    setBusy(true);
    skipPostRef.current?.();
    await ejectDrive(loadedIndexRef.current);
    const hint = document.getElementById("hint");
    if (hint) hint.textContent = "Select one to load";
    setBusy(false);
    setHash(location.pathname);
  }, [ejectDrive]);

  /* Boot-on-mount: mirrors the source's own start() — the initial drive
   * (from the URL hash, or README) is already "in the machine" the
   * instant the stage reveals itself, so the screen is never dark. No
   * flight animation plays for this one; insert()'s flight is only for
   * drives loaded after the machine is already live.
   *
   * Also registers the tray's wheel-to-scroll behavior natively rather
   * than via React's onWheel: React's root listener registers wheel as
   * passive for scroll-performance reasons, so a synthetic onWheel
   * handler's preventDefault() is silently ignored. The source's own
   * script hits the same constraint and explicitly opts back out with
   * {passive:false} — this does the same. */
  useEffect(() => {
    document.body.classList.add("js");
    document.getElementById("pwr")?.classList.add("on");

    const i = fromHash();
    const rail = document.getElementById("rail");
    const pockets = rail ? [...rail.querySelectorAll<HTMLElement>(".pocket")] : [];
    pockets[i]?.classList.add("out");
    mountState(i);
    land(i);
    setReady(true);

    const onWheel = (e: WheelEvent) => {
      if (!rail) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    rail?.addEventListener("wheel", onWheel, { passive: false });

    fit();
    addEventListener("scroll", drawCables, { passive: true });

    const topEl = document.querySelector<HTMLElement>(".top");
    const ro = window.ResizeObserver && topEl ? new ResizeObserver(fit) : null;
    if (ro && topEl) ro.observe(topEl);

    // The whole levitation spring is skipped outright under reduced
    // motion, not just slowed down — a suspended object that gently
    // drifts and pitches on scroll is motion for its own sake, exactly
    // what prefers-reduced-motion is asking to opt out of. The monitor
    // simply sits at its CSS rest transform instead.
    if (!reduced) {
      lastScrollYRef.current = scrollY;
      floatRafRef.current = requestAnimationFrame(floatStep);
    }

    // Deep links stay live after boot: editing the URL hash, or using
    // back/forward through history the machine itself pushed via
    // setHash(), loads the matching drive rather than only working on
    // the very first paint.
    const onHashChange = () => void load(fromHash());
    addEventListener("hashchange", onHashChange);

    return () => {
      clearTimers();
      if (ledTimerRef.current !== null) clearTimeout(ledTimerRef.current);
      rail?.removeEventListener("wheel", onWheel);
      removeEventListener("scroll", drawCables);
      if (floatRafRef.current !== null) cancelAnimationFrame(floatRafRef.current);
      ro?.disconnect();
      removeEventListener("hashchange", onHashChange);
    };
    // Runs once on mount; mountState/land/clearTimers are stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Reveal the completed doc's children one at a time, the same stagger
   * the source's render() applies via Element.animate(). Effect (not
   * event handler) because `screen` flipping to "ready" is itself the
   * trigger, whichever path got it there (initial boot, and later,
   * load()'s boot()). */
  useEffect(() => {
    if (screen.kind !== "ready") return;
    if (reduced || !canAnimate) return;
    const crt = crtRef.current;
    if (!crt) return;
    const kids = crt.querySelectorAll(":scope > .doc > *");
    kids.forEach((el, k) => {
      (el as HTMLElement).animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 320, delay: k * 45, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" },
      );
    });
    crt.scrollTop = 0;
  }, [screen]);

  return {
    screen,
    loadedIndex,
    busy,
    ready,
    crtRef,
    onCrtClick,
    onChipClick: load,
    onEject,
    idle,
    land,
    mountState,
    ledOff,
    insert,
    ejectDrive,
    step,
  };
}
