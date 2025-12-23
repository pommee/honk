export interface Monitor {
  id: string;
  name: string;
  connection: string;
  connectionType: number;
  interval: number;
  healthy: boolean;
  uptime: number;
  checked: string;
  error: string;
}
