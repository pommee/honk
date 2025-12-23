export interface Check {
  created: string;
  success: boolean;
  error: string;
}

export interface Monitor {
  id: string;
  name: string;
  connection: string;
  connectionType: number;
  interval: number;
  healthy: boolean;
  uptime: number;
  checked: string;
  checks: Check[];
  error: string;
}
