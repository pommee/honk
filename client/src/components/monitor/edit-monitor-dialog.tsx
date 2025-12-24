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
import { WarningIcon } from "@phosphor-icons/react";
import { MonitorForm } from "@/types";

interface EditMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: MonitorForm;
  onFormChange: (updater: (prev: MonitorForm) => MonitorForm) => void;
  isUpdating: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function EditMonitorDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  isUpdating,
  onSave,
  onCancel
}: EditMonitorDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Monitor</DialogTitle>
          <DialogDescription>
            Update the monitor configuration. Changes apply immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name (optional)</Label>
            <Input
              id="edit-name"
              placeholder="My Website"
              value={form.name}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url">Target</Label>
            <Input
              id="edit-url"
              placeholder={getPlaceholder()}
              required
              value={form.connection}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, connection: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Monitor Type</Label>
            <Tabs
              value={form.connectionType}
              onValueChange={(v) =>
                onFormChange((f) => ({ ...f, connectionType: v }))
              }
            >
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger
                  value="http"
                  className="border-l-0 !bg-transparent border-t-0 border-r-0 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:!border-b-primary rounded-none"
                >
                  HTTP(S)
                </TabsTrigger>
                <TabsTrigger
                  value="ping"
                  className="border-l-0 !bg-transparent border-t-0 border-r-0 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:!border-b-primary rounded-none"
                >
                  Ping
                </TabsTrigger>
                <TabsTrigger
                  value="container"
                  className="border-l-0 !bg-transparent border-t-0 border-r-0 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:!border-b-primary rounded-none"
                >
                  Container
                </TabsTrigger>
                <TabsTrigger
                  value="tcp"
                  className="border-l-0 !bg-transparent border-t-0 border-r-0 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:!border-b-primary rounded-none"
                >
                  TCP
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-3">
            <Label>Check Interval</Label>
            <ToggleGroup
              variant="outline"
              type="single"
              value={String(form.interval)}
              onValueChange={(value) =>
                value &&
                onFormChange((f) => ({ ...f, interval: Number(value) }))
              }
            >
              <ToggleGroupItem value="30">30s</ToggleGroupItem>
              <ToggleGroupItem value="60">60s</ToggleGroupItem>
              <ToggleGroupItem value="120">2m</ToggleGroupItem>
              <ToggleGroupItem value="300">5m</ToggleGroupItem>
              <ToggleGroupItem value="600">10m</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-enabled"
              checked={form.enabled}
              onCheckedChange={(checked) =>
                onFormChange((f) => ({ ...f, enabled: checked }))
              }
            />
            <Label
              htmlFor="edit-enabled"
              className="text-sm font-medium leading-none"
            >
              Enable monitor
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-alwaysSave"
              checked={form.alwaysSave}
              onCheckedChange={(checked) =>
                onFormChange((f) => ({ ...f, alwaysSave: checked }))
              }
            />
            <Label
              htmlFor="edit-alwaysSave"
              className="text-sm font-medium leading-none"
            >
              Always save response
            </Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-notification"
                checked={form.notification?.enabled ?? false}
                onCheckedChange={(checked) =>
                  onFormChange((f) => ({
                    ...f,
                    notification: checked
                      ? {
                          ...f.notification,
                          enabled: true,
                          webhook: f.notification?.webhook || ""
                        }
                      : { ...f.notification, enabled: false }
                  }))
                }
              />
              <Label
                htmlFor="edit-notification"
                className="text-sm font-medium leading-none"
              >
                Enable notifications
              </Label>
            </div>

            {form.notification?.enabled && (
              <div className="space-y-2 pl-6 border-l-2 border-muted">
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-webhook">Webhook URL</Label>
                  <WarningIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="edit-webhook"
                  type="url"
                  placeholder="https://discordapp.com/api/webhooks/1234/ABCD-EFG..."
                  value={form.notification.webhook || ""}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      notification: {
                        ...f.notification,
                        webhook: e.target.value
                      }
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  POST JSON payload will be sent on status changes (up → down or
                  down → up). Example services: Slack, Discord, Teams, custom
                  endpoints.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
