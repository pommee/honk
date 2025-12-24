"use client";

import { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/site-header";
import { AddMonitorModal } from "@/app/home/AddMonitor";
import { GetRequest } from "@/util";
import { toast } from "sonner";

import { mapApiMonitor } from "@/lib/monitors";
import { useMonitorPolling } from "@/hooks/useMonitorPolling";
import { MonitorSidebar } from "@/components/monitor/monitor-sidebar";
import { Monitor } from "@/types";
import { MonitorDetail } from "@/components/monitor/monitor-detail";

export default function Home() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selected, setSelected] = useState<Monitor | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const refreshMonitor = useCallback(async (id: number) => {
    const [code, response] = await GetRequest(`monitor/${id}`);
    if (code !== 200) return;

    const updated = mapApiMonitor(response);

    setMonitors((prev) => prev.map((m) => (m.id === id ? updated : m)));

    setSelected((prev) => (prev?.id === id ? updated : prev));
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
        await refreshMonitor(mapped[0].id);
      }
    })();
  }, [refreshMonitor]);

  useMonitorPolling({ monitors, refreshMonitor });

  const handleCreateNewMonitor = () => {
    setIsAddOpen(true);
  };

  const handleMonitorDeleted = (id: number) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleMonitorUpdated = async (id: number) => {
    await refreshMonitor(id);
  };

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
            hasMonitors={monitors.length > 0}
            onDeleted={handleMonitorDeleted}
            onUpdated={handleMonitorUpdated}
            onCreateNew={handleCreateNewMonitor}
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
