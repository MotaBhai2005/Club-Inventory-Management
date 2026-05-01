"use client";
import { Package, Users, History, UserCog, LogOut, PackageSearch, ClipboardList, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface SideNavBarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export default function SideNavBar({ activeTab, setActiveTab }: SideNavBarProps) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  useEffect(() => {
    if (!isConfirmOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfirmOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen]);
  
  const tabs = [
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "projects", label: "Projects", icon: PackageSearch },
    { id: "requests", label: "Requests", icon: ClipboardList },
  ];

  if (role === "ADMIN" || role === "INVENTORY_MANAGER") {
    tabs.push({ id: "lending", label: "Lending", icon: Users });
    tabs.push({ id: "history", label: "History", icon: History });
  }

  if (role === "ADMIN") {
    tabs.push({ id: "users", label: "Users", icon: UserCog });
  }

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    await signOut({ redirect: false });
    router.push("/");
  };

  const handleLogoutClick = () => {
    setIsConfirmOpen(true);
  };

  return (
    <>
      {/* Desktop Floating Dock */}
      <aside className="hidden md:flex flex-col items-center fixed top-6 bottom-6 left-6 z-50 glass-panel py-6 px-3 rounded-[2rem] shadow-2xl shadow-brand-500/10 border border-white/20 dark:border-slate-700/50 justify-between">
        <div className="flex flex-col items-center gap-4">
          {/* Logo / Brand Mark */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4 cursor-pointer" title="Club-Inventory-Dashboard">
            <Target className="w-6 h-6 text-white" />
          </div>

          <div className="flex flex-col gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <div key={tab.id} className="relative group">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                      isActive 
                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-lg shadow-black/20" 
                        : "bg-white/70 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-brand-500 hover:scale-110"
                    }`}
                  >
                    {/* Active Notch Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                    )}
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl border border-white/10 dark:bg-slate-800">
                    {tab.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Divider */}
          <div className="w-8 h-px bg-slate-300/50 dark:bg-slate-600/50" />

          {/* Sign Out Button */}
          <div className="relative group">
            <button
              onClick={handleLogoutClick}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 bg-red-50/50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-110"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl border border-red-500/50">
              Sign Out
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Responsive Bottom Bar */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass-panel p-1.5 rounded-2xl flex items-center justify-between shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                isActive 
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md" 
                  : "text-slate-700 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {isActive && <span>{tab.label}</span>}
            </button>
          );
        })}
        <button
          onClick={handleLogoutClick}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 bg-red-50/70 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsConfirmOpen(false)}
            aria-label="Close sign out confirmation"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Sign out?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">You will need to sign in again to access the dashboard.</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors w-full sm:w-auto"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
