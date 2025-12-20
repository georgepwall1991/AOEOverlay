import { useEffect, useRef } from "react";

/**
 * Hook that manages a setInterval with proper cleanup.
 *
 * @param callback - Function to call on each interval tick
 * @param delay - Interval delay in milliseconds, or null to pause
 *
 * The callback is stored in a ref, so it's always up-to-date without
 * requiring interval reset on callback changes. Passing null as delay
 * pauses the interval without losing state.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = window.setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
