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
    type: "webhook" | "email";
    webhook?: string;
    email: string;
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
  responseTimeMs: number;
}

export interface Monitor {
  id: number;
  enabled: boolean;
  name: string;
  connection: string;
  connectionType: "http" | "ping" | "container" | "tcp";
  interval: number;
  healthy: boolean | null;
  alwaysSave: boolean;
  checked: string;
  checks: Check[];
  result: string;
  notification: Notification | null;
  totalChecks: number;
  successfulChecks: number;
}
