import { useState, useEffect, useRef } from "react";
import { useOverlayStore } from "@/stores";
import { cn } from "@/lib/utils";

interface AnimatedOverlayProps {
  children: React.ReactNode;
}

export function AnimatedOverlay({ children }: AnimatedOverlayProps) {
  const { isVisible, setAnimating } = useOverlayStore();
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState<string>("");
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setShouldRender(isVisible);
      if (isVisible) {
        setAnimationClass("overlay-enter");
      }
      return;
    }

    if (isVisible) {
      // Show animation
      setShouldRender(true);
      setAnimating(true);
      setAnimationClass("overlay-enter");

      const timer = setTimeout(() => {
        setAnimating(false);
      }, 250);

      return () => clearTimeout(timer);
    } else {
      // Hide animation
      setAnimating(true);
      setAnimationClass("overlay-exit");

      const timer = setTimeout(() => {
        setShouldRender(false);
        setAnimating(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isVisible, setAnimating]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={cn("w-full h-full", animationClass)}>
      {children}
    </div>
  );
}
