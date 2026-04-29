"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import SideNavBar from "@/components/SideNavBar";
import TopNavBar from "@/components/TopNavBar";
import DataBackground from "@/components/DataBackground";
import Metrics from "@/components/Metrics";
import InventoryTab from "@/components/InventoryTab";
import LendingTab from "@/components/LendingTab";
import HistoryTab from "@/components/HistoryTab";
import UsersTab from "@/components/UsersTab";
import ProjectsTab from "@/components/ProjectsTab";
import RequestsTab from "@/components/RequestsTab";
import * as api from "@/services/api";
import { Item, Lending, History, DashboardMetrics, User } from "@/types";
import { LogOut } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("inventory");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (role !== "ADMIN" || !token) {
      router.push("/");
    } else {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUserId(decoded.id);
      } catch (e) {}
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const [mRes, iRes, lRes, hRes, uRes] = await Promise.all([
        api.getMetrics(),
        api.getInventory(),
        api.getLendings({ limit: 100 }),
        api.getHistory({ limit: 200 }),
        api.getUsers()
      ]);
      setMetrics(mRes);
      setItems(iRes);
      setLendings(lRes);
      setHistory(hRes);
      setUsers(uRes);
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
    <div className="min-h-screen relative overflow-x-hidden">
      <DataBackground />
      <SideNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <TopNavBar />

      <main className="md:ml-24 pt-28 px-6 md:px-8 pb-12 w-full max-w-7xl mx-auto min-h-screen relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-slate-800 dark:text-white mb-2">Admin Dashboard</h2>
          </div>
        </div>

        <Metrics metrics={metrics} />

        <div className="mt-8">
          {activeTab === "projects" && <ProjectsTab />}
          {activeTab === "inventory" && <InventoryTab items={items} onRefresh={loadData} isAdmin={true} />}
          {activeTab === "requests" && <RequestsTab isAdmin={true} />}
          {activeTab === "lending" && <LendingTab lendings={lendings} items={items} onRefresh={loadData} />}
          {activeTab === "history" && <HistoryTab history={history} />}
          {activeTab === "users" && <UsersTab users={users} onRefresh={loadData} currentUserId={currentUserId} />}
        </div>
      </main>
    </div>
  );
}
