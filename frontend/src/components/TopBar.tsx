"use client";
import { Package, Users, History, UserCog, LogOut, PackageSearch, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export default function TopBar({ activeTab, setActiveTab }: TopBarProps) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);
  
  const tabs = [
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "projects", label: "Projects", icon: PackageSearch },
    { id: "requests", label: "Requests", icon: ClipboardList },
    { id: "lending", label: "Lending", icon: Users },
    { id: "history", label: "History", icon: History },
  ];

  if (role === "ADMIN") {
    tabs.push({ id: "users", label: "Users", icon: UserCog });
  }

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="sticky top-6 z-50 w-full max-w-6xl mx-auto px-6 mb-8 transition-all duration-300">
      <div className="glass-panel px-5 py-3 rounded-2xl flex items-center justify-between shadow-xl shadow-brand-500/5 border border-white/40 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">Robotics & Software</div>
            <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">Inventory Manager</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-xl glass-input">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600 scale-105" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:scale-105"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-brand-500 dark:text-brand-400" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          <button onClick={handleLogout} className="flex flex-shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-105 rounded-xl transition-all duration-300 h-full border border-red-100/50 dark:border-red-500/20 shadow-sm ml-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
