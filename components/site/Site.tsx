"use client";

import { PcbCanvas } from "@/components/pcb/PcbCanvas";
import { Machine } from "@/components/machine/Machine";
import { DocsFallback } from "@/components/docs/DocsFallback";
import { OnboardingTour } from "@/components/tour/OnboardingTour";
import { useOnboardingTour } from "@/components/tour/useOnboardingTour";
import { NavBar } from "./NavBar";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { SkillsSection } from "./SkillsSection";
import { ContactSection } from "./ContactSection";
import { SiteFooter } from "./SiteFooter";
import { HelpButton } from "./HelpButton";
import "./site.css";
import "./after.css";

/* Dress rehearsal for the full site: everything that will eventually
 * replace <Carrier/> in app/page.tsx, assembled and wired to itself, but
 * not yet referenced by page.tsx — the cutover is its own commit so a
 * regression in composition is bisectable from a regression in the swap
 * itself.
 *
 * The interactive Machine and the plain-document DocsFallback both
 * render unconditionally; site.css's media query (plus the `js` class
 * useCarrierMachine's mount effect adds to <body>) decides which one is
 * actually visible for a given viewport and JS state — the same
 * body.js rules the source prototype itself uses. There's no
 * matchMedia/next-dynamic branch in React for this at all; retiring that
 * branch in favor of one CSS media query is the whole point of this
 * redesign's "one responsive layout" architecture.
 *
 * Machine takes the tour's signal() function as a prop rather than
 * constructing its own useCarrierMachine() differently depending on
 * whether a tour exists — every earlier section built and verified
 * Machine standalone with no tour at all, and this keeps that working
 * unchanged for any other caller. */
export function Site() {
  const tour = useOnboardingTour();

  return (
    <>
      <PcbCanvas />
      <NavBar />
      <Machine tourSignal={tour.signal} />
      <DocsFallback />
      <main className="after">
        <ExperienceSection />
        <EducationSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <OnboardingTour tour={tour} />
      <HelpButton tour={tour} />
    </>
  );
}
