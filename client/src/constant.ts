export const MonitorTypeMap = {
  http: 0,
  ping: 1,
  container: 2,
  tcp: 3
} as const;

export type MonitorType = keyof typeof MonitorTypeMap;
type MonitorTypeInt = (typeof MonitorTypeMap)[MonitorType];
