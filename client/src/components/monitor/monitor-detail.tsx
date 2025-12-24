import { useState, useEffect } from "react";
import { Monitor, MonitorForm } from "@/types";
import { toast } from "sonner";
import { DeleteRequest, PutRequest } from "@/util";
import { MonitorHeader } from "./monitor-header";
import { MonitorStats } from "./monitor-stats";
import { MonitorTarget } from "./monitor-target";
import { MonitorChecksChart } from "./monitor-checks-chart";
import { DeleteMonitorDialog } from "./delete-monitor-dialog";
import { EditMonitorDialog } from "./edit-monitor-dialog";
import { Button } from "../ui/button";
import { ActivityIcon, PlusCircleIcon } from "@phosphor-icons/react";

interface Props {
  monitor: Monitor | null;
  hasMonitors: boolean;
  onDeleted?: (id: number) => void;
  onUpdated?: (id: number) => void;
  onCreateNew?: () => void;
}

export function MonitorDetail({
  monitor,
  hasMonitors,
  onDeleted,
  onUpdated,
  onCreateNew
}: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [form, setForm] = useState<MonitorForm>({
    id: monitor?.id,
    enabled: monitor?.enabled ?? false,
    name: monitor?.name ?? "",
    connection: monitor?.connection ?? "",
    connectionType:
      (monitor?.connectionType as "http" | "ping" | "container" | "tcp") ??
      "http",
    interval: monitor?.interval ?? 60,
    alwaysSave: monitor?.alwaysSave ?? false,
    notification: monitor?.notification
      ? {
          enabled: monitor.notification.enabled,
          webhook: monitor.notification.webhook
        }
      : undefined
  });

  useEffect(() => {
    if (!monitor || isEditModalOpen) return;
    setForm({
      id: monitor.id,
      enabled: monitor.enabled,
      name: monitor.name,
      connection: monitor.connection,
      connectionType: monitor.connectionType,
      interval: monitor.interval,
      alwaysSave: monitor.alwaysSave,
      notification: monitor.notification
    });
  }, [monitor, isEditModalOpen]);

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

  const handleUpdate = async () => {
    if (!monitor) return;
    setIsUpdating(true);
    try {
      const [code, response] = await PutRequest(`monitor/${monitor.id}`, {
        ...form
      });
      if (code !== 200) {
        const text = await response.error;
        throw new Error(text || "Failed to update monitor");
      }
      toast.success("Monitor updated successfully");
      setIsEditModalOpen(false);
      onUpdated?.(monitor.id);
    } catch (err) {
      toast.error(err.message || "Failed to update monitor");
    } finally {
      setIsUpdating(false);
    }
  };

  const copyTarget = () => {
    if (monitor?.connection) {
      navigator.clipboard.writeText(monitor.connection);
      toast.success("Target URL copied to clipboard");
    }
  };

  if (!monitor) {
    return <EmptyState hasMonitors={hasMonitors} onCreateNew={onCreateNew} />;
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <MonitorHeader
          monitor={monitor}
          onEdit={() => setIsEditModalOpen(true)}
          onDelete={() => setIsDeleteModalOpen(true)}
        />

        {/* Stats Grid */}
        <MonitorStats monitor={monitor} />

        {/* Target URL */}
        <MonitorTarget monitor={monitor} onCopy={copyTarget} />

        {/* Recent Checks Chart */}
        <MonitorChecksChart checks={monitor.checks} />

        {/* Dialogs */}
        <DeleteMonitorDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          monitor={monitor}
          isDeleting={isDeleting}
          onDelete={handleDelete}
        />

        <EditMonitorDialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          form={form}
          onFormChange={setForm}
          isUpdating={isUpdating}
          onSave={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
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
