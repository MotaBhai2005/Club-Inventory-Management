"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import InventoryTab from "@/components/InventoryTab";
import ProjectsTab from "@/components/ProjectsTab";
import RequestsTab from "@/components/RequestsTab";
import * as api from "@/services/api";
import { Item } from "@/types";
import { LogOut, Package } from "lucide-react";

export default function MemberDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<string>("inventory");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) {
      router.push("/");
    } else {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getInventory();
      setItems(res);
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      }
      console.error(err);
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
      <div className="glass-panel sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Robotics & Software Club</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Public Inventory View</div>
          </div>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700/50 rounded-lg transition-colors">
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Live Component Availability</h1>
            <p className="text-sm text-slate-500 mt-1">Check to see what hardware is currently sitting in the lab, or view ongoing projects.</p>
          </div>
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl glass-input">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "inventory" ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-100 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "projects" ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-100 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "requests" ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-100 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Requests
            </button>
          </div>
        </div>
        
        {activeTab === "inventory" && <InventoryTab items={items} onRefresh={loadData} isAdmin={false} />}
        {activeTab === "projects" && <ProjectsTab />}
        {activeTab === "requests" && <RequestsTab isAdmin={false} />}
      </main>
    </div>
  );
}
