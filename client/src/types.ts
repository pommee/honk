export type MonitorForm = {
  id?: number;
  enabled: boolean;
  name: string;
  connection: string;
  connectionType: "http" | "ping" | "container" | "tcp";
  interval: number;
  alwaysSave: boolean;
  notification?: {
    enabled: boolean;
    webhook?: string;
  } | null;
};

interface Notification {
  id: number;
  monitorID: string;
  enabled: boolean;
  type: string;
  webhook: string;
}

export interface Check {
  created: string;
  success: boolean;
  result: string;
}

export interface Monitor {
  id: number;
  enabled: boolean;
  name: string;
  connection: string;
  connectionType: number | "http" | "ping" | "conatiner" | "tcp";
  interval: number;
  healthy: boolean | null;
  uptime: number;
  alwaysSave: boolean;
  checked: string;
  checks: Check[];
  result: string;
  notification: Notification | null;
}
