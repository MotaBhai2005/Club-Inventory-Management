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
import SideNavBar from "@/components/SideNavBar";
import TopNavBar from "@/components/TopNavBar";
import DataBackground from "@/components/DataBackground";

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
    <div className="min-h-screen relative overflow-x-hidden">
      <DataBackground />
      <SideNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <TopNavBar />

      <main className="md:ml-24 pt-28 px-6 md:px-8 pb-12 w-full max-w-7xl mx-auto min-h-screen relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Welcome, Member</p>
            <h1 className="font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2 mb-2">Live Component Availability</h1>
            <p className="text-sm text-slate-500 max-w-lg">Explore what is in the lab, track active projects, and make requests in a few taps.</p>
          </div>
        </div>
        
        {activeTab === "inventory" && <InventoryTab items={items} onRefresh={loadData} isAdmin={false} />}
        {activeTab === "projects" && <ProjectsTab />}
        {activeTab === "requests" && <RequestsTab isAdmin={false} />}
      </main>
    </div>
  );
}
