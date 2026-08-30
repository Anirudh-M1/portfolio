"use client";

import { useEffect, useRef } from "react";
import "./pcb-canvas.css";

/* Palette tracks the page tokens so the board reads as the same material
 * as the carrier card, not a separate decorative layer. */
const COL = {
  trace: "rgba(148,99,64,.10)",
  traceHi: "rgba(217,172,85,.075)",
  pad: "rgba(217,172,85,.15)",
  via: "rgba(217,172,85,.10)",
  silk: "rgba(232,238,236,.055)",
  pour: "rgba(148,99,64,.05)",
  pulse: "217,172,85",
};
const CFG = { pitch: 7, chamfer: 14, pulses: 5, speed: [70, 150] as [number, number], tail: 120, dpr: 1.5, glow: 0.5 };
const REF = ["U1", "U4", "J2", "U7", "R12", "J5", "U2", "C9"];

type Pt = [number, number];
type Route = { pts: Pt[]; cum: number[]; len: number };

const R = (a: number, b: number) => a + Math.random() * (b - a);
const RI = (a: number, b: number) => Math.round(R(a, b));

/* Real routing turns at right angles and 45s, it doesn't wander — chamfer
 * rounds each corner of a Manhattan run to a 45deg cut instead of a hard
 * right angle, which is what actual PCB routing looks like under
 * magnification. */
function chamfer(pts: Pt[]): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1],
      c = pts[i],
      n = pts[i + 1];
    const c1 = Math.min(CFG.chamfer, Math.hypot(c[0] - p[0], c[1] - p[1]) / 2);
    const c2 = Math.min(CFG.chamfer, Math.hypot(n[0] - c[0], n[1] - c[1]) / 2);
    const a1 = Math.atan2(c[1] - p[1], c[0] - p[0]),
      a2 = Math.atan2(n[1] - c[1], n[0] - c[0]);
    out.push([c[0] - Math.cos(a1) * c1, c[1] - Math.sin(a1) * c1]);
    out.push([c[0] + Math.cos(a2) * c2, c[1] + Math.sin(a2) * c2]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* Offsets a polyline perpendicular to its own local direction, which is
 * how a parallel bus of traces is drawn from one spine path. */
function offset(pts: Pt[], d: number): Pt[] {
  return pts.map(([x, y], i) => {
    const p = pts[Math.max(0, i - 1)],
      n = pts[Math.min(pts.length - 1, i + 1)];
    const a = Math.atan2(n[1] - p[1], n[0] - p[0]) + Math.PI / 2;
    return [x + Math.cos(a) * d, y + Math.sin(a) * d];
  });
}

function measure(pts: Pt[]): Route {
  let len = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    cum.push(len);
  }
  return { pts, cum, len };
}

/* Point at distance `d` along a measured route — used to walk the
 * traveling pulse (next commit) smoothly along a path built from
 * unevenly-spaced segments. */
function at(rt: Route, d: number): Pt {
  const { pts, cum } = rt;
  if (d <= 0) return pts[0];
  if (d >= rt.len) return pts[pts.length - 1];
  let i = 1;
  while (cum[i] < d) i++;
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
}

function stroke(c: CanvasRenderingContext2D, pts: Pt[], style: string, w: number) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.strokeStyle = style;
  c.lineWidth = w;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.stroke();
}

function via(c: CanvasRenderingContext2D, x: number, y: number) {
  c.beginPath();
  c.arc(x, y, 2.4, 0, 7);
  c.strokeStyle = COL.via;
  c.lineWidth = 1.1;
  c.stroke();
}

/* Copper pour: large filled (well, hatched) regions are most of a real
 * board's area, and they're what create the quiet space between routing. */
function pour(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = COL.pour;
  c.lineWidth = 1;
  for (let i = -h; i < w + h; i += 9) {
    c.beginPath();
    c.moveTo(x + i, y);
    c.lineTo(x + i - h, y + h);
    c.stroke();
  }
  c.restore();
  c.strokeStyle = COL.pour;
  c.lineWidth = 1;
  c.strokeRect(x, y, w, h);
}

function part(c: CanvasRenderingContext2D, s: Pt2, i: number) {
  const w = R(48, 104),
    h = R(26, 56);
  c.strokeStyle = COL.silk;
  c.lineWidth = 1;
  c.strokeRect(s.x - w / 2, s.y - h / 2, w, h);
  const n = RI(4, 9),
    step = w / (n + 1);
  c.fillStyle = COL.pad;
  for (let k = 1; k <= n; k++) {
    c.fillRect(s.x - w / 2 + step * k - 2, s.y - h / 2 - 5, 4, 5);
    c.fillRect(s.x - w / 2 + step * k - 2, s.y + h / 2, 4, 5);
  }
  c.fillStyle = COL.silk;
  c.font = "9px ui-monospace,SFMono-Regular,monospace";
  c.fillText(REF[i % REF.length], s.x - w / 2, s.y - h / 2 - 9);
}

type Pt2 = { x: number; y: number };

/* Manhattan run with a single dog-leg — real routing turns at right
 * angles and 45s, it does not wander. chamfer() rounds the corners. */
function manhattan(a: Pt2, b: Pt2): Pt[] {
  const mx = a.x + (b.x - a.x) * R(0.32, 0.68);
  return [
    [a.x, a.y],
    [mx, a.y],
    [mx, b.y],
    [b.x, b.y],
  ];
}

