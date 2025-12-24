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
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";
import { CheckTooltip } from "./check-tooltip";
import { Check } from "@/types";
import { Badge } from "../ui/badge";

interface MonitorChecksChartProps {
  checks: Check[];
}

export function MonitorChecksChart({ checks }: MonitorChecksChartProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);

  const handleCellClick = (check: Check) => {
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
    y: 0,
    success: check.success,
    result: check.result || "",
    created: check.created
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Checks</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-clip">
          <ResponsiveContainer width="100%" height={100}>
            <ScatterChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <XAxis
                type="number"
                dataKey="id"
                tick={false}
                interval={0}
                domain={[0, checks.length - 1]}
              />
              <YAxis type="number" dataKey="y" hide domain={[0, 1]} />
              <Tooltip
                animationDuration={0}
                content={<CheckTooltip />}
                cursor={{ stroke: "transparent" }}
              />
              <Scatter data={chartData}>
                {checks.map((check, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      check.success ? "hsl(120, 70%, 50%)" : "hsl(0, 70%, 50%)"
                    }
                    r={5}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(check);
                    }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Click on any point to view details
          </p>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2/3">
            <DrawerHeader>
              <DrawerTitle></DrawerTitle>
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
                        className={selectedCheck.success ? "bg-green-500" : ""}
                      >
                        {selectedCheck.success ? "Success" : "Failed"}
                      </Badge>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">Timestamp</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedCheck.created).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Result</p>
                    <div className="bg-muted rounded-md p-4">
                      <pre className="text-xs whitespace-pre-wrap wrap-break-words">
                        {selectedCheck.result || "No result data available"}
                      </pre>
                    </div>
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
