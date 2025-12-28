import { Card, CardContent } from "@/components/ui/card";
import { connectionTypeIcon } from "@/lib/monitor-ui";
import { Monitor } from "@/types";
import {
  ActivityIcon,
  ClockIcon,
  TimerIcon,
  TrendUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  WarningCircleIcon
} from "@phosphor-icons/react";

interface MonitorStatsProps {
  monitor: Monitor;
}

export function MonitorStats({ monitor }: MonitorStatsProps) {
  if (!monitor.checks) return null;

  const successfulChecks = monitor.checks.filter((c) => c.success);

  const bestResponseTime =
    successfulChecks.length > 0
      ? Math.min(...successfulChecks.map((c) => c.responseTimeMs))
      : null;

  const uptime = (
    (monitor.successfulChecks / monitor.totalChecks) *
    100
  ).toFixed(2);

  const avgResponseTime =
    monitor.checks.length > 0
      ? Math.round(
          monitor.checks.reduce((sum, check) => sum + check.responseTimeMs, 0) /
            monitor.checks.length
        )
      : 0;

  const recentChecks = monitor.checks.slice(0, 10);
  const successRate =
    recentChecks.length > 0
      ? Math.round(
          (recentChecks.filter((c) => c.success).length / recentChecks.length) *
            100
        )
      : 0;

  const failures24h = monitor.checks.filter((check) => {
    const checkTime = new Date(check.created).getTime();
    const now = Date.now();
    return !check.success && now - checkTime <= 24 * 60 * 60 * 1000;
  }).length;

  const currentStatus = monitor.healthy ? "operational" : "down";
  const statusColor = monitor.healthy ? "bg-green-500" : "bg-red-500";

  const lastCheckedTime = monitor.checked
    ? new Date(monitor.checked).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      })
    : "Never";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="flex">
        <CardContent className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
              <ActivityIcon className="w-4 h-4" weight="duotone" />
              Current Status
            </p>
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`}
              />
              <p className="text-2xl font-bold capitalize">{currentStatus}</p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <p className="text-xs text-muted-foreground">Last checked</p>
            <p className="text-sm font-medium">{lastCheckedTime}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <TrendUpIcon className="w-4 h-4" weight="duotone" />
              Uptime (30d)
            </p>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              30 days
            </span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {uptime}%
            </p>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Recent (10 checks)
              </p>
              <p className="text-lg font-semibold">{successRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex flex-col justify-between">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
            <TimerIcon className="w-4 h-4" weight="duotone" />
            Response Time
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">
                {avgResponseTime}
                <span className="text-lg font-normal text-muted-foreground ml-1">
                  ms
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Average</p>
            </div>
            {bestResponseTime !== null && monitor.checks.length > 1 && (
              <div className="text-right">
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {bestResponseTime}ms
                </p>
                <p className="text-xs text-muted-foreground">Best</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {connectionTypeIcon(monitor.connectionType)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Connection Type
                  </p>
                  <p className="font-semibold capitalize">
                    {monitor.connectionType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Check Interval</p>
                <p className="font-semibold flex items-center gap-1 justify-end">
                  <ClockIcon className="w-4 h-4" />
                  {monitor.interval}s
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Total Checks</p>
                <p className="font-semibold flex items-center gap-1.5">
                  <ChartBarIcon className="w-4 h-4" />
                  {monitor.totalChecks.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Failures (24h)</p>
                <p className="font-semibold flex items-center gap-1.5 justify-end">
                  {failures24h > 0 ? (
                    <>
                      <WarningCircleIcon
                        className="w-4 h-4 text-amber-500"
                        weight="fill"
                      />
                      <span className="text-amber-600 dark:text-amber-400">
                        {failures24h}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon
                        className="w-4 h-4 text-green-500"
                        weight="fill"
                      />
                      <span className="text-green-600 dark:text-green-400">
                        0
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
