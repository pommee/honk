import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Check } from "@/types";
import { ScrollArea } from "../ui/scroll-area";

interface MonitorChecksChartProps {
  checks: Check[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">
          {data.success ? "✓ Success" : "✗ Failed"}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(data.created).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          })}
        </p>
        <p className="text-xs font-medium mt-1">{data.responseTimeMs}ms</p>
      </div>
    );
  }
  return null;
};

export function MonitorChecksChart({ checks }: MonitorChecksChartProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);

  const handleBarClick = (check: Check) => {
    setSelectedCheck(check);
    setIsDrawerOpen(true);
  };

  if (!checks || checks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No check data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = checks.map((check, idx) => ({
    id: idx,
    responseTimeMs: check.responseTimeMs || 0,
    success: check.success,
    result: check.result || "",
    created: check.created,
    checkData: check
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Checks</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-clip">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="id"
                tick={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                dataKey="responseTimeMs"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${value}ms`}
                axisLine={{ stroke: "#e5e7eb" }}
                width={45}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.2)" }}
                animationDuration={0}
              />
              <Bar
                dataKey="responseTimeMs"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
                minPointSize={10}
              >
                {chartData.map((data, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      data.success
                        ? "oklch(72.3% 0.219 149.579)"
                        : "oklch(63.7% 0.237 25.331)"
                    }
                    style={{ cursor: "pointer" }}
                    onClick={() => handleBarClick(data.checkData)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Click on any bar to view details • Height represents response time
          </p>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle>Check Details</DrawerTitle>
              <DrawerDescription>
                Detailed information about this check
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-6">
              {selectedCheck && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status</p>
                      <Badge
                        variant={
                          selectedCheck.success ? "default" : "destructive"
                        }
                        className={selectedCheck.success ? "bg-green-600" : ""}
                      >
                        {selectedCheck.success ? "Success" : "Failed"}
                      </Badge>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">Response Time</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCheck.responseTimeMs}ms
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Timestamp</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedCheck.created).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Result</p>
                    <ScrollArea className="h-72 w-full bg-muted rounded-md border p-1">
                      <pre className="text-xs whitespace-pre-wrap wrap-break-words">
                        {selectedCheck.result || "No result data available"}
                      </pre>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Raw Data</p>
                    <div className="bg-muted rounded-md p-4">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedCheck, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
