import { useState } from "react";
import { Plus, PackagePlus } from "lucide-react";
import LendItemModal from "./Modals/LendItemModal";
import BulkLendModal from "./Modals/BulkLendModal";
import * as api from "@/services/api";
import { Lending, Item } from "@/types";

interface LendingTabProps {
  lendings: Lending[];
  items: Item[];
  onRefresh: () => void;
}

export default function LendingTab({ lendings, items, onRefresh }: LendingTabProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isBulkOpen, setBulkOpen] = useState(false);

  const calculateDaysLeft = (lentOn: string, duration: number) => {
    const retDate = new Date(lentOn + "T00:00:00");
    retDate.setDate(retDate.getDate() + duration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((retDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
  };
  
  const getReturnDate = (lentOn: string, duration: number) => {
    const d = new Date(lentOn + "T00:00:00");
    d.setDate(d.getDate() + duration);
    return formatDate(d.toISOString().split('T')[0]);
  };

  const handleReturn = async (id: number, itemName: string | undefined) => {
    if (confirm(`Mark "${itemName}" as returned?`)) {
      try {
        await api.markReturned(id);
        onRefresh();
      } catch (err: any) {
        alert(err.response?.data?.error || "Error marking returned");
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Active Lendings</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <PackagePlus className="w-4 h-4" /> Bulk Checkout
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Lending
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-white/20 dark:border-slate-700/50">
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lent To</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Members</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dates</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
            {lendings.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-sm text-slate-500">No active lendings.</td></tr>
            ) : lendings.map(l => {
              const dl = calculateDaysLeft(l.lentOn, l.duration);
              return (
                <tr key={l.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{l.itemName}</div>
                    <div className="text-xs text-slate-500">Qty: {l.qty}</div>
                  </td>
                  <td className="p-4 text-sm font-medium">{l.club}</td>
                  <td className="p-4">
                    <div className="text-sm">{l.theirMember} <span className="text-slate-400 text-xs">(Borrower)</span></div>
                    <div className="text-sm">{l.ourMember} <span className="text-slate-400 text-xs">(Handler)</span></div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{formatDate(l.lentOn)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Return: {getReturnDate(l.lentOn, l.duration)}</div>
                  </td>
                  <td className="p-4">
                    {dl < 0 ? (
                       <span className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full">{Math.abs(dl)}d overdue</span>
                    ) : dl === 0 ? (
                       <span className="text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">Due today</span>
                    ) : (
                       <span className="text-green-600 dark:text-green-400 text-xs font-medium bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">{dl}d left</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleReturn(l.id, l.itemName)} className="px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20 rounded-lg text-xs font-medium transition-colors">
                      Mark Returned
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <LendItemModal 
          onClose={() => setModalOpen(false)} 
          onSave={onRefresh} 
          items={items.filter(i => (i.availQty ?? 0) > 0)} 
        />
      )}
      {isBulkOpen && (
        <BulkLendModal 
          onClose={() => setBulkOpen(false)} 
          onSave={onRefresh} 
          items={items} 
        />
      )}
    </div>
  );
}
