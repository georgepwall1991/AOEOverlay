import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemClockProps {
    className?: string;
    showIcon?: boolean;
}

export function SystemClock({ className, showIcon = true }: SystemClockProps) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={cn("flex items-center gap-1 font-mono text-white/50 tabular-nums", className)}>
            {showIcon && <Clock className="w-3 h-3" />}
            <span className="text-[10px]">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
}
