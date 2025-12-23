import { Monitor } from "@/types";

export const mapApiMonitor = (data: any): Monitor => ({
  id: data.id,
  name: data.name,
  connection: data.connection,
  connectionType: data.connectionType,
  interval: data.interval,
  healthy: data.healthy,
  alwaysSave: data.alwaysSave,
  uptime: data.uptime,
  checked: data.checked ? new Date(data.checked).toLocaleString() : "never",
  checks: data.checks,
  error: data.error || ""
});
