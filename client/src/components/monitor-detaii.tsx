import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import {
  connectionTypeIcon,
  connectionTypeLabel,
  StatusBadge
} from "@/lib/monitor-ui";
import { Monitor } from "@/types";

interface Props {
  monitor: Monitor | null;
}

export const MonitorDetail = ({ monitor }: Props) => {
  return (
    <main className="flex-1 overflow-y-auto bg-background">
      {monitor ? (
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {monitor.name || monitor.connection}
              </h1>
              <div className="mt-3 flex items-center gap-4">
                <StatusBadge healthy={monitor.healthy} />
                <span className="text-muted-foreground">
                  Checked {monitor.checked}
                </span>
              </div>
            </div>
            <Button variant="outline">Edit</Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {monitor.uptime}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Interval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{monitor.interval}s</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Type
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                {connectionTypeIcon(monitor.connectionType)}
                <span className="capitalize">
                  {connectionTypeLabel(monitor.connectionType) === "http"
                    ? "HTTP(s)"
                    : connectionTypeLabel(monitor.connectionType)}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Target */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Target</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="rounded-md bg-muted px-3 py-2 text-sm">
                {monitor.connection}
              </code>
            </CardContent>
          </Card>

          {/* Recent Checks */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Recent Checks</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Status history chart coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Activity className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-xl text-muted-foreground">
              Select a monitor to view details
            </p>
          </div>
        </div>
      )}
    </main>
  );
};
