"use client";

import { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/site-header";
import { AddMonitorModal } from "@/app/home/AddMonitor";
import { GetRequest } from "@/util";
import { toast } from "sonner";

import { mapApiMonitor } from "@/lib/monitors";
import { useMonitorPolling } from "@/hooks/useMonitorPolling";
import { MonitorSidebar } from "@/components/monitor-sidebar";
import { Monitor } from "@/types";
import { MonitorDetail } from "@/components/monitor-detaii";

export default function Home() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selected, setSelected] = useState<Monitor | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const refreshMonitor = useCallback(async (name: string) => {
    const [code, response] = await GetRequest(`monitor/${name}`);
    if (code !== 200) return;

    const updated = mapApiMonitor(response);

    setMonitors((prev) => prev.map((m) => (m.name === name ? updated : m)));

    setSelected((prev) => (prev?.name === name ? updated : prev));
  }, []);

  useEffect(() => {
    (async () => {
      const [code, response] = await GetRequest("monitors");
      if (code !== 200) {
        toast.error("Unable to fetch monitors");
        return;
      }

      const mapped = Object.values(response).map(mapApiMonitor);
      setMonitors(mapped);

      if (mapped.length > 0) {
        setSelected(mapped[0]);
        await refreshMonitor(mapped[0].name);
      }
    })();
  }, [refreshMonitor]);

  useMonitorPolling({ monitors, refreshMonitor });

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader />

      <div className="flex flex-1 overflow-hidden">
        <MonitorSidebar
          monitors={monitors}
          selected={selected}
          onSelect={setSelected}
          onAdd={() => setIsAddOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <MonitorDetail
            monitor={selected}
            onDeleted={(name) => {
              setMonitors((prev) => prev.filter((m) => m.name !== name));
              if (selected?.name === name) setSelected(null);
            }}
          />
        </main>
      </div>

      <AddMonitorModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAddMonitor={(monitor: Monitor) => {
          setMonitors((prev) => {
            const exists = prev.some((m) => m.name === monitor.name);
            if (exists) {
              return prev.map((m) => (m.name === monitor.name ? monitor : m));
            } else {
              return [...prev, monitor];
            }
          });
          setSelected(monitor);
        }}
      />
    </div>
  );
}
