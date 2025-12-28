import { Button } from "@/components/ui/button";
import { TimeAgoWithInterval } from "../ui/time-ago-with-interval";
import { Monitor } from "@/types";
import TimeAgo from "react-timeago";

interface MonitorHeaderProps {
  monitor: Monitor;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getAverageResponseTime = (monitor: Monitor): number | null => {
  const checks = monitor.checks;
  if (!checks || checks.length === 0) return null;

  const total = checks.reduce((sum, c) => sum + c.responseTimeMs, 0);

  return total / checks.length;
};

export function MonitorHeader({
  monitor,
  onRun,
  onEdit,
  onDelete
}: MonitorHeaderProps) {
  return (
    <div
      className={`relative bg-background rounded-2xl shadow-sm border-2 p-5 ${
        monitor.enabled ? "border-green-500" : "border-red-500"
      }`}
    >
      <legend
        className={`absolute -top-3 left-6 bg-background px-2 text-sm font-medium ${
          monitor.enabled ? "text-green-500" : "text-red-500"
        }`}
      >
        {monitor.enabled ? "Enabled" : "Disabled"}
      </legend>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {monitor.name || monitor.connection}
          </h1>

          <div className="mt-2 flex items-center gap-1">
            <span className="text-muted-foreground text-sm">Last checked:</span>
            <span className="text-sm">
              {monitor.enabled ? (
                <TimeAgoWithInterval
                  date={monitor.checked}
                  interval={monitor.interval}
                />
              ) : (
                <TimeAgo date={monitor.checked} />
              )}
            </span>
          </div>
          <div className="flex gap-1">
            <p className="text-muted-foreground text-sm">Average response:</p>
            <p className="text-sm">
              {getAverageResponseTime(monitor)?.toFixed(2)}ms
            </p>
          </div>

          <div className="flex gap-1">
            <p className="text-muted-foreground text-sm">Target:</p>
            <a
              href={monitor.connection}
              target="#"
              className="flex-1 text-blue-400 underline text-sm font-mono"
            >
              {monitor.connection}
            </a>
          </div>
        </div>

        <div className="flex gap-3">
          <Button size="lg" variant={"default"} onClick={onRun}>
            Run now
          </Button>
          <Button size="lg" variant="outline" onClick={onEdit}>
            Edit Monitor
          </Button>
          <Button size="lg" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
