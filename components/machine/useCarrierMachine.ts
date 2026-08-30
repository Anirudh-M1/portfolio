"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOCS, type DriveDoc } from "@/lib/docs-data";

/* useCarrierMachine is the React home for the source prototype's big IIFE.
 * Most of it stays exactly as imperative as the source — direct
 * getElementById DOM writes driven from refs/effects rather than React
 * state — because the static markup built in section D already carries
 * every id and class the original script queried for For instance
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

function setHash(h: string) {
  try {
    if (history.replaceState) history.replaceState(null, "", h);
  } catch {
    /* file:// — deep links just won't update */
  }
}

export function useCarrierMachine() {
  const crtRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<ScreenState>({ kind: "idle" });
  const [loadedIndex, setLoadedIndex] = useState<number | null>(null);
  // Starts false so .stage renders `hidden` for the very first paint (and
  // for a visitor whose JS never runs at all) — flipped true once the
  // mount effect below has actually booted a drive into the machine, the
  // same "reveal only once it's real" behavior the source's own
  // `stage.hidden = false` line has.
  const [ready, setReady] = useState(false);

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
   * the board finishes laying back down (once there's a board to lay
   * down — the insert() timeline lands in the next commit). */
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

  /* Boot-on-mount: mirrors the source's own start() — the initial drive
   * (from the URL hash, or README) is already "in the machine" the
   * instant the stage reveals itself, so the screen is never dark. No
   * flight animation plays for this one; insert()'s flight (next commit)
   * is only for drives loaded after the machine is already live. */
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

    return () => {
      clearTimers();
      if (ledTimerRef.current !== null) clearTimeout(ledTimerRef.current);
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

  return { screen, loadedIndex, ready, crtRef, onCrtClick, idle, land, mountState, ledOff };
}
