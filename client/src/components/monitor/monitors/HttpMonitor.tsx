import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { MonitorForm } from "@/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type HttpConfigProps = {
  form: MonitorForm;
  handleFormChange: (updater: (prev: MonitorForm) => MonitorForm) => void;
  headers: MonitorForm["headers"];
  onAddHeader: () => void;
  onRemoveHeader: (index: number) => void;
  onUpdateHeader: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;
};

export function HttpConfig({
  form,
  handleFormChange,
  headers = [],
  onAddHeader,
  onRemoveHeader,
  onUpdateHeader
}: HttpConfigProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Method</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={form.httpMethod}
          onValueChange={(value: string) =>
            value &&
            handleFormChange((prev) => ({
              ...prev,
              httpMethod: value as MonitorForm["httpMethod"]
            }))
          }
        >
          <ToggleGroupItem value="GET" className="!text-green-400">
            GET
          </ToggleGroupItem>
          <ToggleGroupItem value="POST" className="!text-yellow-400">
            POST
          </ToggleGroupItem>
          <ToggleGroupItem value="PUT" className="!text-blue-400">
            PUT
          </ToggleGroupItem>
          <ToggleGroupItem value="PATCH" className="!text-purple-400">
            PATCH
          </ToggleGroupItem>
          <ToggleGroupItem value="DELETE" className="!text-red-400">
            DELETE
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>HTTP Headers</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddHeader}
            className="h-8"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Header
          </Button>
        </div>

        {headers.length === 0 ? (
          <div className="text-sm text-muted-foreground italic p-4 border rounded-md bg-muted/50 text-center">
            No headers added. Click "Add Header" to include custom headers.
          </div>
        ) : (
          <div className="space-y-3">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-3 items-center">
                <Input
                  placeholder="Header name (e.g., Authorization)"
                  value={header.key ?? ""}
                  onChange={(e) => onUpdateHeader(index, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Header value"
                  value={header.value ?? ""}
                  onChange={(e) =>
                    onUpdateHeader(index, "value", e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveHeader(index)}
                  className="h-9 w-9 shrink-0"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              These headers will be included in every request to the target.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
