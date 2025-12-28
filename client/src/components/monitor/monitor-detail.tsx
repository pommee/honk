import { useState } from "react";
import { Monitor } from "@/types";
import { toast } from "sonner";
import { DeleteRequest } from "@/util";
import { MonitorHeader } from "./monitor-header";
import { MonitorStats } from "./monitor-stats";
import { MonitorChecksChart } from "./monitor-checks-chart";
import { DeleteMonitorDialog } from "./delete-monitor-dialog";
import { Button } from "../ui/button";
import { ActivityIcon, PlusCircleIcon } from "@phosphor-icons/react";

interface Props {
  monitor: Monitor | null;
  hasMonitors: boolean;
  onRunNow?: (id: number) => void;
  onDeleted?: (id: number) => void;
  onUpdated?: (id: number) => void;
  onEdit?: () => void;
  onCreateNew?: () => void;
}

export function MonitorDetail({
  monitor,
  hasMonitors,
  onRunNow,
  onDeleted,
  onEdit,
  onCreateNew
}: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!monitor) return;
    setIsDeleting(true);
    try {
      const [code, response] = await DeleteRequest(
        `monitor/${monitor.id}`,
        null
      );
      if (code !== 200) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete monitor");
      }
      toast.success(`Monitor "${monitor.name}" deleted successfully`);
      onDeleted?.(monitor.id);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to delete monitor");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!monitor) {
    return <EmptyState hasMonitors={hasMonitors} onCreateNew={onCreateNew} />;
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-4 max-w-4/5 mx-auto space-y-4">
        <MonitorHeader
          monitor={monitor}
          onRun={() => onRunNow?.(monitor.id)}
          onEdit={onEdit}
          onDelete={() => setIsDeleteModalOpen(true)}
        />

        <MonitorStats monitor={monitor} />
        <MonitorChecksChart checks={monitor.checks} />

        <DeleteMonitorDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          monitor={monitor}
          isDeleting={isDeleting}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
}

interface EmptyStateProps {
  hasMonitors: boolean;
  onCreateNew?: () => void;
}

function EmptyState({ hasMonitors, onCreateNew }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center space-y-6">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-lg ${
              !hasMonitors ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <ActivityIcon
              className={`h-7 w-7 ${
                !hasMonitors ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {!hasMonitors ? "No monitors yet" : "Select a monitor"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {!hasMonitors
                ? "Create your first monitor to start tracking services."
                : "Choose a monitor from the sidebar to view details."}
            </p>
          </div>

          {!hasMonitors && onCreateNew && (
            <Button variant={"link"} onClick={onCreateNew}>
              <PlusCircleIcon size={16} />
              Create first monitor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
