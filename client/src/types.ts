interface Headers {
  id: number;
  key: string;
  value: string;
}

export type MonitorForm = {
  id?: number;
  enabled: boolean;
  name: string;
  connection: string;
  connectionType: "http" | "ping" | "container" | "tcp";
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  interval: number;
  alwaysSave: boolean;
  headers: Headers[];
  notification?: Notification | null;
};

export const DefaultMonitorForm: MonitorForm = {
  enabled: true,
  name: "",
  connection: "",
  connectionType: "http",
  httpMethod: "GET",
  interval: 60,
  alwaysSave: false,
  headers: [],
  notification: null
};

interface Notification {
  id: number;
  monitorID: number;
  enabled: boolean;
  type: "webhook" | "email";
  webhook: string;
  email: string;
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
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  interval: number;
  healthy: boolean | null;
  alwaysSave: boolean;
  checked: string;
  checks: Check[];
  result: string;
  notification: Notification | null;
  totalChecks: number;
  successfulChecks: number;
  headers: Headers[];
}
