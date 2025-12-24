import TimeAgo from "react-timeago";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Copy, AlertCircle } from "lucide-react";
import {
  connectionTypeIcon,
  connectionTypeLabel,
  StatusBadge
} from "@/lib/monitor-ui";
import { Monitor } from "@/types";
import { toast } from "sonner";
import { DeleteRequest, PutRequest } from "@/util";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "./ui/dialog";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { TimeAgoWithInterval } from "./time-ago-with-interval";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface Props {
  monitor: Monitor | null;
  onDeleted?: (id: number) => void;
  onUpdated?: (id: number) => void;
}

export function MonitorDetail({ monitor, onDeleted, onUpdated }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [form, setForm] = useState({
    id: monitor?.id,
    enabled: monitor?.enabled ?? false,
    name: monitor?.name ?? "",
    connection: monitor?.connection ?? "",
    connectionType: monitor?.connectionType ?? "http",
    interval: monitor?.interval ?? 60,
    alwaysSave: monitor?.alwaysSave ?? false,
    notification: monitor?.notification
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

  const CheckTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const check = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-xl p-4 text-sm max-w-sm max-h-96 flex flex-col">
          <div className="shrink-0">
            <div className="font-medium mb-2">
              {check.success ? (
                <span className="text-green-500">✓ Success</span>
              ) : (
                <span className="text-red-500">✗ Failed</span>
              )}
            </div>
            <div className="text-muted-foreground">
              {new Date(check.created).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t overflow-y-auto flex-1 pr-1">
            {check.err && (
              <div>
                <span className="font-medium text-red-600">Error:</span>
                <pre className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                  {check.err}
                </pre>
              </div>
            )}
            {!check.err && check.result && (
              <div>
                <span className="font-medium">Response:</span>
                <pre className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                  {check.result}
                </pre>
              </div>
            )}
            {!check.err && !check.result && (
              <div className="text-muted-foreground italic">
                No additional details
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!monitor) {
    return (
      <main className="flex-1 overflow-y-auto bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-6 h-20 w-20 text-muted-foreground/20" />
          <p className="text-xl text-muted-foreground">
            Select a monitor to view details
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto">
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
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Monitor
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Uptime (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                {monitor.uptime}%
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Check Interval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {monitor.interval}
                <span className="text-2xl text-muted-foreground ml-1">s</span>
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monitor Type
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                {connectionTypeIcon(monitor.connectionType)}
              </div>
              <span className="text-2xl font-semibold">
                {connectionTypeLabel(monitor.connectionType)}
              </span>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Target URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <a
                href={monitor.connection}
                target="#"
                className="flex-1 text-blue-400 underline text-sm font-mono"
              >
                {monitor.connection}
              </a>
              <Button
                variant="outline"
                size="icon"
                onClick={copyTarget}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={80}>
              <ScatterChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <XAxis
                  type="number"
                  dataKey="id"
                  tick={false}
                  interval={0}
                  domain={[0, monitor.checks?.length - 1 || 0]}
                />
                <YAxis type="number" dataKey="y" hide domain={[0, 1]} />
                <Tooltip
                  animationDuration={0}
                  content={<CheckTooltip />}
                  cursor={{ stroke: "transparent" }}
                />
                <Scatter
                  data={monitor.checks?.map((check, idx) => ({
                    id: idx,
                    y: 0,
                    success: check.success,
                    result: check.result || "",
                    created: check.created
                  }))}
                >
                  {monitor.checks?.map((check, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        check.success
                          ? "hsl(120, 70%, 50%)"
                          : "hsl(0, 70%, 50%)"
                      }
                      r={5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Delete Monitor
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                monitor{" "}
                <span className="font-semibold text-foreground">
                  "{monitor.name}"
                </span>{" "}
                and all its check history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Monitor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
                    setForm((f) => ({ ...f, name: e.target.value }))
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
                    setForm((f) => ({ ...f, connection: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Monitor Type</Label>
                <Tabs
                  value={connectionTypeLabel(form.connectionType)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, connectionType: v }))
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
                    value && setForm((f) => ({ ...f, interval: Number(value) }))
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
                    setForm((f) => ({ ...f, enabled: checked }))
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
                    setForm((f) => ({ ...f, alwaysSave: checked }))
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
                      setForm((f) => ({
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
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="edit-webhook"
                      type="url"
                      placeholder="https://discordapp.com/api/webhooks/1234/ABCD-EFG..."
                      value={form.notification.webhook || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          notification: {
                            ...f.notification,
                            webhook: e.target.value
                          }
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      POST JSON payload will be sent on status changes (up →
                      down or down → up). Example services: Slack, Discord,
                      Teams, custom endpoints.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
