import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/lib/monitor-ui";
import { TimeAgoWithInterval } from "../time-ago-with-interval";
import { Monitor } from "@/types";
import TimeAgo from "react-timeago";

interface MonitorHeaderProps {
  monitor: Monitor;
  onEdit: () => void;
  onDelete: () => void;
}

export function MonitorHeader({
  monitor,
  onEdit,
  onDelete
}: MonitorHeaderProps) {
  return (
    <div
      className={`relative bg-background rounded-2xl shadow-sm border-2 p-8 mb-8 ${
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {monitor.name || monitor.connection}
          </h1>
          <div className="mt-4 flex items-center gap-6">
            <StatusBadge healthy={monitor.healthy} />
            <span className="text-muted-foreground text-lg">
              Last checked:{" "}
              {monitor.enabled ? (
                <TimeAgoWithInterval
                  date={monitor.checked}
                  interval={monitor.interval}
                />
              ) : (
                <span className="text-muted-foreground">
                  <TimeAgo date={monitor.checked} />
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
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
