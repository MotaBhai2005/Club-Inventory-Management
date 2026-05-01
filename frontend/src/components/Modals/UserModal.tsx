"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import * as api from "@/services/api";
import { User } from "@/types";

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: number | null;
}

export default function UserModal({ user, onClose, onSuccess, currentUserId }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    registrationNumber: "",
    role: "MEMBER"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || "",
        password: "", // leave empty for edit
        registrationNumber: user.registrationNumber || "",
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data: any = { ...formData };
      if (!data.password) {
        delete data.password;
      }
      if (!data.registrationNumber) {
        delete data.registrationNumber;
      }

      if (user) {
        await api.updateUser(user.id, data);
      } else {
        await api.createUser(data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 shadow-2xl">
        <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {user ? "Edit User" : "Add New User"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                disabled={user?.username === (process.env.NEXT_PUBLIC_ROOT_ADMIN_USERNAME || 'admin')}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none transition-all placeholder:text-slate-400 ${user?.username === (process.env.NEXT_PUBLIC_ROOT_ADMIN_USERNAME || 'admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Enter unique username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none transition-all placeholder:text-slate-400"
                placeholder="example@club.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Registration Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. 21BCE0001"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  System Role
                </label>
                <select
                  disabled={user?.username === (process.env.NEXT_PUBLIC_ROOT_ADMIN_USERNAME || 'admin') || user?.id === currentUserId}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none transition-all text-slate-700 dark:text-slate-200 ${(user?.username === (process.env.NEXT_PUBLIC_ROOT_ADMIN_USERNAME || 'admin') || user?.id === currentUserId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="MEMBER">Member</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Password {!user && <span className="text-red-400">*</span>} {user && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
              </label>
              <input
                required={!user}
                minLength={6}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none transition-all placeholder:text-slate-400"
                placeholder={user ? "••••••••" : "Create password (min 6 chars)"}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/20 dark:border-slate-700/50 flex flex-col sm:flex-row justify-end gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
              ) : (
                user ? "Save Changes" : "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}