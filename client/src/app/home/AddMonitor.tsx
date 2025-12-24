"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PostRequest } from "@/util";
import { toast } from "sonner";
import { MonitorType, MonitorTypeMap } from "@/constant";
import { Monitor } from "@/types";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddMonitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMonitor: (monitor: Monitor) => void;
}

export function AddMonitorModal({
  open,
  onOpenChange,
  onAddMonitor
}: AddMonitorModalProps) {
  const [name, setName] = useState("");
  const [connectionType, setConnectionType] = useState<MonitorType>("http");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState("60");
  const [enabled, setEnabled] = useState(true);
  const [alwaysSave, setAlwaysSave] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [webhook, setWebhook] = useState("");

  const handleSubmit = async () => {
    if (!url.trim()) return;

    const monitorPayload = {
      enabled: enabled,
      name: name.trim() || url,
      connection: url.trim(),
      connectionType: MonitorTypeMap[connectionType],
      interval: parseInt(interval, 10),
      alwaysSave: alwaysSave,
      notification:
        notificationEnabled && webhook.trim()
          ? {
              enabled: notificationEnabled,
              type: "webhook",
              webhook: webhook.trim()
            }
          : null
    };

    try {
      const [code, response] = await PostRequest("monitor", monitorPayload);

      if (code !== 200) {
        throw new Error(
          `Failed to create monitor (${response?.error || "Unknown error"})`
        );
      }

      const newMonitor: Monitor = {
        id: response?.id || null,
        enabled: monitorPayload.enabled,
        name: monitorPayload.name,
        connection: monitorPayload.connection,
        connectionType: monitorPayload.connectionType,
        interval: monitorPayload.interval,
        healthy: null,
        alwaysSave: monitorPayload.alwaysSave,
        uptime: 0,
        checked: "",
        checks: [],
        result: "",
        notification: monitorPayload.notification
      };

      onAddMonitor?.(newMonitor);

      setName("");
      setUrl("");
      setConnectionType("http");
      setInterval("60");
      setAlwaysSave(false);
      setNotificationEnabled(false);
      setWebhook("");
      onOpenChange(false);

      toast.success(`Monitor "${newMonitor.name}" added successfully!`);
    } catch (err) {
      toast.error(err.message || "Failed to add monitor");
      console.error("Error creating monitor:", err);
    }
  };

  const getPlaceholder = () => {
    switch (connectionType) {
      case "http":
        return "https://example.com";
      case "tcp":
        return "example.com:443";
      case "ping":
        return "example.com or 8.8.8.8";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Monitor</DialogTitle>
          <DialogDescription>
            Start monitoring a website, server port, or host. You can optionally
            set a webhook to receive notifications on status changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              placeholder="My Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Target</Label>
            <Input
              id="url"
              placeholder={getPlaceholder()}
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Monitor Type</Label>
            <Tabs
              value={connectionType}
              onValueChange={(v) => setConnectionType(Number(v))}
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
              variant={"outline"}
              type="single"
              value={interval}
              onValueChange={(value) => value && setInterval(value)}
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
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label
                htmlFor="enabled"
                className="text-sm font-medium leading-none"
              >
                Enable monitor
              </Label>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Will check uptime while enabled
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="alwaysSave"
              checked={alwaysSave}
              onCheckedChange={setAlwaysSave}
            />
            <Label
              htmlFor="alwaysSave"
              className="text-sm font-medium leading-none"
            >
              Always save response
            </Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="notification"
                checked={notificationEnabled}
                onCheckedChange={setNotificationEnabled}
              />
              <Label
                htmlFor="notification"
                className="text-sm font-medium leading-none"
              >
                Enable notifications
              </Label>
            </div>

            {notificationEnabled && (
              <div className="space-y-2 pl-6 border-l-2 border-muted">
                <div className="flex items-center gap-2">
                  <Label htmlFor="webhook">Webhook URL</Label>
                </div>
                <Input
                  id="webhook"
                  type="url"
                  placeholder="https://discordapp.com/api/webhooks/1234/ABCD-EFG..."
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  POST JSON payload will be sent on status changes (up → down or
                  down → up). Example services: Slack, Discord, Teams, custom
                  endpoints.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Add Monitor</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
