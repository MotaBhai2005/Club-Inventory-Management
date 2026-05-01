"use client";
import { Search, Bell, Settings, User, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import SettingsModal from "./SettingsModal";
import * as api from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopNavBar() {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUsername(decoded.username || "User");
      } catch (e) {}
    }
    
    // In a real app, you would fetch from /api/notifications here
    // For now, let's mock one so you can see the UI
    setNotifications([
      { id: 1, title: "Overdue Item", message: "Arduino Uno is overdue by 2 days.", type: "WARNING", isRead: false, createdAt: new Date().toISOString() },
      { id: 2, title: "New Request", message: "Rajan requested a Raspberry Pi.", type: "INFO", isRead: false, createdAt: new Date().toISOString() }
    ]);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const getRoleDisplay = () => {
    if (role === "ADMIN") return "System Admin";
    if (role === "INVENTORY_MANAGER") return "Inventory Manager";
    return "Club Member";
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full h-16 sm:h-20 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-[20px] border-b border-white/10 dark:border-slate-700/50 flex items-center justify-between px-4 sm:px-8 md:pl-28 z-40 shadow-sm transition-all">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
            <input 
              className="w-full bg-slate-800/50 dark:bg-slate-800/80 border border-white/5 dark:border-slate-700/50 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 placeholder:text-slate-500 text-slate-200 backdrop-blur-md transition-all" 
              placeholder="Search users, roles, or inventory..." 
              type="text"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-6 ml-auto">
          
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="hover:bg-white/10 dark:hover:bg-slate-800 rounded-full p-2 sm:p-2.5 transition-colors relative group"
            >
              <Bell className="w-5 h-5 text-slate-300 dark:text-slate-400 group-hover:text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-slate-900"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h4>
                  <button className="text-[10px] text-brand-500 font-semibold hover:underline">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="relative p-4 border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3 cursor-pointer group">
                      {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-md"></div>}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</span>
                          <span className="text-[10px] text-slate-400">Just now</span>
                        </div>
                        <p className={`text-xs ${!n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>{n.message}</p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="hover:bg-white/10 dark:hover:bg-slate-800 rounded-full p-2 sm:p-2.5 transition-colors group"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-slate-300 dark:text-slate-400 group-hover:text-white" />
            ) : (
              <Moon className="w-5 h-5 text-slate-300 dark:text-slate-400 group-hover:text-white" />
            )}
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-white/10 dark:hover:bg-slate-800 rounded-full p-2 sm:p-2.5 transition-colors group"
          >
            <Settings className="w-5 h-5 text-slate-300 dark:text-slate-400 group-hover:text-white" />
          </button>
          
          <div className="h-8 w-px bg-white/10 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-white">{getRoleDisplay()}</p>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 uppercase tracking-tighter font-medium">{username}</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-brand-500/30 bg-slate-800 flex items-center justify-center text-slate-300">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        role={role}
      />
    </>
  );
}
