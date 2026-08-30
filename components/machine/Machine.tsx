import { Cables } from "./Cables";
import { Monitor } from "./Monitor";
import { CarrierBoard } from "./CarrierBoard";
import { Tray } from "./Tray";
import { FlightLayer } from "./FlightLayer";
import "./machine.css";

/* Static composition of the interactive machine: cables behind, monitor
 * and carrier board side by side in .top, the drive tray below, and the
 * flight layer for in-transit drives on top of everything. `hidden` here
 * matches the source prototype's boot sequence — the stage starts hidden
 * and only reveals itself once JS confirms it can actually drive the
 * machine, which is exactly what useCarrierMachine's mount effect
 * (section E) will flip off. Not referenced by app/page.tsx yet; that
 * happens at the cutover commit in section H. */
export function Machine() {
  return (
    <>
      <div className="stage" id="stage" hidden>
        <div className="top">
          <Cables />
          <Monitor />
          <CarrierBoard />
        </div>
        <Tray />
      </div>
      <FlightLayer />
    </>
  );
}
