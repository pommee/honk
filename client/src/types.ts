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
}
