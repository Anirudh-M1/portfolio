"use client";

import { Fragment, useEffect } from "react";
import { DRIVES, slugify } from "@/lib/carrier-data";
import { SiteFooter } from "./SiteFooter";
import { PcbBackground } from "./PcbBackground";
import "./carrier-mobile.css";

// Below ~700px the 3D board is too small to read, X-axis drag is gone
// (touch-action: pan-y reserves the axis for scrolling), and the pull/panel
// interaction has no room to breathe. Rather than cram the desktop
// experience into a phone screen, this is a genuinely separate layout:
// a flat, static card list. No GSAP, no ScrollTrigger, nothing 3D.
export function CarrierMobile() {
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: "start" });
    }
  }, []);

  return (
    <div className="carrier-page carrier-mobile">
      <PcbBackground />
      <div className="m-hero">
        <div className="eyebrow">
          <span className="led" />
          <span className="slabel">Computer engineering · UIUC · 2027</span>
        </div>
        <h1>
          Anirudh
          <br />
          <span className="thin">distributed</span>
          <br />
          <span className="thin">systems</span>
        </h1>
        <p className="tagline">
          Stream processors, fault-tolerant storage, and agent infrastructure that survives contact with
          production. Currently <b>AI &amp; data engineering at Zebra Technologies</b>.
        </p>
        <div className="fastpath">
          <span className="slabel">B.S. Computer Engineering, UIUC · 2027 — targeting SWE / FDSE roles</span>
          <span className="fastpath__headline">
            <b>Zebra Technologies</b> · SWE Intern, AI &amp; Data Engineering (2026) and Cloud &amp; Computing
            (2025)
          </span>
          <a className="fastpath__resume" href="/resume.pdf" target="_blank" rel="noopener">
            Résumé (PDF) →
          </a>
        </div>
      </div>

      <ul className="m-list">
        {DRIVES.map((d) => (
          <li key={d.bay} className="m-card">
            <details id={slugify(d.name)}>
              <summary>
                <span className="m-card__led" />
                <span className="m-card__title">
                  <h2>{d.name}</h2>
                  <span className="m-card__meta">{d.meta}</span>
                </span>
                <span className="m-card__chev" aria-hidden="true" />
              </summary>
              <div className="m-card__body">
                <p className="kick">{d.kick}</p>
                <div className="stackrow">
                  {d.stack.map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
                <dl>
                  {d.specs.map(([term, def]) => (
                    <Fragment key={term}>
                      <dt>{term}</dt>
                      <dd>{def}</dd>
                    </Fragment>
                  ))}
                </dl>
                {d.links.length > 0 && (
                  <div className="linkrow">
                    {d.links.map(([label, url]) => (
                      <a className="plink" key={label} href={url} target="_blank" rel="noopener">
                        {label} →
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>

      <div className="after">
        <SiteFooter />
      </div>
    </div>
  );
}
