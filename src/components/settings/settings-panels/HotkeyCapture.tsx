import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotkeyCaptureProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function HotkeyCapture({ value, onChange, className }: HotkeyCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCapturing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore modifier-only presses
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;

      const parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      
      // Map key to canonical names
      let key = e.key.toUpperCase();
      if (key === " ") key = "SPACE";
      if (key === "ESCAPE") key = "ESC";
      if (key === "CONTROL") return; // redundant
      if (key === "ALT") return; // redundant
      if (key === "SHIFT") return; // redundant

      const newValue = parts.length > 0 ? `${parts.join("+")}+${key}` : key;
      onChange(newValue);
      setIsCapturing(false);
    };

    const handleMouseDownOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsCapturing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handleMouseDownOutside, true);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMouseDownOutside, true);
    };
  }, [isCapturing, onChange]);

  return (
    <Button
      ref={buttonRef}
      variant={isCapturing ? "default" : "outline"}
      size="sm"
      className={cn(
        "min-w-24 font-mono text-xs h-8",
        isCapturing && "animate-pulse ring-2 ring-primary",
        className
      )}
      onClick={() => setIsCapturing(!isCapturing)}
    >
      <Keyboard className="w-3.5 h-3.5 mr-2 opacity-50" />
      {isCapturing ? "Recording..." : value || "None"}
    </Button>
  );
}