/* Static canvas element for the animated PCB background — the page's own
 * backdrop, sitting under both the interactive stage and the .docs
 * fallback. The bake pass below draws one procedurally-generated board
 * (copper pours, components at fixed anchor positions, Manhattan-routed
 * trace buses between them, and a scattered via field) to an offscreen
 * canvas once per size change, which is then just blitted each frame —
 * the routing itself never needs recomputing, only the traveling pulses
 * layered on top of it (next commit) do. */
export function PcbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    type Pulse = { rt: Route; d: number; sp: number; w: number };

    let W = 0,
      H = 0,
      DPR = 1,
      bake: HTMLCanvasElement | null = null,
      routes: Route[] = [],
      pulses: Pulse[] = [],
      raf = 0,
      last = 0;

    function build() {
      routes = [];
      const off = document.createElement("canvas");
      off.width = W * DPR;
      off.height = H * DPR;
      const c = off.getContext("2d")!;
      c.scale(DPR, DPR);

      pour(c, -40, H * 0.58, W * 0.3, H * 0.5);
      pour(c, W * 0.72, -30, W * 0.34, H * 0.26);

      /* Components sit at deliberate positions around the edges rather
       * than scattered uniformly — the middle of the viewport is where
       * the monitor and carrier live, so routing keeps out of it. Density
       * follows the parts; uniform noise everywhere reads as generated. */
      const anchors: Pt[] = [
        [0.03, 0.1],
        [0.88, 0.06],
        [0.96, 0.38],
        [0.84, 0.8],
        [0.2, 0.95],
        [0.02, 0.68],
        [0.55, 0.02],
      ];
      const sites: Pt2[] = anchors.map(([x, y]) => ({ x: (x + R(-0.015, 0.015)) * W, y: (y + R(-0.02, 0.02)) * H }));
      sites.forEach((s, i) => part(c, s, i));

      /* Buses between neighbouring parts: several traces at a fixed
       * pitch, which is how a real bus looks — parallel, not each
       * individually wandering. */
      for (let i = 0; i < sites.length; i++) {
        const a = sites[i],
          b = sites[(i + 1) % sites.length];
        if (Math.hypot(b.x - a.x, b.y - a.y) > W * 0.85) continue;
        const spine = chamfer(manhattan(a, b));
        const n = RI(3, 6);
        for (let k = 0; k < n; k++) {
          routes.push(measure(k ? offset(spine, (k - (n - 1) / 2) * CFG.pitch) : spine));
        }
      }

      routes.forEach((rt, i) => stroke(c, rt.pts, i % 5 === 0 ? COL.traceHi : COL.trace, i % 7 === 0 ? 1.5 : 1));

      /* Vias where traces change layer — at the corners, which is where
       * they actually go. */
      routes.forEach((rt, i) => {
        if (i % 3) return;
        for (let k = 2; k < rt.pts.length - 2; k += 3) via(c, rt.pts[k][0], rt.pts[k][1]);
      });

      /* a scattered via field, as found stitching a ground pour */
      for (let i = 0; i < 26; i++) {
        const vx = R(0, W),
          vy = R(0, H);
        if (vx > W * 0.1 && vx < W * 0.66 && vy > H * 0.12 && vy < H * 0.8) continue;
        via(c, vx, vy);
      }

      bake = off;
    }

    function spawn(): Pulse {
      const rt = routes[RI(0, routes.length - 1)];
      return { rt, d: -CFG.tail, sp: R(CFG.speed[0], CFG.speed[1]), w: Math.random() < 0.3 ? 1.8 : 1.2 };
    }

    /* A pulse is drawn as a fading trail of short segments walking back
     * from its head, rather than a single glowing dot — that's what
     * reads as travelling THROUGH the trace instead of just sliding a
     * sprite over it. */
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx!.clearRect(0, 0, W, H);
      ctx!.drawImage(bake!, 0, 0, W, H);
      pulses.forEach((p, idx) => {
        p.d += p.sp * dt;
        if (p.d - CFG.tail > p.rt.len) {
          pulses[idx] = spawn();
          return;
        }
        const STEP = 9,
          n = Math.ceil(CFG.tail / STEP);
        for (let i = 0; i < n; i++) {
          const d = p.d - i * STEP;
          if (d < 0 || d > p.rt.len) continue;
          const a = Math.pow(1 - i / n, 2.1) * CFG.glow;
          const A = at(p.rt, d),
            B = at(p.rt, Math.max(0, d - STEP));
          ctx!.beginPath();
          ctx!.moveTo(A[0], A[1]);
          ctx!.lineTo(B[0], B[1]);
          ctx!.strokeStyle = `rgba(${COL.pulse},${Math.max(0, a)})`;
          ctx!.lineWidth = p.w;
          ctx!.lineCap = "round";
          ctx!.stroke();
        }
        const head = at(p.rt, Math.min(p.d, p.rt.len));
        ctx!.beginPath();
        ctx!.arc(head[0], head[1], p.w * 1.9, 0, 7);
        ctx!.fillStyle = `rgba(${COL.pulse},${0.55 * CFG.glow})`;
        ctx!.fill();
      });
      raf = requestAnimationFrame(frame);
    }

    function init() {
      W = innerWidth;
      H = innerHeight;
      DPR = Math.min(CFG.dpr, devicePixelRatio || 1);
      cv!.width = W * DPR;
      cv!.height = H * DPR;
      cv!.style.width = W + "px";
      cv!.style.height = H + "px";
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
      pulses = Array.from({ length: CFG.pulses }, spawn);
      if (raf) cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    init();
    let t: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (t) clearTimeout(t);
      t = setTimeout(init, 180);
    };
    addEventListener("resize", onResize);
    return () => {
      if (t) clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas id="pcb" aria-hidden="true" ref={canvasRef} />;
}
