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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Globe, Activity, Server } from "lucide-react";
import { ShippingContainerIcon } from "@phosphor-icons/react";
import { PostRequest } from "@/util";
import { toast } from "sonner";
import { MonitorType, MonitorTypeMap } from "@/constant";
import { Monitor } from "@/types";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const [type, setType] = useState<MonitorType>("http");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState("60");
  const [alwaysSave, setAlwaysSave] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const monitor = {
      name: name.trim() || url,
      connection: url.trim(),
      connectionType: MonitorTypeMap[type],
      interval: parseInt(interval, 10),
      alwaysSave: alwaysSave
    };

    try {
      const [code, response] = await PostRequest("monitor", monitor);

      if (code !== 200) {
        throw new Error(`Failed to create monitor (${response?.error})`);
      }

      onAddMonitor?.({
        id: response?.id || crypto.randomUUID(),
        name: monitor.name,
        connection: monitor.connection,
        connectionType: monitor.connectionType,
        interval: monitor.interval,
        healthy: false,
        uptime: 0,
        checked: "",
        checks: [],
        error: ""
      });

      setName("");
      setUrl("");
      setType("http");
      setInterval("60");
      onOpenChange(false);

      toast.success(`Monitor for ${monitor.name} was added!`);
    } catch (err) {
      console.error("Error creating monitor:", err);
    }
  };

  const getPlaceholder = () => {
    switch (type) {
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
      <DialogContent className="w-1/3">
        <DialogHeader>
          <DialogTitle>Add New Monitor</DialogTitle>
          <DialogDescription>
            Start monitoring a website, server port, docker container, or host
            with ping.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label htmlFor="type">Monitor Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="http">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTTP(s) / Website
                  </div>
                </SelectItem>
                <SelectItem value="ping">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Ping
                  </div>
                </SelectItem>
                <SelectItem value="container">
                  <div className="flex items-center gap-2">
                    <ShippingContainerIcon className="h-4 w-4" />
                    Container
                  </div>
                </SelectItem>{" "}
                <SelectItem value="tcp">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    TCP Port
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              {type === "http" && "URL"}
              {type === "ping" && "Hostname / IP"}
              {type === "tcp" && "Host:Port"}
            </Label>
            <Input
              id="url"
              placeholder={getPlaceholder()}
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <Label htmlFor="interval" className="my-1">
            Check Interval
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            How often the monitor checks the status.
          </p>
          <ToggleGroup
            type="single"
            variant={"outline"}
            value={interval}
            onValueChange={setInterval}
          >
            <ToggleGroupItem value="30">30s</ToggleGroupItem>
            <ToggleGroupItem value="60">60s</ToggleGroupItem>
            <ToggleGroupItem value="120">2m</ToggleGroupItem>
            <ToggleGroupItem value="300">5m</ToggleGroupItem>
            <ToggleGroupItem value="600">10m</ToggleGroupItem>
          </ToggleGroup>

          <Label className="my-1">Always save response</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Setting this to true will save the response even when successful.
          </p>
          <Switch checked={alwaysSave} onCheckedChange={setAlwaysSave} />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Monitor</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
