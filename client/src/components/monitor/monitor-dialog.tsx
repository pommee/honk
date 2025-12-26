import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MonitorForm } from "@/types";
import { ContainerConfig } from "./monitors/ContainerMonitor";
import { HttpConfig } from "./monitors/HttpMonitor";
import { PingConfig } from "./monitors/PingMonitor";
import { TcpConfig } from "./monitors/TcpMonitor";

interface MonitorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: MonitorForm;
  onFormChange: (
    updater: ((prev: MonitorForm) => MonitorForm) | MonitorForm
  ) => void;
  isSubmitting: boolean;
  onSave: () => void;
  onCancel: () => void;
  mode?: "create" | "edit";
}

export function MonitorFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  isSubmitting,
  onSave,
  onCancel,
  mode = "edit"
}: MonitorFormDialogProps) {
  const isCreateMode = mode === "create";

  const getPlaceholder = () => {
    switch (form.connectionType) {
      case "http":
        return "https://example.com";
      case "tcp":
        return "example.com:443";
      case "ping":
        return "example.com or 8.8.8.8";
      case "container":
        return "container-name or container-id";
      default:
        return "";
    }
  };

  const notification = form.notification || { enabled: false };
  const headers = form.headers || [];

  const handleFormChange = (
    updater: ((prev: MonitorForm) => MonitorForm) | MonitorForm
  ) => {
    if (typeof updater === "function") {
      onFormChange(updater);
    } else {
      onFormChange(updater);
    }
  };

  const addHeader = () => {
    handleFormChange((prev) => ({
      ...prev,
      headers: [...(prev.headers || []), { key: "", value: "" }]
    }));
  };

  const removeHeader = (index: number) => {
    handleFormChange((prev) => ({
      ...prev,
      headers: (prev.headers || []).filter((_, i) => i !== index)
    }));
  };

  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    handleFormChange((prev) => {
      const updatedHeaders = [...(prev.headers || [])];
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        [field]: value
      };
      return { ...prev, headers: updatedHeaders };
    });
  };

  const renderTypeSpecificConfig = () => {
    switch (form.connectionType) {
      case "http":
        return (
          <HttpConfig
            form={form}
            handleFormChange={handleFormChange}
            headers={headers}
            onAddHeader={addHeader}
            onRemoveHeader={removeHeader}
            onUpdateHeader={updateHeader}
          />
        );
      case "ping":
        return <PingConfig />;
      case "tcp":
        return <TcpConfig />;
      case "container":
        return <ContainerConfig />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? "Add Monitor" : "Edit Monitor"}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Configure a new monitor to track service uptime."
              : "Update the monitor configuration. Changes apply immediately."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="monitor-name">Name (optional)</Label>
            <Input
              id="monitor-name"
              placeholder="My Website"
              value={form.name ?? ""}
              onChange={(e) =>
                handleFormChange((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monitor-url">Target</Label>
            <Input
              id="monitor-url"
              placeholder={getPlaceholder()}
              required
              value={form.connection ?? ""}
              onChange={(e) =>
                handleFormChange((f) => ({ ...f, connection: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Monitor Type</Label>
            <Tabs
              value={form.connectionType}
              onValueChange={(v) =>
                handleFormChange((f) => ({
                  ...f,
                  connectionType: v as MonitorForm["connectionType"]
                }))
              }
            >
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="http">HTTP(S)</TabsTrigger>
                <TabsTrigger value="ping">Ping</TabsTrigger>
                <TabsTrigger value="container">Container</TabsTrigger>
                <TabsTrigger value="tcp">TCP</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {renderTypeSpecificConfig()}

          <div className="space-y-3">
            <Label>Check Interval</Label>
            <ToggleGroup
              variant="outline"
              type="single"
              value={String(form.interval)}
              onValueChange={(value) =>
                value &&
                handleFormChange((f) => ({ ...f, interval: Number(value) }))
              }
            >
              <ToggleGroupItem value="30">30s</ToggleGroupItem>
              <ToggleGroupItem value="60">60s</ToggleGroupItem>
              <ToggleGroupItem value="120">2m</ToggleGroupItem>
              <ToggleGroupItem value="300">5m</ToggleGroupItem>
              <ToggleGroupItem value="600">10m</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="monitor-enabled"
                checked={form.enabled ?? true}
                onCheckedChange={(checked) =>
                  handleFormChange((f) => ({ ...f, enabled: checked }))
                }
              />
              <Label htmlFor="monitor-enabled" className="text-sm font-medium">
                Enable monitor
              </Label>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Will check uptime while enabled
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="monitor-alwaysSave"
                checked={form.alwaysSave ?? false}
                onCheckedChange={(checked) =>
                  handleFormChange((f) => ({ ...f, alwaysSave: checked }))
                }
              />
              <Label
                htmlFor="monitor-alwaysSave"
                className="text-sm font-medium"
              >
                Always save response
              </Label>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Saves the response even when successful
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="monitor-notification"
                  checked={notification.enabled}
                  onCheckedChange={(checked) =>
                    handleFormChange((prev) => ({
                      ...prev,
                      notification: checked
                        ? {
                            enabled: true,
                            type: prev.notification?.type || "webhook",
                            webhook: prev.notification?.webhook || "",
                            email: prev.notification?.email || ""
                          }
                        : { enabled: false }
                    }))
                  }
                />
                <Label
                  htmlFor="monitor-notification"
                  className="text-sm font-medium"
                >
                  Enable notifications
                </Label>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Send a notification when the service is down
              </p>
            </div>

            {notification.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Notification method</Label>
                  <ToggleGroup
                    variant="outline"
                    type="single"
                    value={notification.type || "webhook"}
                    onValueChange={(value) =>
                      value &&
                      handleFormChange((prev) => ({
                        ...prev,
                        notification: {
                          ...prev.notification!,
                          type: value as "webhook" | "email"
                        }
                      }))
                    }
                  >
                    <ToggleGroupItem value="webhook">Webhook</ToggleGroupItem>
                    <ToggleGroupItem value="email">Email</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {notification.type === "webhook" ? (
                  <div className="space-y-2">
                    <Label htmlFor="monitor-webhook">Webhook URL</Label>
                    <Input
                      id="monitor-webhook"
                      type="url"
                      placeholder="https://discordapp.com/api/webhooks/..."
                      value={notification.webhook || ""}
                      onChange={(e) =>
                        handleFormChange((prev) => ({
                          ...prev,
                          notification: {
                            ...prev.notification!,
                            webhook: e.target.value
                          }
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      POST JSON payload will be sent on status changes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="monitor-email">Email address</Label>
                    <Input
                      id="monitor-email"
                      type="email"
                      placeholder="alerts@example.com"
                      value={notification.email || ""}
                      onChange={(e) =>
                        handleFormChange((prev) => ({
                          ...prev,
                          notification: {
                            ...prev.notification!,
                            email: e.target.value
                          }
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      An email will be sent on status changes.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting
              ? isCreateMode
                ? "Adding..."
                : "Saving..."
              : isCreateMode
                ? "Add Monitor"
                : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
