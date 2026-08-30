import type { KeyboardEvent } from "react";
import { DOCS, type DriveDoc } from "@/lib/docs-data";
import type { useCarrierMachine } from "./useCarrierMachine";
import "./machine.css";

/* Shared drive-face markup — the notch, controller, NAND packages and
 * label every M.2 drive shows, whether it's sitting in a tray pocket,
 * mid-flight, or seated in the board's slot. `withScrew` only renders true
 * once a drive is actually seated (the screw appears when the drive is
 * home, not before), which is why it's a prop rather than baked in. */
export function DriveFace({ doc, withScrew = false }: { doc: DriveDoc; withScrew?: boolean }) {
  return (
    <>
      <span className="notch" />
      {withScrew && <span className="screw" />}
      <span className="ctrl" />
      <span className="nand n1" />
      <span className="nand n2" />
      <span className="lab">
        <b>{doc.name}</b>
        <span className="meta">
          <i>{doc.tag}</i>
          <em>{doc.part}</em>
        </span>
      </span>
      <span className="pads" />
      <span className="key" />
    </>
  );
}

/* Drives are grouped into banks, the way a backplane is divided into
 * labelled slot groups, so the tray reads as an organised chassis instead
 * of an undifferentiated row. Pockets stay in DOCS order inside their
 * banks, which is what keeps the tray's chip index aligned with DOCS —
 * useCarrierMachine (section E) addresses drives by that index. */
function buildBanks(docs: DriveDoc[]) {
  const banks: { bank: string; docs: DriveDoc[] }[] = [];
  for (const d of docs) {
    const last = banks[banks.length - 1];
    if (last && last.bank === d.bank) last.docs.push(d);
    else banks.push({ bank: d.bank, docs: [d] });
  }
  return banks;
}

export interface TrayProps {
  machine: ReturnType<typeof useCarrierMachine>;
}

/* Arrow keys walk the tray one chip at a time, wrapping around — the
 * same behavior as Tab, but without leaving the rail. */
function onRailKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  const rail = e.currentTarget;
  const chips = [...rail.querySelectorAll<HTMLElement>(".chip")];
  const i = chips.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : chips.length - 1)) % chips.length;
    chips[n].focus();
    chips[n].scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

export function Tray({ machine }: TrayProps) {
  const banks = buildBanks(DOCS);
  let i = 0;
  return (
    <div className="tray">
      <div className="trayhead">
        <span className="t" id="trayTitle">
          Drives
        </span>
        <span className="ln" />
        <span className="hint" id="hint">
          Select one to load
        </span>
      </div>
      {/* The source's #rail carries role="list" directly over .bank/
       * .bank-row wrapper divs, with .pocket (role="listitem") several
       * levels of plain <div> below it. Per the ARIA list/listitem
       * relationship, an owned role needs to resolve through the
       * accessibility tree without an unrelated role breaking the chain —
       * a bare div is pruned from that tree, but two of them stacked is
       * enough for some browsers to stop treating the pockets as list
       * items at all. Fixed here rather than carried over: each bank is a
       * labelled group (role="group", named from the same string
       * .bank-tab already shows visually), and each bank-row is its own
       * list of drives — so role="list"/"listitem" is never separated by
       * more than the labelled group in between. */}
      <div className="rail" id="rail" aria-labelledby="trayTitle" onKeyDown={onRailKeyDown}>
        {banks.map((b) => (
          <div className="bank" key={b.bank} role="group" aria-label={b.bank}>
            <span className="bank-tab" aria-hidden="true">
              {b.bank}
            </span>
            <div className="bank-row" role="list">
              {b.docs.map((d) => {
                const idx = i++;
                return (
                  <div className="pocket" role="listitem" data-label="In use" key={d.id}>
                    <button
                      className="chip m2"
                      type="button"
                      data-i={idx}
                      aria-current="false"
                      aria-label={`Load ${d.name}`}
                      onClick={() => machine.onChipClick(idx)}
                    >
                      <DriveFace doc={d} />
                    </button>
                    <span className="spine" aria-hidden="true">
                      <span className="sn">{d.name}</span>
                      <span className="sp">{d.part}</span>
                      <span className="sb" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
