import {
  ActivityIcon,
  CheckCircleIcon,
  ComputerTowerIcon,
  GlobeIcon,
  QuestionMarkIcon,
  ShippingContainerIcon,
  XCircleIcon
} from "@phosphor-icons/react";

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
      return <GlobeIcon size={16} />;
    case 1:
      return <ActivityIcon size={16} />;
    case 2:
      return <ShippingContainerIcon size={16} />;
    case 3:
      return <ComputerTowerIcon size={16} />;
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
      <CheckCircleIcon size={12} />
      Up
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 h-fit rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-muted">
      <XCircleIcon size={12} />
      Down
    </span>
  );
};
