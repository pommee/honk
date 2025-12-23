import { Monitor } from "@/types";

export const mapApiMonitor = (data: any): Monitor => ({
  id: data.ID?.toString() ?? crypto.randomUUID(),
  name: data.name,
  connection: data.connection,
  connectionType: data.connectionType,
  interval: data.interval,
  healthy: data.healthy,
  uptime: data.uptime,
  checked: data.checked ? new Date(data.checked).toLocaleString() : "never",
  error: data.error || ""
});
