import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface MonitorChecksChartProps {
  checks: Check[];
}

export function MonitorChecksChart({ checks }: MonitorChecksChartProps) {
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

  return (
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
              domain={[0, checks.length - 1]}
            />
            <YAxis type="number" dataKey="y" hide domain={[0, 1]} />
            <Tooltip
              animationDuration={0}
              content={<CheckTooltip />}
              cursor={{ stroke: "transparent" }}
            />
            <Scatter
              data={checks.map((check, idx) => ({
                id: idx,
                y: 0,
                success: check.success,
                result: check.result || "",
                created: check.created
              }))}
            >
              {checks.map((check, idx) => (
                <Cell
                  key={idx}
                  fill={
                    check.success ? "hsl(120, 70%, 50%)" : "hsl(0, 70%, 50%)"
                  }
                  r={5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
