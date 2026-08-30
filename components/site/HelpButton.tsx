import type { useOnboardingTour } from "@/components/tour/useOnboardingTour";

export interface HelpButtonProps {
  tour: ReturnType<typeof useOnboardingTour>;
}

/* Persistent replay trigger — unlike the auto-start effect, this always
 * works, seen-flag or not. Toggles: if the tour is already running,
 * clicking it ends the tour early (same as Skip) rather than restarting
 * from step 0, so it can't get stuck open on repeated clicks. */
export function HelpButton({ tour }: HelpButtonProps) {
  const onClick = () => (tour.on ? tour.end() : tour.start());
  return (
    <button className="helpbtn" type="button" onClick={onClick} aria-label="Replay the guided tour">
      ?
    </button>
  );
}
