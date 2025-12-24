import {
  ActivityIcon,
  CheckCircleIcon,
  ComputerTowerIcon,
  GlobeIcon,
  QuestionMarkIcon,
  ShippingContainerIcon,
  XCircleIcon
} from "@phosphor-icons/react";

export const connectionTypeIcon = (type: string) => {
  switch (type) {
    case "http":
      return <GlobeIcon size={16} />;
    case "ping":
      return <ActivityIcon size={16} />;
    case "container":
      return <ShippingContainerIcon size={16} />;
    case "tcp":
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
