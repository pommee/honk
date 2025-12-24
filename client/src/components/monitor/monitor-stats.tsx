import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectionTypeIcon } from "@/lib/monitor-ui";
import { Monitor } from "@/types";

interface MonitorStatsProps {
  monitor: Monitor;
}

export function MonitorStats({ monitor }: MonitorStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Uptime (30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">{monitor.uptime}%</p>
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
            {monitor.connectionType}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
