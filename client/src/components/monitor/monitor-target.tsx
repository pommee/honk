import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Monitor } from "@/types";

interface MonitorTargetProps {
  monitor: Monitor;
  onCopy: () => void;
}

export function MonitorTarget({ monitor, onCopy }: MonitorTargetProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Target URL</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <a
            href={monitor.connection}
            target="#"
            className="flex-1 text-blue-400 underline text-sm font-mono"
          >
            {monitor.connection}
          </a>
          <Button
            variant="outline"
            size="icon"
            onClick={onCopy}
            className="shrink-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
