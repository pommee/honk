"use client";

import { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/site-header";
import { GetRequest, PostRequest } from "@/util";
import { toast } from "sonner";

import { mapApiMonitor } from "@/lib/monitors";
import { useMonitorPolling } from "@/hooks/useMonitorPolling";
import { MonitorSidebar } from "@/components/monitor/monitor-sidebar";
import { DefaultMonitorForm, Monitor, MonitorForm } from "@/types";
import { MonitorDetail } from "@/components/monitor/monitor-detail";
import { MonitorFormDialog } from "@/components/monitor/edit-monitor-dialog";

const SELECTED_MONITOR_KEY = "selectedMonitorId";

export default function Home() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selected, setSelected] = useState<Monitor | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<MonitorForm>(DefaultMonitorForm);

  const refreshMonitor = useCallback(async (id: number) => {
    const [code, response] = await GetRequest(`monitor/${id}`);
    if (code !== 200) return;

    setMonitors((prev) => prev.map((m) => (m.id === id ? response : m)));

    setSelected((prev) => {
      if (prev && prev.id === id) {
        return response;
      }
      return prev;
    });
  }, []);

  const runMonitorNow = async (id: number) => {
    const [code] = await PostRequest(`monitor/${id}/run`, null);
    if (code !== 200) {
      toast.error("Failed to run monitor");
      return;
    }

    await refreshMonitor(id);
  };

  useEffect(() => {
    (async () => {
      const [code, response] = await GetRequest("monitors");
      if (code !== 200) {
        toast.error("Unable to fetch monitors");
        return;
      }

      const monitors = Object.values(response as Record<string, Monitor>);
      setMonitors(monitors);

      const savedId = localStorage.getItem(SELECTED_MONITOR_KEY);
      let selected: Monitor | undefined;

      if (savedId) {
        const monitorId = Number(savedId);
        selected = monitors.find((m) => m.id === monitorId);
        if (!selected) {
          localStorage.removeItem(SELECTED_MONITOR_KEY);
        }
      }

      if (!selected && monitors.length > 0) {
        selected = monitors[0];
      }

      if (selected) {
        setSelected(selected);
        await refreshMonitor(selected.id);
      }
    })();
  }, [refreshMonitor]);

  useMonitorPolling({ monitors, refreshMonitor });

  const handleCreateNewMonitor = () => {
    setForm({
      enabled: true,
      name: "",
      connection: "",
      connectionType: "http",
      interval: 60,
      alwaysSave: false,
      notification: undefined,
      headers: []
    });
    setIsAddOpen(true);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const [code, response] = await PostRequest("monitor", form);
      if (code !== 200) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create monitor");
      }

      const newMonitor = mapApiMonitor(response);
      toast.success(
        `Monitor "${
          newMonitor.name || newMonitor.connection
        }" created successfully`
      );

      setMonitors((prev) => {
        const exists = prev.some((m) => m.id === newMonitor.id);
        return exists
          ? prev.map((m) => (m.id === newMonitor.id ? newMonitor : m))
          : [...prev, newMonitor];
      });

      setSelected(newMonitor);
      localStorage.setItem(SELECTED_MONITOR_KEY, newMonitor.id.toString());
      await refreshMonitor(newMonitor.id);

      setIsAddOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to create monitor");
    } finally {
      setIsCreating(false);
    }
  };

  const handleMonitorDeleted = (id: number) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      // Remove from localStorage when the selected monitor is deleted
      localStorage.removeItem(SELECTED_MONITOR_KEY);
    }
  };

  const handleMonitorUpdated = async (id: number) => {
    await refreshMonitor(id);
  };

  const handleSelectMonitor = useCallback(
    async (monitor: Monitor) => {
      setSelected(monitor);
      localStorage.setItem(SELECTED_MONITOR_KEY, monitor.id.toString());
      await refreshMonitor(monitor.id);
    },
    [refreshMonitor]
  );

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader />

      <div className="flex flex-1 overflow-hidden">
        <MonitorSidebar
          monitors={monitors}
          selected={selected}
          onSelect={handleSelectMonitor}
          onAdd={handleCreateNewMonitor}
        />

        <main className="flex-1 overflow-y-auto">
          <MonitorDetail
            monitor={selected}
            hasMonitors={monitors.length > 0}
            onRunNow={runMonitorNow}
            onDeleted={handleMonitorDeleted}
            onUpdated={handleMonitorUpdated}
            onCreateNew={handleCreateNewMonitor}
          />
        </main>
      </div>

      <MonitorFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        form={form}
        onFormChange={setForm}
        isSubmitting={isCreating}
        onSave={handleCreate}
        onCancel={() => setIsAddOpen(false)}
        mode="create"
      />
    </div>
  );
}
