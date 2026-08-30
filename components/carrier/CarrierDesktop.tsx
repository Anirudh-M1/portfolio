"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DRIVES, G, CAM, HEADER, DRAG, SH, TXT, OUT, HOLD, slugify } from "@/lib/carrier-data";
import { SiteFooter } from "./SiteFooter";
import { PcbBackground } from "./PcbBackground";
import "./carrier.css";
import "./tour.css";

gsap.registerPlugin(ScrollTrigger);

const fing = (n: number) => Array.from({ length: n }, () => "<i></i>").join("");
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

type Layout = { x: number; y: number; panelLeft: number; panelWidth: number };

/** GSAP hides/animates real server-rendered markup on mount — run before
 * paint so a JS-enabled visitor never sees the un-animated resting frame
 * flash before the intro timeline takes over. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function CarrierDesktop() {
  const railRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const bpRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const projectsLabelRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const tfieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const tutRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLButtonElement>(null);

  useIsomorphicLayoutEffect(() => {
    const plane = planeRef.current!;
    const bp = bpRef.current!;
    const panel = panelRef.current!;
    const hero = heroRef.current!;
    const cue = cueRef.current!;
    const projectsLabel = projectsLabelRef.current!;
    const experiencePanel = experienceRef.current!;
    const stick = stickRef.current!;
    const stage = stageRef.current!;
    const tfield = tfieldRef.current!;
    const rail = railRef.current!;
    const liveRegion = liveRef.current!;
    const tut = tutRef.current!;
    const helpbtn = helpRef.current!;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- build backplane silkscreen ---------- */
    const bottomY = G.top + 6 * G.bayH + 5 * G.gap + 22;
    bp.innerHTML = `
      <span class="mark lg" style="left:16px;top:14px">ANR-CARRIER-6X  REV A</span>
      <span class="mark" style="left:16px;top:28px">PCIE 4.0 X16 → 6× M.2 M-KEY</span>
      <span class="fid" style="left:18px;bottom:18px"></span>
      <span class="fid" style="right:18px;bottom:18px"></span>
      <span class="fid" style="left:18px;top:18px"></span>
      <span class="hdr" style="left:14px;top:${G.top - 38}px;width:56px;height:22px">${fing(6)}</span>
      <span class="mark" style="left:76px;top:${G.top - 33}px">J1 AUX 12V</span>
      <span class="hdr" style="left:14px;top:${G.top - 8}px;width:38px;height:19px">${fing(4)}</span>
      <span class="mark" style="left:58px;top:${G.top - 4}px">J8 FAN</span>
      <div class="switch" style="top:${bottomY + 18}px"></div>
      <span class="mark lg" style="left:120px;top:${bottomY + 4}px">U1  PCIE SWITCH</span>
      <span class="cap" style="left:104px;top:${bottomY + 34}px"></span>
      <span class="cap" style="left:104px;top:${bottomY + 52}px"></span>
      <span class="cap" style="left:104px;top:${bottomY + 70}px"></span>
      <span class="cap" style="left:240px;top:${bottomY + 34}px"></span>
      <span class="cap" style="left:240px;top:${bottomY + 52}px"></span>
      <span class="cap" style="left:240px;top:${bottomY + 70}px"></span>
      <span class="pkg" style="left:264px;top:${bottomY + 96}px;width:52px;height:34px"></span>
      <span class="mark" style="left:264px;top:${bottomY + 84}px">U2 REFCLK BUF</span>
      <span class="ind" style="left:344px;top:${bottomY + 22}px"></span>
      <span class="ind" style="left:374px;top:${bottomY + 22}px"></span>
      <span class="ind" style="left:404px;top:${bottomY + 22}px"></span>
      <span class="mark" style="left:344px;top:${bottomY + 8}px">L1-L3  VRM</span>
      <span class="cap v" style="left:346px;top:${bottomY + 52}px"></span>
      <span class="cap v" style="left:362px;top:${bottomY + 52}px"></span>
      <span class="cap v" style="left:378px;top:${bottomY + 52}px"></span>
      <span class="tp" style="left:452px;top:${bottomY + 40}px"></span>
      <span class="tp" style="left:468px;top:${bottomY + 40}px"></span>
      <span class="tp" style="left:484px;top:${bottomY + 40}px"></span>
      <span class="mark" style="left:448px;top:${bottomY + 26}px">TP1-3</span>
      <span class="fingers" style="left:${G.W / 2 - 128}px">${fing(11)}</span>
      <span class="fingers" style="left:${G.W / 2 - 52}px">${fing(38)}</span>
      <span class="mark" style="left:${G.W / 2 - 128}px;bottom:34px">PCIE X16 EDGE</span>`;

    /* ---------- drive bays: real markup, server-rendered in JSX below ----------
       The script enhances what's already in the DOM instead of generating it,
       so the six projects are real content for no-JS visitors and scrapers. */

    const bays = [...plane.querySelectorAll<HTMLDivElement>(".bay")];
    const mounts = bays.map((b) => b.querySelector<HTMLDivElement>("[data-mount]")!);
    const drives = bays.map((b) => b.querySelector<HTMLButtonElement>("[data-drive]")!);
    const screws = bays.map((b) => b.querySelector<HTMLElement>("[data-screw]")!);
    const fixtures = [...plane.querySelectorAll<HTMLElement>(".fixtures")];
    const leds = [...plane.querySelectorAll<HTMLElement>(".act")];
    const dimmable = [bp, ...fixtures, ...leds, ...plane.querySelectorAll<HTMLElement>(".mark")];

    let prog = 0;
    let open: number | null = null;
    let busy = false;
    let progAtOpen = 0;

    function fitScale() {
      const vh = innerHeight * 0.84,
        vw = innerWidth * (innerWidth < 820 ? 0.92 : 0.5);
      return Math.max(0.34, Math.min(1, vh / G.H, vw / G.W));
    }
    let FIT = fitScale();

    function headerLayout(i: number): Layout {
      const standW = G.driveH * HEADER.scale * FIT;
      const margin = innerWidth * HEADER.marginVW;
      const screenCx = -innerWidth / 2 + margin + standW / 2;
      const px = screenCx / FIT + G.W / 2;
      const driveCx = G.bayL + G.bayW - 12 - G.driveW / 2 - G.pull;
      const driveCy = G.top + i * (G.bayH + G.gap) + G.bayH / 2;
      const panelLeft = innerWidth / 2 + screenCx + standW / 2 + HEADER.gapPx;
      return {
        x: px - driveCx,
        y: G.H / 2 - driveCy,
        panelLeft,
        panelWidth: Math.min(HEADER.panelMax, innerWidth - panelLeft - margin),
      };
    }

    const onResize = () => {
      FIT = fitScale();
      if (open === null) applyCamera();
    };
    addEventListener("resize", onResize);

    /* ---------- drag orbit ---------- */
    let dragRX = 0,
      dragRY = 0,
      vX = 0,
      vY = 0,
      dragging = false,
      lastX = 0,
      lastY = 0,
      moved = 0,
      spin: number | null = null;
    const canDrag = () => open === null && !busy && prog < DRAG.until;

    function cameraPose() {
      const p = ease(Math.min(1, prog / 0.82));
      const df = 1 - Math.min(1, p * 1.35);
      return {
        rotationX: CAM.hero.rx + (CAM.dock.rx - CAM.hero.rx) * p + dragRX * df,
        rotationY: CAM.hero.ry + (CAM.dock.ry - CAM.hero.ry) * p + dragRY * df,
        x: (CAM.hero.x + (CAM.dock.x - CAM.hero.x) * p) * FIT,
        y: (CAM.hero.y + (CAM.dock.y - CAM.hero.y) * p) * FIT,
        scale: (CAM.hero.s + (CAM.dock.s - CAM.hero.s) * p) * FIT,
      };
    }

    function applyCamera() {
      const p = ease(Math.min(1, prog / 0.82));
      gsap.set(plane, cameraPose());
      gsap.set(hero, { opacity: 1 - Math.min(1, p * 1.7), y: -30 * p, pointerEvents: p > 0.4 ? "none" : "auto" });
      gsap.set(cue, { opacity: 1 - Math.min(1, p * 2.2) });
      // Projects/Experience flank the board once it's mostly docked, taking
      // over from the hero rather than overlapping it.
      const sideOpacity = clamp((p - 0.5) / 0.25, 0, 1);
      const sidePointerEvents = p > 0.5 ? "auto" : "none";
      gsap.set(projectsLabel, { opacity: sideOpacity, pointerEvents: sidePointerEvents });
      gsap.set(experiencePanel, { opacity: sideOpacity, pointerEvents: sidePointerEvents });
      drives.forEach((d) => (d.tabIndex = p > 0.55 ? 0 : -1));
      stage.classList.toggle("grabbable", canDrag());
      stage.classList.toggle("docked", p > 0.55);
      if (p > 0.9) tourSignal("dock");
    }

    const onPointerDown = (e: PointerEvent) => {
      moved = 0;
      if (!canDrag()) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      vX = vY = 0;
      if (spin !== null) cancelAnimationFrame(spin);
      stage.classList.add("grabbing");
      stage.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      vX = dx * DRAG.ySens;
      vY = -dy * DRAG.xSens;
      dragRY = clamp(dragRY + vX, -DRAG.yClamp, DRAG.yClamp);
      dragRX = clamp(dragRX + vY, -DRAG.xClamp, DRAG.xClamp);
      applyCamera();
    };
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("grabbing");
      if (moved > 26) tourSignal("drag");
      const step = () => {
        vX *= DRAG.friction;
        vY *= DRAG.friction;
        if (Math.abs(vX) < 0.02 && Math.abs(vY) < 0.02) return;
        dragRY = clamp(dragRY + vX, -DRAG.yClamp, DRAG.yClamp);
        dragRX = clamp(dragRX + vY, -DRAG.xClamp, DRAG.xClamp);
        applyCamera();
        spin = requestAnimationFrame(step);
      };
      spin = requestAnimationFrame(step);
    }
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    const st = ScrollTrigger.create({
      trigger: rail,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate(self) {
        prog = self.progress;
        if (open !== null) {
          if (Math.abs(prog - progAtOpen) > 0.015) seat();
          return;
        }
        applyCamera();
      },
    });

    /* ---------- shard assembly ---------- */
    function buildShards(w: number, h: number) {
      const host = panel.querySelector<HTMLDivElement>(".shards")!;
      const cols = Math.ceil(w / SH.cell),
        rows = Math.ceil(h / SH.cell);
      const cw = w / cols,
        ch = h / rows;
      let html = "";
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const st = `left:${c * cw}px;top:${r * ch}px;width:${cw + 0.6}px;height:${ch + 0.6}px`;
          html += `<i class="a" style="${st}"></i><i class="b" style="${st}"></i>`;
        }
      host.innerHTML = html;
      return [...host.querySelectorAll<HTMLElement>("i")].map((el) => ({
        el,
        d: (parseFloat(el.style.left) / w) * SH.sweepSpan + Math.random() * SH.jitter,
      }));
    }

    function splitWords(root: HTMLElement) {
      root.querySelectorAll<HTMLElement>("h3,.kick,dt,dd").forEach((el) => {
        el.innerHTML = (el.textContent ?? "")
          .split(/(\s+)/)
          .map((w) => (/^\s+$/.test(w) ? w : `<span class="w">${w}</span>`))
          .join("");
      });
      return [...root.querySelectorAll<HTMLElement>(".w,.chip,.plink,.shut")];
    }

    function buildField(box: { left: number; top: number; width: number; height: number }) {
      let html = "";
      for (let i = 0; i < SH.fieldCount; i++) {
        const s = rnd(12, 46);
        const x = rnd(box.left - 140, box.left + box.width + 90);
        const y = rnd(box.top - 110, box.top + box.height + 110);
        const flip = Math.random() < 0.5;
        const col = Math.random() < 0.35 ? "rgba(201,150,44,.22)" : "rgba(232,237,233,.07)";
        html += `<i style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;background:${col};
          clip-path:polygon(${flip ? "0 0,100% 0,0 100%" : "100% 0,100% 100%,0 100%"})"></i>`;
      }
      tfield.innerHTML = html;
      return [...tfield.querySelectorAll<HTMLElement>("i")].map((el) => ({
        el,
        d: ((parseFloat(el.style.left) - (box.left - 140)) / (box.width + 230)) * 0.7 + Math.random() * 0.2,
      }));
    }

    function showPanel(i: number, L: Layout) {
      const d = DRIVES[i];
      panel.style.left = Math.round(L.panelLeft) + "px";
      panel.style.width = Math.round(L.panelWidth) + "px";
      panel.innerHTML = `<div class="shards"></div><div class="sweep"></div><div class="frame"></div>
         <div class="pbody">
           <h3>${d.name}</h3><p class="kick">${d.kick}</p>
           <div class="stackrow">${d.stack.map((s) => `<span class="chip">${s}</span>`).join("")}</div>
           <dl>${d.specs.map((s) => `<dt>${s[0]}</dt><dd>${s[1]}</dd>`).join("")}</dl>
           ${d.links.length ? `<div class="linkrow">${d.links.map(([label, url]) => `<a class="plink" href="${url}" target="_blank" rel="noopener">${label} →</a>`).join("")}</div>` : ""}
           <button class="shut" type="button">Seat drive</button>
         </div>`;
      panel.classList.add("on");
      panel.querySelector(".shut")!.addEventListener("click", () => seat());
      gsap.set(panel, { opacity: 1 });

      const body = panel.querySelector<HTMLElement>(".pbody")!,
        sweep = panel.querySelector<HTMLElement>(".sweep")!,
        frame = panel.querySelector<HTMLElement>(".frame")!;

      if (reduced) {
        gsap.set(panel.querySelector(".shards"), { opacity: 1 });
        buildShards(panel.offsetWidth, panel.offsetHeight);
        gsap.set(panel.querySelectorAll(".shards i"), { opacity: 1 });
        gsap.set([body, frame], { opacity: 1 });
        splitWords(body);
        (panel.querySelector(".shut") as HTMLElement)?.focus();
        return;
      }

      gsap.set(body, { opacity: 0 });
      const w = panel.offsetWidth,
        h = panel.offsetHeight;
      const shards = buildShards(w, h);
      const box = panel.getBoundingClientRect();
      const stickBox = stick.getBoundingClientRect();
      const field = buildField({
        left: box.left - stickBox.left,
        top: box.top - stickBox.top,
        width: box.width,
        height: box.height,
      });

      const tl = gsap.timeline();

      field.forEach(({ el, d }) => {
        tl.fromTo(
          el,
          { opacity: 0, x: -70, rotationY: -70, rotationZ: rnd(-40, 40), scale: 0.4 },
          { opacity: 1, x: 0, rotationY: 0, rotationZ: 0, scale: 1, duration: 0.85, ease: "power2.out" },
          d * 1.15
        );
      });

      shards.forEach(({ el, d }) => {
        tl.fromTo(
          el,
          { opacity: 0, x: -26, rotationY: -82, rotationX: 18, scale: 0.55 },
          { opacity: 1, x: 0, rotationY: 0, rotationX: 0, scale: 1, duration: SH.shardDur, ease: "power2.out" },
          d
        );
      });

      tl.fromTo(sweep, { opacity: 1, x: -120 }, { x: w + 120, duration: SH.sweepSpan + 0.42, ease: "power1.inOut" }, 0)
        .to(sweep, { opacity: 0, duration: 0.34 }, SH.sweepSpan + 0.26)
        .to(frame, { opacity: 1, duration: 0.5 }, SH.sweepSpan + 0.34);

      gsap.set(body, { opacity: 1 });
      const words = splitWords(body);
      const maxL = Math.max(1, ...words.map((el) => el.offsetLeft));
      const start = SH.sweepSpan + TXT.lead;
      words.forEach((el) => {
        const d = (el.offsetLeft / maxL) * TXT.span + Math.random() * TXT.jitter;
        tl.fromTo(el, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: TXT.dur, ease: "power2.out" }, start + d);
      });
      tl.add(() => {
        (panel.querySelector(".shut") as HTMLElement)?.focus();
        tourVeil(false); // panel is up — highlight it
      }, start + TXT.span + TXT.dur);
    }

    function hidePanel() {
      panel.classList.remove("on");
      gsap.killTweensOf(panel.querySelectorAll("*"));
      gsap.killTweensOf(tfield.querySelectorAll("i"));

      const shards = [...panel.querySelectorAll<HTMLElement>(".shards i")];
      const words = [...panel.querySelectorAll<HTMLElement>(".pbody .w,.pbody .chip,.pbody .plink,.pbody .shut")];
      const frame = panel.querySelector<HTMLElement>(".frame")!;
      const sweep = panel.querySelector<HTMLElement>(".sweep")!;
      const fieldEls = [...tfield.querySelectorAll<HTMLElement>("i")];
      const w = panel.offsetWidth || 1;

      const wipe = () => {
        panel.innerHTML = "";
        tfield.innerHTML = "";
        gsap.set(panel, { opacity: 0 });
      };

      if (reduced || !shards.length) {
        gsap.to(panel, { opacity: 0, duration: 0.2, onComplete: wipe });
        return 0;
      }

      const tl = gsap.timeline({ onComplete: wipe });
      const maxL = Math.max(1, ...words.map((el) => el.offsetLeft));

      words.forEach((el) => {
        const d = (1 - el.offsetLeft / maxL) * OUT.textSpan + Math.random() * 0.05;
        tl.to(el, { opacity: 0, x: 16, duration: OUT.textDur, ease: "power2.in" }, d);
      });

      tl.to(frame, { opacity: 0, duration: 0.3 }, OUT.shardLead - 0.06);

      shards.forEach((el) => {
        const x = parseFloat(el.style.left) || 0;
        const d = OUT.shardLead + (1 - x / w) * OUT.shardSpan + Math.random() * 0.07;
        tl.to(el, { opacity: 0, x: 20, rotationY: 72, rotationX: -14, scale: 0.55, duration: OUT.shardDur, ease: "power2.in" }, d);
      });

      tl.fromTo(sweep, { opacity: 1, x: w + 120 }, { x: -150, duration: OUT.shardSpan + 0.34, ease: "power1.inOut" }, OUT.shardLead - 0.06).to(
        sweep,
        { opacity: 0, duration: 0.26 },
        OUT.shardLead + OUT.shardSpan - 0.2
      );

      fieldEls.forEach((el) => {
        const d = OUT.shardLead + Math.random() * 0.34;
        tl.to(el, { opacity: 0, x: 26, rotationY: 60, rotationZ: rnd(-40, 40), scale: 0.4, duration: 0.42, ease: "power2.in" }, d);
      });

      return OUT.handoff;
    }

    /* ---------- pull ---------- */
    function pull(i: number) {
      if (busy || open === i) return;
      if (open !== null) {
        seat();
        return;
      }
      busy = true;
      open = i;
      progAtOpen = prog;
      tourSignal("open");
      tourVeil(true);
      history.replaceState(null, "", "#" + slugify(DRIVES[i].name));
      liveRegion.textContent = `${DRIVES[i].name} details opened`;
      const mt = mounts[i],
        dr = drives[i],
        sc = screws[i],
        led = leds[i],
        L = headerLayout(i);
      bays[i].style.zIndex = "60";

      if (reduced) {
        gsap.set(plane, { rotationX: 0 });
        gsap.set(sc, { opacity: 0 });
        gsap.set(mt, { rotationY: 0, x: -G.pull });
        gsap.set(dr, { rotationZ: HEADER.rotZ, x: L.x, y: L.y, z: 140, scale: HEADER.scale });
        led.classList.remove("lit");
        gsap.set(dimmable, { opacity: 0.12 });
        showPanel(i, L);
        busy = false;
        return;
      }

      const tl = gsap.timeline({
        onComplete() {
          busy = false;
        },
      });
      tl.to(plane, { rotationX: CAM.tiltRX, rotationY: 0, duration: 0.7, ease: "power3.inOut" })
        .to(sc, { opacity: 0, z: 22, duration: 0.26, ease: "power2.in" }, "-=.22")
        .to(mt, { rotationY: G.lift, duration: 0.48, ease: "back.out(2.2)" }, "-=.04")
        .add(() => led.classList.remove("lit"), "-=.32")
        .to(mt, { x: -G.pull, duration: 0.6, ease: "power2.inOut" }, "+=.04")
        .to(plane, { rotationX: 0, duration: 0.7, ease: "power3.inOut" }, "+=.05")
        .to(mt, { rotationY: 0, duration: 0.7, ease: "power3.inOut" }, "<")
        .to(dr, { z: 140, duration: 0.7, ease: "power3.inOut" }, "<")
        .to(dimmable, { opacity: 0.12, duration: 0.6 }, "<")
        .to(
          drives.filter((_, j) => j !== i),
          { opacity: 0.1, duration: 0.6 },
          "<"
        )
        .to(dr, { rotationZ: HEADER.rotZ, x: L.x, y: L.y, scale: HEADER.scale, duration: 0.85, ease: "power3.inOut" }, "-=.3")
        .add(() => showPanel(i, L), "+=" + HOLD);
    }

    function seat() {
      if (open === null || busy) return;
      const i = open,
        mt = mounts[i],
        dr = drives[i],
        sc = screws[i],
        led = leds[i];
      open = null;
      busy = true;
      tourSignal("close");
      tourVeil(true);
      history.replaceState(null, "", location.pathname + location.search);
      liveRegion.textContent = `${DRIVES[i].name} details closed`;
      const wait = hidePanel();

      if (reduced) {
        gsap.set(dr, { rotationZ: 0, x: 0, y: 0, z: 0, scale: 1 });
        gsap.set(mt, { rotationY: 0, x: 0 });
        gsap.set(sc, { opacity: 1, z: 0 });
        gsap.set(dimmable, { opacity: 1 });
        gsap.set(drives, { opacity: 1 });
        led.classList.add("lit");
        bays[i].style.zIndex = "";
        applyCamera();
        busy = false;
        return;
      }

      const tl = gsap.timeline({
        delay: wait,
        onComplete() {
          bays[i].style.zIndex = "";
          busy = false;
          tourVeil(false);
        },
      });
      tl.to(dr, { rotationZ: 0, x: 0, y: 0, scale: 1, duration: 0.9, ease: "power3.inOut" })
        .to(dimmable, { opacity: 1, duration: 0.68 }, "-=.48")
        .to(drives, { opacity: 1, duration: 0.68 }, "<")
        .to(plane, { rotationX: CAM.tiltRX, duration: 0.74, ease: "power3.inOut" }, "-=.52")
        .to(mt, { rotationY: G.lift, duration: 0.74, ease: "power3.inOut" }, "<")
        .to(dr, { z: 0, duration: 0.74, ease: "power3.inOut" }, "<")
        .to(mt, { x: 0, duration: 0.62, ease: "power2.inOut" }, "-=.12")
        .add(() => led.classList.add("lit"))
        .to(mt, { rotationY: 0, duration: 0.5, ease: "power2.inOut" })
        .to(sc, { opacity: 1, z: 0, duration: 0.34, ease: "power2.out" }, "-=.18")
        .to(plane, { ...cameraPose(), duration: 0.7, ease: "power3.inOut", onComplete: applyCamera }, "-=.05");
    }

    /* ---------- guided walkthrough ---------- */
    const TOUR_STORAGE_KEY = "carrier-tour-seen";

    let tourOn = false,
      ti = 0,
      typer: number | null = null,
      track: number | null = null,
      tourDriving = false,
      veiled = false;

    const spot = tut.querySelector<HTMLElement>(".spot")!;
    const bT = tut.querySelector<HTMLElement>('[data-blk="t"]')!;
    const bR = tut.querySelector<HTMLElement>('[data-blk="r"]')!;
    const bB = tut.querySelector<HTMLElement>('[data-blk="b"]')!;
    const bL = tut.querySelector<HTMLElement>('[data-blk="l"]')!;
    const ttext = tut.querySelector<HTMLElement>(".ttext")!;
    const tstepEl = tut.querySelector<HTMLElement>(".tstep")!;
    const ttotalEl = tut.querySelector<HTMLElement>(".ttotal")!;
    const tnext = tut.querySelector<HTMLButtonElement>(".tnext")!;
    const tskip = tut.querySelector<HTMLButtonElement>(".tskip")!;
    const twait = tut.querySelector<HTMLElement>(".tutwait")!;
    const twaitmsg = tut.querySelector<HTMLElement>(".twaitmsg")!;

    type TourWait = "drag" | "open" | "close" | "dock";
    type TourStep = {
      txt: string;
      at: () => Element;
      pad: number;
      wait?: TourWait;
      waitMsg?: string;
      run?: () => void;
      auto?: { to: number; dur: number };
      last?: boolean;
    };

    /* demo the drag for anyone who presses "Show me" instead of doing it */
    function demoDrag() {
      const o = { v: dragRY };
      gsap.to(o, {
        v: 44,
        duration: 0.85,
        ease: "power2.inOut",
        onUpdate() {
          dragRY = o.v;
          applyCamera();
        },
        onComplete() {
          gsap.to(o, {
            v: -8,
            duration: 0.95,
            ease: "power2.inOut",
            onUpdate() {
              dragRY = o.v;
              applyCamera();
            },
            onComplete() {
              tourSignal("drag");
            },
          });
        },
      });
    }

    const TOUR: TourStep[] = [
      { txt: "CARRIER-6X ONLINE. Six M.2 bays, one project per drive.", at: () => plane, pad: 16 },
      {
        txt: "The board is a physical object. Grab it and turn it.",
        at: () => plane,
        pad: 16,
        wait: "drag",
        waitMsg: "Drag the board",
        run: demoDrag,
      },
      { txt: "Docking the board now. It rotates flat and centres.", at: () => plane, pad: 16, auto: { to: 1, dur: 2.2 } },
      {
        txt: "Each drive is a project. Select one to eject it.",
        at: () => drives[0],
        pad: 10,
        wait: "open",
        waitMsg: "Click the highlighted drive",
        run: () => pull(0),
      },
      {
        txt: "The drive unscrews, ejects, and stands as the section header. Its spec sheet assembles beside it.",
        at: () => panel,
        pad: 14,
      },
      {
        txt: "Seat the drive to return it to its bay. Escape works too.",
        at: () => panel.querySelector(".shut") || panel,
        pad: 10,
        wait: "close",
        waitMsg: "Seat the drive",
        run: () => seat(),
      },
      { txt: "Walkthrough complete. Six bays populated. Take a look around.", at: () => plane, pad: 16, last: true },
    ];
    ttotalEl.textContent = String(TOUR.length);

    /* hide the highlight while a transition owns the screen; the blockers
       stay up and cover everything so nothing is clickable mid-animation */
    function tourVeil(on: boolean) {
      if (!tourOn) return;
      veiled = !!on;
      tut.classList.toggle("veil", veiled);
    }

    /* fast terminal-style typing */
    function type(str: string, done?: () => void) {
      if (typer !== null) clearInterval(typer);
      ttext.textContent = "";
      if (reduced) {
        ttext.textContent = str;
        done?.();
        return;
      }
      let k = 0;
      typer = window.setInterval(() => {
        ttext.textContent += str[k++];
        if (k >= str.length && typer !== null) {
          clearInterval(typer);
          done?.();
        }
      }, 15);
    }

    /* the spotlight follows its target every frame — targets are transformed
       by scroll and drag, so a one-shot measurement would drift */
    function trackSpot() {
      const s = TOUR[ti];
      if (!s) return;
      let el: Element = s.at();
      let r = el?.getBoundingClientRect();
      /* if a target is missing or collapsed, fall back to the board rather
         than shrinking the spotlight to a point somewhere off-screen */
      if (!r || r.width < 4 || r.height < 4) {
        el = plane;
        r = plane.getBoundingClientRect();
      }
      const p = s.pad || 12;
      const L = r.left - p,
        T = r.top - p,
        Wd = r.width + p * 2,
        Ht = r.height + p * 2;
      spot.style.left = L + "px";
      spot.style.top = T + "px";
      spot.style.width = Wd + "px";
      spot.style.height = Ht + "px";
      if (veiled) {
        /* no hole at all — the whole viewport is sealed */
        bT.style.cssText = "left:0;top:0;width:100%;height:100%";
        bR.style.cssText = bB.style.cssText = bL.style.cssText = "width:0;height:0";
      } else {
        bT.style.cssText = `left:0;top:0;width:100%;height:${Math.max(0, T)}px`;
        bB.style.cssText = `left:0;top:${T + Ht}px;width:100%;height:${Math.max(0, innerHeight - T - Ht)}px`;
        bL.style.cssText = `left:0;top:${T}px;width:${Math.max(0, L)}px;height:${Ht}px`;
        bR.style.cssText = `left:${L + Wd}px;top:${T}px;width:${Math.max(0, innerWidth - L - Wd)}px;height:${Ht}px`;
      }
      track = requestAnimationFrame(trackSpot);
    }

    /* the tour moves the page itself, so a step never points off-screen */
    function tourScroll(p: number, dur: number) {
      const max = Math.max(1, rail.offsetHeight - innerHeight);
      const o = { y: scrollY };
      tourDriving = true;
      return gsap.to(o, {
        y: rail.offsetTop + max * p,
        duration: dur,
        ease: "power2.inOut",
        onUpdate() {
          scrollTo(0, o.y);
        },
        onComplete() {
          tourDriving = false;
        },
      });
    }

    function renderStep() {
      const s = TOUR[ti];
      tstepEl.textContent = String(ti + 1);
      twait.hidden = true;
      tnext.disabled = true;
      tnext.textContent = s.last ? "Finish" : s.wait ? "Show me" : "Next";
      type(s.txt, () => {
        if (s.auto) {
          /* tour drives the page itself */
          tourScroll(s.auto.to, s.auto.dur).eventCallback("onComplete", () => {
            tourDriving = false;
            gsap.delayedCall(0.5, stepNext);
          });
          return;
        }
        if (s.wait) {
          twaitmsg.textContent = s.waitMsg ?? "";
          twait.hidden = false;
        }
        tnext.disabled = false;
      });
    }

    function tourSignal(name: TourWait) {
      if (!tourOn) return;
      const s = TOUR[ti];
      if (s && s.wait === name) setTimeout(stepNext, 420);
    }

    function stepNext() {
      if (!tourOn) return;
      if (ti >= TOUR.length - 1) {
        endTour();
        return;
      }
      ti++;
      renderStep();
    }

    function startTour() {
      if (open !== null) seat();
      scrollTo(0, 0); // known starting state every time
      tourOn = true;
      ti = 0;
      tourDriving = false;
      veiled = false;
      tut.classList.remove("veil");
      tut.classList.add("on");
      renderStep();
      if (track !== null) cancelAnimationFrame(track);
      trackSpot();
    }

    function endTour() {
      tourOn = false;
      tourDriving = false;
      veiled = false;
      tut.classList.remove("on", "veil");
      if (typer !== null) clearInterval(typer);
      if (track !== null) cancelAnimationFrame(track);
      [bT, bR, bB, bL].forEach((b) => (b.style.cssText = "width:0;height:0"));
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    }

    /* on a wait step, Next performs the action rather than skipping past it —
       advancing without it left later steps pointing at things that don't exist */
    const onTourNext = () => {
      const s = TOUR[ti];
      if (!s) return;
      if (s.wait && s.run) {
        if (busy) return;
        tnext.disabled = true;
        twait.hidden = true;
        s.run();
        return;
      }
      stepNext();
    };
    tnext.addEventListener("click", onTourNext);
    tskip.addEventListener("click", endTour);
    const onHelpClick = () => (tourOn ? endTour() : startTour());
    helpbtn.addEventListener("click", onHelpClick);

    /* user scrolling during the tour is what desynced everything — lock it */
    const killScroll = (e: Event) => {
      if (tourOn && !tourDriving) e.preventDefault();
    };
    addEventListener("wheel", killScroll, { passive: false });
    addEventListener("touchmove", killScroll, { passive: false });

    const driveClickHandlers = drives.map((d, i) => {
      const handler = (e: MouseEvent) => {
        e.stopPropagation();
        if (moved > 6 || prog < 0.55) return;
        /* during the tour, only the step that asks for it may open a drive */
        if (tourOn && (!TOUR[ti] || TOUR[ti].wait !== "open")) return;
        pull(i);
      };
      d.addEventListener("click", handler);
      return handler;
    });

    const onStickClick = (e: MouseEvent) => {
      if (open === null || moved > 6) return;
      const target = e.target as HTMLElement;
      if (target.closest(".drive") || target.closest(".panel")) return;
      seat();
    };
    stick.addEventListener("click", onStickClick);

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (tourOn) {
          endTour();
          return;
        }
        seat();
        return;
      }
      if (tourOn && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.key === "Tab" && open !== null) {
        const focusables = [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
        if (!focusables.length) return;
        const first = focusables[0],
          last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeydown, { passive: false });

    /* ---------- deep link: #<slug> lands docked with that drive already open ---------- */
    const deepLinkHash = decodeURIComponent(location.hash.slice(1));
    const deepLinkIndex = deepLinkHash ? DRIVES.findIndex((d) => slugify(d.name) === deepLinkHash) : -1;

    applyCamera();
    if (deepLinkIndex !== -1) {
      gsap.set(".mask-line>span", { yPercent: 0 });
      const target = rail.offsetTop + rail.offsetHeight - innerHeight;
      scrollTo(0, target);
      // Drive prog/applyCamera directly rather than relying on
      // ScrollTrigger to notice the programmatic scrollTo in time —
      // this must land docked (hero hidden) before pull() runs.
      prog = 1;
      applyCamera();
      pull(deepLinkIndex);
    } else if (reduced) {
      gsap.set(".mask-line>span", { yPercent: 0 });
      gsap.set(".js-in", { opacity: 1 });
    } else {
      gsap.set(".mask-line>span", { yPercent: 115 });
      gsap.set(".js-in", { y: 10 });
      gsap.set(mounts, { x: -620 });
      gsap.set(drives, { opacity: 0 });
      gsap.set(screws, { opacity: 0 });
      gsap.set(leds, { opacity: 0 });
      leds.forEach((l) => l.classList.remove("lit"));

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(".eyebrow", { opacity: 1, y: 0, duration: 0.6 })
        .to(".mask-line>span", { yPercent: 0, duration: 1, stagger: 0.09, ease: "power4.out" }, "-=.35")
        .to(".tagline", { opacity: 1, y: 0, duration: 0.7 }, "-=.5")
        .to(".fastpath", { opacity: 1, y: 0, duration: 0.6 }, "-=.45")
        .to(drives, { opacity: 1, duration: 0.2, stagger: 0.09 }, "-=.5")
        .to(mounts, { x: 0, duration: 0.8, stagger: 0.09, ease: "power3.out" }, "<")
        .to(screws, { opacity: 1, duration: 0.3, stagger: 0.09 }, "-=.55")
        .to(
          leds,
          {
            opacity: 1,
            duration: 0.25,
            stagger: 0.09,
            onStart() {
              leds.forEach((l, i) => gsap.delayedCall(i * 0.09, () => l.classList.add("lit")));
            },
          },
          "-=.6"
        )
        // opacity intentionally omitted — applyCamera() already drives it
        // from scroll progress starting at frame one; a competing tween
        // here would fight it and can leave cue stuck visible if the user
        // scrolls to dock while this timeline is still running.
        .to("#cue", { y: 0, duration: 0.5 }, "-=.2");
    }

    // Runs once per browser, and never on a deep-linked landing (it would
    // force-seat the drive that link was pointing at and reset scroll).
    if (!reduced && deepLinkIndex === -1 && !localStorage.getItem(TOUR_STORAGE_KEY)) {
      gsap.delayedCall(3.4, () => {
        // If a drive is mid-animation (busy), seat()'s own busy-guard
        // silently no-ops startTour()'s attempt to close it — the pull
        // finishes on its own while the tour ALSO takes over, leaving both
        // open at once. A user who's already clicked something within the
        // first 3.4s has found their way in without help; don't fight them
        // for control, and don't reappear the moment they're done either.
        if (open !== null || busy) {
          localStorage.setItem(TOUR_STORAGE_KEY, "1");
          return;
        }
        startTour();
      });
    }

    return () => {
      removeEventListener("resize", onResize);
      removeEventListener("wheel", killScroll);
      removeEventListener("touchmove", killScroll);
      document.removeEventListener("keydown", onKeydown);
      stick.removeEventListener("click", onStickClick);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
      drives.forEach((d, i) => d.removeEventListener("click", driveClickHandlers[i]));
      tnext.removeEventListener("click", onTourNext);
      tskip.removeEventListener("click", endTour);
      helpbtn.removeEventListener("click", onHelpClick);
      if (spin !== null) cancelAnimationFrame(spin);
      if (typer !== null) clearInterval(typer);
      if (track !== null) cancelAnimationFrame(track);
      st.kill();
      gsap.killTweensOf(rail.querySelectorAll("*"));
      gsap.killTweensOf(rail);
      plane.innerHTML = "";
      bp.innerHTML = "";
      panel.innerHTML = "";
      tfield.innerHTML = "";
    };
  }, []);

  return (
    <div className="carrier-page">
      <PcbBackground />
      <a className="skip-link" href="#after-rail">
        Skip to projects
      </a>
      <div aria-live="polite" className="sr-only" ref={liveRef} />
      <div id="rail" ref={railRef}>
        <div id="stick" ref={stickRef}>
          <div className="stage" ref={stageRef}>
            <div className="plane" ref={planeRef}>
              <div className="backplane" ref={bpRef} />
              {DRIVES.map((d, i) => {
                const y = G.top + i * (G.bayH + G.gap);
                return (
                  <Fragment key={d.bay}>
                    <div className="bay" style={{ top: y }}>
                      <span className="fixtures">
                        <span className="mark silk">
                          2242·2260·2280 M.2 M-KEY {d.bay}
                        </span>
                        <span className="sock" />
                        <span className="alt" style={{ left: 150 }} />
                        <span className="alt" style={{ left: 230 }} />
                        <span className="stand" />
                      </span>
                      <div className="mount" data-mount>
                        <button className="drive" type="button" data-drive aria-label={`${d.name} — open details`}>
                          <span className="pads" />
                          <span className="key" />
                          <span className="notch" />
                          <span className="nand" style={{ left: 134 }} />
                          <span className="nand" style={{ left: 218 }} />
                          <span className="ctrl" />
                          <span className="sticker">
                            <h3>{d.name}</h3>
                            <span>{d.meta}</span>
                            <em>{d.part}</em>
                          </span>
                        </button>
                      </div>
                      <span className="screwhead" data-screw />
                    </div>
                    <span className="act lit" style={{ left: 14, top: y + G.bayH / 2 - 5 }} />
                    <span className="mark" style={{ left: 11, top: y + G.bayH / 2 + 7 }}>
                      D{i + 1}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="hero" ref={heroRef}>
            <div className="eyebrow js-in">
              <span className="led" />
              <span className="slabel">Computer engineering · UIUC · 2027</span>
            </div>
            <h1>
              <span className="mask-line">
                <span>Anirudh</span>
              </span>
              <span className="mask-line">
                <span className="thin">distributed</span>
              </span>
              <span className="mask-line">
                <span className="thin">systems</span>
              </span>
            </h1>
            <p className="tagline js-in">
              Stream processors, fault-tolerant storage, and agent infrastructure that survives contact with
              production. Currently <b>AI &amp; data engineering at Zebra Technologies</b>.
            </p>
            <div className="fastpath js-in">
              <span className="slabel">
                B.S. Computer Engineering, UIUC · 2027 — targeting SWE / FDSE roles
              </span>
              <a className="fastpath__resume" href="/resume.pdf" target="_blank" rel="noopener">
                Résumé (PDF) →
              </a>
            </div>
          </div>

          <div className="cue js-in" id="cue" ref={cueRef}>
            <span className="dot" />
            <span className="slabel">Drag to turn the board · scroll to dock it</span>
          </div>

          <div className="side-label side-label--left" ref={projectsLabelRef}>
            <span className="slabel">Projects</span>
          </div>

          <div className="experience-panel" ref={experienceRef}>
            <span className="slabel experience-panel__kick">Experience — Zebra Technologies</span>
            <ul className="experience-panel__list">
              <li>
                <span className="slabel">2026</span>
                <p>SWE Intern, AI &amp; Data Engineering</p>
              </li>
              <li>
                <span className="slabel">2025</span>
                <p>SWE Intern, Cloud &amp; Computing</p>
              </li>
            </ul>
          </div>

          <div className="tfield" ref={tfieldRef} />
          <div className="panel" ref={panelRef} />
        </div>
      </div>

      <div className="tut" ref={tutRef} aria-live="polite">
        <div className="spot">
          <b />
          <b />
          <b />
          <b />
        </div>
        <div className="blk" data-blk="t" />
        <div className="blk" data-blk="r" />
        <div className="blk" data-blk="b" />
        <div className="blk" data-blk="l" />
        <div className="tutcard">
          <div className="bar">
            <em style={{ fontStyle: "normal" }}>SYS / WALKTHROUGH</em>
            <span>
              STEP <b className="tstep">1</b> / <b className="ttotal">7</b>
            </span>
          </div>
          <div className="scr">
            <span className="pfx">&gt;</span>
            <span className="ttext" />
            <span className="car" />
          </div>
          <div className="tutwait" hidden>
            <i />
            <span className="twaitmsg" />
          </div>
          <div className="tact">
            <button className="tnext pri" type="button">
              Next
            </button>
            <button className="tskip" type="button">
              Skip
            </button>
          </div>
        </div>
      </div>
      <button className="helpbtn" ref={helpRef} type="button" aria-label="Replay the board walkthrough">
        ?
      </button>

      <div className="after" id="after-rail" tabIndex={-1}>
        <SiteFooter />
      </div>
    </div>
  );
}
