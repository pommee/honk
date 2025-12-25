import { Button } from "@/components/ui/button";
import { TimeAgoWithInterval } from "@/components/ui/time-ago-with-interval";
import { StatusBadge, connectionTypeIcon } from "@/lib/monitor-ui";
import { Monitor } from "@/types";
import TimeAgo from "react-timeago";
import { PlusIcon } from "@phosphor-icons/react";

interface Props {
  monitors: Monitor[];
  selected?: Monitor | null;
  onSelect: (m: Monitor) => void;
  onAdd: () => void;
}

export const MonitorSidebar = ({
  monitors,
  selected,
  onSelect,
  onAdd
}: Props) => (
  <aside className="w-xs border-r flex flex-col">
    <div className="border-b p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Monitors</h2>
        <Button size="sm" onClick={onAdd}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {monitors.length} active
      </p>
    </div>

    <div className="flex-1 overflow-y-auto">
      {monitors.map((m) => (
        <button
          key={m.id}
          onClick={() => {
            // Correct monitor clicked here
            console.log(m);
            onSelect(m);
          }}
          className={`w-full border p-2 text-left hover:border-primary transition-colors cursor-pointer ${
            selected?.id === m.id ? "border-primary" : ""
          }`}
        >
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="py-1.5">
                {connectionTypeIcon(m.connectionType)}
              </div>
              <div>
                <p className="font-medium">{m.name || m.connection}</p>
                <p className="truncate text-sm text-muted-foreground max-w-48">
                  {m.connection}
                </p>
              </div>
            </div>
            <StatusBadge healthy={m.healthy} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Uptime: {((m.successfulChecks / m.totalChecks) * 100).toFixed(2)}%
            </span>
            <span>•</span>
            {m.enabled ? (
              <TimeAgoWithInterval date={m.checked} interval={m.interval} />
            ) : (
              <TimeAgo date={m.checked} />
            )}
          </div>
        </button>
      ))}
    </div>
  </aside>
);
