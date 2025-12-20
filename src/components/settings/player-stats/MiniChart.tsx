import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: number[];
  color?: "primary" | "green" | "red";
}

export function MiniChart({ data, color = "primary" }: MiniChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const colorClass =
    color === "green"
      ? "stroke-green-500"
      : color === "red"
        ? "stroke-red-500"
        : "stroke-primary";

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        className={cn(colorClass, "stroke-[1.5]")}
        points={points}
      />
    </svg>
  );
}
