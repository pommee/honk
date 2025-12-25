import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface MonitorChecksChartProps {
  checks: Check[];
  itemsPerPage?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-xs">
          <span className="text-muted-foreground">Date: </span>
          {new Date(data.created).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          })}
        </p>
        <p className="text-xs font-medium mt-1">
          <span className="text-muted-foreground">Took: </span>
          {data.responseTimeMs}ms
        </p>
        <p className="text-xs mt-1">
          <span className="text-muted-foreground">Check: </span>#
          {data.originalIndex + 1}
        </p>
      </div>
    );
  }
  return null;
};

export function MonitorChecksChart({
  checks,
  itemsPerPage = 50
}: MonitorChecksChartProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(checks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, checks.length);
  const currentChecks = checks.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(totalPages);
  }, [checks]);

  const chartData = currentChecks.map((check, idx) => ({
    id: `#${startIndex + idx + 1}`,
    responseTimeMs: check.responseTimeMs || 0,
    success: check.success,
    result: check.result || "",
    created: check.created,
    checkData: check,
    originalIndex: startIndex + idx
  }));

  const handleBarClick = (check: Check) => {
    setSelectedCheck(check);
    setIsDrawerOpen(true);
  };

  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPage = (page: number) => setCurrentPage(page);

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

  const renderPageButtons = () => {
    const buttons = [];

    if (totalPages <= 5) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      // Always show first page
      buttons.push(1);

      let startPage = Math.max(currentPage - 1, 2);
      let endPage = Math.min(currentPage + 1, totalPages - 1);

      if (currentPage === 1) endPage = 3;
      if (currentPage === totalPages) startPage = totalPages - 2;

      if (startPage > 2) buttons.push("..."); // left ellipsis

      for (let i = startPage; i <= endPage; i++) buttons.push(i);

      if (endPage < totalPages - 1) buttons.push("..."); // right ellipsis

      buttons.push(totalPages);
    }

    return buttons.map((pageNum, idx) =>
      pageNum === "..." ? (
        <span key={idx} className="px-2 text-sm">
          ...
        </span>
      ) : (
        <Button
          key={idx}
          variant={currentPage === pageNum ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => goToPage(pageNum as number)}
        >
          {pageNum}
        </Button>
      )
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Recent Checks</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {checks.length}
          </div>
        </CardHeader>
        <CardContent className="overflow-y-clip">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, bottom: 0, left: 10 }}
            >
              <XAxis dataKey="id" tick={false} />
              <YAxis
                dataKey="responseTimeMs"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}ms`}
                width={45}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.1)" }}
                animationDuration={0}
              />
              <Bar
                dataKey="responseTimeMs"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
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

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <CaretLeftIcon className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {renderPageButtons()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <CaretRightIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Click any bar for details • Height = response time
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
                      <pre className="text-sm text-wrap">
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
