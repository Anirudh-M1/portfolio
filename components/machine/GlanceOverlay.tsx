"use client";

import { useEffect, useRef } from "react";
import { DOCS } from "@/lib/docs-data";
import { DriveViz } from "@/components/docs/DriveViz";
import "./glance.css";

export interface GlanceOverlayProps {
  onClose: () => void;
  /** Index into DOCS of the drive to load when a card is picked. */
  onPick: (i: number) => void;
}

/* Every project's visual on one screen, for a visitor who wants the
 * overview without inserting drives one at a time (a full swap takes
 * ~5s before the doc even lands). Only mounted while open, so the twelve
 * panels cost nothing until asked for; each one still plays on scroll
 * into view via DriveViz's own IntersectionObserver, which works inside
 * this scrolling overlay just as it does in the page. README has no
 * panel, so it's left out. */
export function GlanceOverlay({ onClose, onPick }: GlanceOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="glance"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glanceTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glance-in">
        <header className="glance-head">
          <h2 id="glanceTitle">All projects at a glance</h2>
          <span className="ln" />
          <button ref={closeRef} className="glance-x" type="button" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </header>
        <div className="glance-grid">
          {DOCS.map((d, i) =>
            d.kind === "project" ? (
              <article
                className="glance-card"
                key={d.id}
                onClick={(e) => {
                  // the panel's own replay button replays, it doesn't load
                  if (!(e.target as HTMLElement).closest(".replay")) onPick(i);
                }}
              >
                <button className="glance-open" type="button">
                  <span className="glance-kick">{d.kick}</span>
                  <span className="glance-name">
                    {d.heading} <span aria-hidden="true">→</span>
                  </span>
                </button>
                <DriveViz id={d.id} key={d.id} />
              </article>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
