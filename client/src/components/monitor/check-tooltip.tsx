interface CheckTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Check }>;
}

export function CheckTooltip({ active, payload }: CheckTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const check = payload[0].payload;
  return (
    <div className="bg-background border rounded-lg shadow-xl p-4 text-sm max-w-sm max-h-96 flex flex-col">
      <div className="shrink-0">
        <div className="font-medium mb-2">
          {check.success ? (
            <span className="text-green-500">✓ Success</span>
          ) : (
            <span className="text-red-500">✗ Failed</span>
          )}
        </div>
        <div className="text-muted-foreground">
          {new Date(check.created).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          })}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t overflow-y-auto flex-1 pr-1">
        {check.err && (
          <div>
            <span className="font-medium text-red-600">Error:</span>
            <pre className="text-muted-foreground mt-1 whitespace-pre-wrap wrap-break-words">
              {check.err}
            </pre>
          </div>
        )}
        {!check.err && check.result && (
          <div>
            <span className="font-medium">Response:</span>
            <pre className="text-muted-foreground mt-1 whitespace-pre-wrap wrap-break-words">
              {check.result}
            </pre>
          </div>
        )}
        {!check.err && !check.result && (
          <div className="text-muted-foreground italic">
            No additional details
          </div>
        )}
      </div>
    </div>
  );
}
