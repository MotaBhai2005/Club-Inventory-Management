"use client";
import { useState } from "react";
import { Plus, Edit2, Trash2, UserCog } from "lucide-react";
import * as api from "@/services/api";
import UserModal from "./Modals/UserModal";
import { User } from "@/types";

interface UsersTabProps {
  users: User[];
  onRefresh: () => void;
  currentUserId?: number | null;
}

export default function UsersTab({ users, onRefresh, currentUserId }: UsersTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="glass-panel px-6 py-4 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">User Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage administrators, inventory managers, and members</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reg Number</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.username}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">{user.registrationNumber || "N/A"}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                    ${user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                      user.role === 'INVENTORY_MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}
                  `}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {user.username !== (process.env.NEXT_PUBLIC_ROOT_ADMIN_USERNAME || 'admin') && user.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <UserCog className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    <p>No users found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <UserModal
          user={editingUser}
          currentUserId={currentUserId}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}