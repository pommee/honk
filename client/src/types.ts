export interface Notification {
  id: number;
  monitorID: string;
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
  name: string;
  connection: string;
  connectionType: number;
  interval: number;
  healthy: boolean;
  uptime: number;
  alwaysSave: boolean;
  checked: string;
  checks: Check[];
  result: string;
  notification: Notification | null;
}
