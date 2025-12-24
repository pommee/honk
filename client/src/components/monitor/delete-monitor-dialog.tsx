import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor } from "@/types";
import { WarningIcon } from "@phosphor-icons/react";

interface DeleteMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monitor: Monitor;
  isDeleting: boolean;
  onDelete: () => void;
}

export function DeleteMonitorDialog({
  open,
  onOpenChange,
  monitor,
  isDeleting,
  onDelete
}: DeleteMonitorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <WarningIcon className="h-5 w-5" />
            Delete Monitor
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            monitor{" "}
            <span className="font-semibold text-foreground">
              "{monitor.name}"
            </span>{" "}
            and all its check history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Monitor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
