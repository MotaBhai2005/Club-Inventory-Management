"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import TopBar from "@/components/TopBar";
import Metrics from "@/components/Metrics";
import InventoryTab from "@/components/InventoryTab";
import LendingTab from "@/components/LendingTab";
import HistoryTab from "@/components/HistoryTab";
import ProjectsTab from "@/components/ProjectsTab";
import RequestsTab from "@/components/RequestsTab";
import * as api from "@/services/api";
import { Item, Lending, History, DashboardMetrics } from "@/types";

export default function ManagerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("inventory");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [history, setHistory] = useState<History[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    // Adapt this to match the exact string your backend uses for Inventory Manager
    if (role !== "INVENTORY_MANAGER") {
      router.push("/");
    } else {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const [mRes, iRes, lRes, hRes] = await Promise.all([
        api.getMetrics(),
        api.getInventory(),
        api.getLendings({ limit: 100 }),
        api.getHistory({ limit: 200 })
      ]);
      setMetrics(mRes);
      setItems(iRes);
      setLendings(lRes);
      setHistory(hRes);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="min-h-screen relative">
      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Metrics metrics={metrics} />
        
        <div className="mt-8">
          {activeTab === "projects" && <ProjectsTab />}
          {/* We pass isAdmin={false} to restrict full delete if handled in the component, or add an isManager={true} prop */}
          {activeTab === "inventory" && <InventoryTab items={items} onRefresh={loadData} isAdmin={true} />}
          {activeTab === "requests" && <RequestsTab isAdmin={true} />}
          {activeTab === "lending" && <LendingTab lendings={lendings} items={items} onRefresh={loadData} />}
          {activeTab === "history" && <HistoryTab history={history} />}
        </div>
      </main>
    </div>
  );
}