"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Code-split both ways: mobile never pulls in gsap/ScrollTrigger and the
// desktop 3D engine, desktop never pulls in the mobile-only bundle.
const CarrierDesktop = dynamic(() => import("./CarrierDesktop").then((m) => m.CarrierDesktop));
const CarrierMobile = dynamic(() => import("./CarrierMobile").then((m) => m.CarrierMobile), { ssr: false });

const MOBILE_QUERY = "(max-width: 700px)";

export function Carrier() {
  // Defaults to desktop so server and first client render agree (no
  // hydration mismatch) — a JS-enabled phone swaps to the mobile layout
  // right after mount; a no-JS visitor gets the desktop markup either way,
  // which still renders real content per the SSR pass.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = matchMedia(MOBILE_QUERY);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile ? <CarrierMobile /> : <CarrierDesktop />;
}
