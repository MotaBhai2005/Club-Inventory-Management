"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, Settings, ShieldAlert, Monitor, BellRing, Database, Moon, Sun } from "lucide-react";
import * as api from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
}

export default function SettingsModal({ isOpen, onClose, role }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "operations" | "system">("personal");
  
  // States for Personal
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [tableDensity, setTableDensity] = useState("comfortable");

  // States for Operations
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [alertRouting, setAlertRouting] = useState("in-app");

  // States for System
  const [maxCheckoutDuration, setMaxCheckoutDuration] = useState("14");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Ideally this would make API calls to save settings to the backend
    // For now, we'll save UI preferences to localStorage
    localStorage.setItem("tableDensity", tableDensity);
    
    // Close modal
    onClose();
  };

  const tabs = [
    { id: "personal", label: "Personal Preferences", icon: User },
  ];

  if (role === "ADMIN" || role === "INVENTORY_MANAGER") {
    tabs.push({ id: "operations", label: "Operations", icon: BellRing });
  }

  if (role === "ADMIN") {
    tabs.push({ id: "system", label: "System Config", icon: Database });
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Settings</h2>
          </div>
          
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
              {activeTab} Settings
            </h3>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-8 overflow-y-auto flex-1 min-h-0">
            {activeTab === "personal" && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-400" /> Interface
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Table Density</label>
                      <select 
                        value={tableDensity}
                        onChange={(e) => setTableDensity(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="comfortable">Comfortable</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Theme</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                        <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800">
                          {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-400" /> Security
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Current Password</label>
                      <input 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">New Password</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "operations" && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Inventory Alerts</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Low-Stock Threshold</label>
                      <input 
                        type="number"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Receive an alert when any item's quantity drops below this number.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Alert Routing</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Notification Method</label>
                      <select 
                        value={alertRouting}
                        onChange={(e) => setAlertRouting(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="in-app">In-App Notifications Only</option>
                        <option value="email">Email Summaries</option>
                        <option value="both">Both In-App & Email</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Global Lending Limits</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Default Max Checkout Duration (Days)</label>
                      <input 
                        type="number"
                        value={maxCheckoutDuration}
                        onChange={(e) => setMaxCheckoutDuration(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Registration</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">Domain-Restricted Signups</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Allow users to register with a specific email domain.</div>
                      </div>
                      <div className="w-10 h-6 bg-slate-300 dark:bg-slate-600 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
