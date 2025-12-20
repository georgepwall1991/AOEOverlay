import { CompactTimer, FullTimer } from "./timer";

interface TimerBarProps {
  compact?: boolean;
  targetTiming?: string;
}

export function TimerBar({ compact = false, targetTiming }: TimerBarProps) {
  if (compact) {
    return <CompactTimer targetTiming={targetTiming} />;
  }
  return <FullTimer targetTiming={targetTiming} />;
}
