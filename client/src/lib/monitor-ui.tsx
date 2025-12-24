import { Activity, Globe, Server, CheckCircle2, XCircle } from "lucide-react";
import { QuestionMarkIcon, ShippingContainerIcon } from "@phosphor-icons/react";

export const connectionTypeLabel = (type: number) => {
  switch (type) {
    case 0:
      return "http";
    case 1:
      return "ping";
    case 2:
      return "container";
    case 3:
      return "tcp";
  }
};

export const connectionTypeIcon = (type: number) => {
  switch (type) {
    case 0:
      return <Globe size={16} />;
    case 1:
      return <Activity size={16} />;
    case 2:
      return <ShippingContainerIcon size={16} />;
    case 3:
      return <Server size={16} />;
    default:
      return null;
  }
};

export const StatusBadge = ({ healthy }: { healthy: boolean | null }) => {
  if (healthy === null || healthy === undefined) {
    return (
      <span className="inline-flex items-center gap-1 h-fit rounded-full bg-gray-500 px-2.5 py-1 text-xs font-medium text-muted">
        <QuestionMarkIcon size={12} />
        Unknown
      </span>
    );
  }

  return healthy ? (
    <span className="inline-flex items-center gap-1 h-fit rounded-full bg-green-500 px-2.5 py-1 text-xs font-medium text-muted">
      <CheckCircle2 size={12} />
      Up
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 h-fit rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-muted">
      <XCircle size={12} />
      Down
    </span>
  );
};
