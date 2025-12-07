import { useEffect, useRef, useState } from "react";

/**
 * Hook to manage step highlight animation.
 * Returns true briefly when the step becomes active.
 */
export function useStepHighlight(isActive: boolean): boolean {
  const [showHighlight, setShowHighlight] = useState(false);
  const wasActive = useRef(isActive);

  useEffect(() => {
    if (isActive && !wasActive.current) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 500);
      return () => clearTimeout(timer);
    }
    wasActive.current = isActive;
  }, [isActive]);

  return showHighlight;
}
