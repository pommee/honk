import { Check, Monitor } from "@/types";

export function mapApiMonitor(apiMonitor: Monitor): Monitor {
  return {
    ...apiMonitor,
    checks: apiMonitor.checks?.map((c: Check) => ({
      success: c.success,
      result: c.result || "",
      created: c.created
    }))
  };
}
