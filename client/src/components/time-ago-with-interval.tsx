import { useEffect, useState } from "react";

interface TimeAgoWithIntervalProps {
  date: string | Date;
  interval: number; // in seconds
}

export function TimeAgoWithInterval({
  date,
  interval
}: TimeAgoWithIntervalProps) {
  const [startTime, setStartTime] = useState(new Date(date).getTime());
  const [timeAgo, setTimeAgo] = useState<string>("0s ago");

  useEffect(() => {
    const intervalMs = interval * 1000;

    const tick = () => {
      const now = Date.now();
      let diff = now - startTime;

      if (diff >= intervalMs) {
        setStartTime(now);
        diff = 0;
      }

      if (diff < 1000) setTimeAgo("0s ago");
      else if (diff < 60_000) setTimeAgo(`${Math.floor(diff / 1000)}s ago`);
      else if (diff < 3600_000) setTimeAgo(`${Math.floor(diff / 60000)}m ago`);
      else setTimeAgo(`${Math.floor(diff / 3600000)}h ago`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, interval]);

  return <span>{timeAgo}</span>;
}
