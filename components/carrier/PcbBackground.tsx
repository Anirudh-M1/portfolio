"use client";

import { useEffect, useRef } from "react";
import "./pcb-background.css";

type Point = [number, number];
type Route = { pts: Point[]; cum: number[]; len: number };
type Pulse = { rt: Route; d: number; sp: number; w: number; hold: number };

const COL = {
  trace: "rgba(178,107,63,.115)",
  traceHi: "rgba(201,150,44,.075)",
  pad: "rgba(201,150,44,.16)",
  silk: "rgba(232,237,233,.055)",
  pulse: "201,150,44",
};
const CFG = {
  bundles: 16,
  perBundle: [2, 5] as [number, number],
  segs: [3, 6] as [number, number],
  seg: [90, 300] as [number, number],
  chamfer: 16,
  pitch: 7,
  fanouts: 2,
  pulses: 7,
  speed: [95, 215] as [number, number],
  tail: 120,
  dpr: 1.5,
  glow: 0.5,
};

const R = (a: number, b: number) => a + Math.random() * (b - a);
const RI = (a: number, b: number) => Math.floor(R(a, b + 1));

// Procedural PCB artwork with traveling gold signal pulses. Static geometry
// is baked to an offscreen canvas once; each frame only redraws the pulses.
export function PcbBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    const softMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0,
      H = 0,
      DPR = 1,
      routes: Route[] = [],
      pulses: Pulse[] = [],
      base: HTMLCanvasElement | null = null,
      raf: number | null = null,
      last = 0;

    function walk(x: number, y: number, horizFirst: boolean): Point[] {
      const pts: Point[] = [[x, y]];
      let horiz = horizFirst;
      for (let i = 0, n = RI(CFG.segs[0], CFG.segs[1]); i < n; i++) {
        const d = R(CFG.seg[0], CFG.seg[1]) * (Math.random() < 0.5 ? -1 : 1);
        const [px, py] = pts[pts.length - 1];
        pts.push(horiz ? [px + d, py] : [px, py + d]);
        horiz = !horiz;
      }
      return chamfer(pts);
    }
    function chamfer(pts: Point[]): Point[] {
      if (pts.length < 3) return pts;
      const out: Point[] = [pts[0]];
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
    function offset(pts: Point[], d: number): Point[] {
      return pts.map((p, i) => {
        const a = pts[Math.min(i + 1, pts.length - 1)],
          b = pts[Math.max(i - 1, 0)];
        const ang = Math.atan2(a[1] - b[1], a[0] - b[0]) + Math.PI / 2;
        return [p[0] + Math.cos(ang) * d, p[1] + Math.sin(ang) * d];
      });
    }
    function measure(pts: Point[]): Route {
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, cum, len: cum[cum.length - 1] };
    }
    function at(rt: Route, dist: number): Point {
      const { pts, cum } = rt;
      if (dist <= 0) return pts[0];
      if (dist >= rt.len) return pts[pts.length - 1];
      let i = 1;
      while (i < cum.length && cum[i] < dist) i++;
      const t = (dist - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }

    function build() {
      routes = [];
      for (let b = 0; b < CFG.bundles; b++) {
        const spine = walk(R(-120, W + 120), R(-80, H + 80), Math.random() < 0.5);
        const n = RI(CFG.perBundle[0], CFG.perBundle[1]);
        for (let k = 0; k < n; k++) routes.push(measure(k ? offset(spine, (k - (n - 1) / 2) * CFG.pitch) : spine));
      }
    }

    function bake() {
      base = document.createElement("canvas");
      base.width = cv.width;
      base.height = cv.height;
      const c = base.getContext("2d")!;
      c.scale(DPR, DPR);
      c.lineJoin = "round";
      c.lineCap = "round";

      for (let f = 0; f < CFG.fanouts; f++) {
        const gx = R(W * 0.1, W * 0.9),
          gy = R(H * 0.1, H * 0.9),
          cols = RI(9, 15),
          rows = RI(9, 15),
          p = 11;
        c.fillStyle = COL.pad;
        for (let i = 0; i < cols; i++)
          for (let j = 0; j < rows; j++) {
            c.beginPath();
            c.arc(gx + i * p, gy + j * p, 1.7, 0, 7);
            c.fill();
          }
        c.strokeStyle = COL.silk;
        c.lineWidth = 1;
        c.strokeRect(gx - 9, gy - 9, cols * p + 4, rows * p + 4);
      }

      routes.forEach((rt, i) => {
        c.strokeStyle = i % 3 ? COL.trace : COL.traceHi;
        c.lineWidth = i % 3 ? 1.15 : 1.5;
        c.beginPath();
        rt.pts.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
        c.stroke();
        c.fillStyle = COL.pad;
        [rt.pts[0], rt.pts[rt.pts.length - 1]].forEach((p) => {
          c.beginPath();
          c.arc(p[0], p[1], 2.6, 0, 7);
          c.fill();
        });
        if (i % 2 === 0)
          rt.pts.forEach((p, j) => {
            if (j % 3 === 0) {
              c.beginPath();
              c.arc(p[0], p[1], 1.3, 0, 7);
              c.fill();
            }
          });
      });

      c.fillStyle = COL.silk;
      c.font = "9px 'IBM Plex Mono', monospace";
      const tags = ["R", "C", "U", "L", "J", "D", "TP", "FB"];
      for (let i = 0; i < 26; i++) c.fillText(tags[RI(0, tags.length - 1)] + RI(1, 240), R(0, W - 30), R(14, H));
    }

    function spawn(): Pulse {
      const rt = routes[RI(0, routes.length - 1)];
      return { rt, d: -CFG.tail, sp: R(CFG.speed[0], CFG.speed[1]), w: R(1.3, 2.1), hold: R(0, 2.4) };
    }

    function frame(t: number) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base!, 0, 0);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      pulses.forEach((p, idx) => {
        if (p.hold > 0) {
          p.hold -= dt;
          return;
        }
        p.d += p.sp * dt;
        if (p.d - CFG.tail > p.rt.len) {
          pulses[idx] = spawn();
          return;
        }

        const STEP = 9,
          n = Math.ceil(CFG.tail / STEP);
        for (let i = 0; i < n; i++) {
          const d1 = p.d - i * STEP,
            d0 = d1 - STEP;
          if (d1 < 0 || d0 > p.rt.len) continue;
          const a = Math.pow(1 - i / n, 2.1) * CFG.glow;
          const [x0, y0] = at(p.rt, Math.max(0, d0)),
            [x1, y1] = at(p.rt, Math.min(p.rt.len, d1));
          ctx.strokeStyle = `rgba(${COL.pulse},${a * 0.5})`;
          ctx.lineWidth = p.w * 2.6;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.strokeStyle = `rgba(${COL.pulse},${a * 0.9})`;
          ctx.lineWidth = p.w;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        if (p.d > p.rt.len - 26 && p.d < p.rt.len + 70) {
          const e = p.rt.pts[p.rt.pts.length - 1];
          const a = 1 - Math.abs(p.d - p.rt.len) / 70;
          ctx.fillStyle = `rgba(${COL.pulse},${Math.max(0, a) * 0.55 * CFG.glow})`;
          ctx.beginPath();
          ctx.arc(e[0], e[1], 4.4, 0, 7);
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }

    function init() {
      DPR = Math.min(CFG.dpr, devicePixelRatio || 1);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      build();
      bake();
      if (raf !== null) cancelAnimationFrame(raf);
      if (softMotion) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(base!, 0, 0);
        return;
      }
      pulses = Array.from({ length: CFG.pulses }, spawn);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    let rz: number | null = null;
    const onResize = () => {
      if (rz !== null) clearTimeout(rz);
      rz = window.setTimeout(init, 220);
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (raf !== null) cancelAnimationFrame(raf);
      } else if (!softMotion) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    init();

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      if (rz !== null) clearTimeout(rz);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas id="pcb" ref={canvasRef} aria-hidden="true" />;
}
