import { useState } from "react";
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
import { DeleteRequest } from "@/util";
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

interface Props {
  monitor: Monitor | null;
  onDeleted?: (name: string) => void;
}

export function MonitorDetail({ monitor, onDeleted }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!monitor) return;

    setIsDeleting(true);
    try {
      const [code, response] = await DeleteRequest(
        `monitor/${encodeURIComponent(monitor.name)}`,
        null
      );

      if (code !== 200) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete monitor");
      }

      toast.success(`Monitor "${monitor.name}" deleted successfully`);
      onDeleted?.(monitor.name);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete monitor");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyTarget = () => {
    if (monitor?.connection) {
      navigator.clipboard.writeText(monitor.connection);
      toast.success("Target URL copied to clipboard");
    }
  };

  const CheckTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const check = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-xl p-4 text-sm">
          <div className="font-medium mb-2">
            {check.success ? (
              <span className="text-green-600">✓ Success</span>
            ) : (
              <span className="text-red-600">✗ Failed</span>
            )}
          </div>
          <div className="text-muted-foreground">
            {new Date(check.created || check.timestamp).toLocaleString()}
          </div>
          {!check.success && check.err && (
            <div className="mt-2 pt-2 border-t">
              <span className="font-medium text-red-600">Error:</span>{" "}
              <span className="text-muted-foreground">{check.err}</span>
            </div>
          )}
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
        <div className="bg-background rounded-2xl shadow-sm border p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {monitor.name || monitor.connection}
              </h1>
              <div className="mt-4 flex items-center gap-6">
                <StatusBadge healthy={monitor.healthy} />
                <span className="text-muted-foreground text-lg">
                  Last checked: {monitor.checked}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="lg" variant="outline">
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
              <span className="text-2xl font-semibold capitalize">
                {connectionTypeLabel(monitor.connectionType) === "http"
                  ? "HTTP(S)"
                  : connectionTypeLabel(monitor.connectionType)}
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
              <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono break-all">
                {monitor.connection}
              </code>
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
                    err: check.error || "",
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
                monitor
                <span className="font-semibold text-foreground">
                  {" "}
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
      </div>
    </main>
  );
}
