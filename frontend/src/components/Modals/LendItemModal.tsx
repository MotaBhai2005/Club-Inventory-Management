import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar } from "lucide-react";
import * as api from "@/services/api";
import { Item } from "@/types";

interface LendItemModalProps {
  onClose: () => void;
  onSave: () => void;
  items: Item[];
}

export default function LendItemModal({ onClose, onSave, items }: LendItemModalProps) {
  const [formData, setFormData] = useState({
    itemId: "", 
    qty: 1, 
    club: "", 
    theirMember: "",
    borrowerEmail: "",
    ourMember: "", 
    lentOn: new Date().toISOString().split('T')[0], 
    duration: 7, 
    notes: ""
  });

  const selectedItem = items.find(i => i.id === parseInt(formData.itemId));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.addLending({
        ...formData,
        itemId: parseInt(formData.itemId)
      });
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error creating lending");
    }
  };
  
  const getExpectedReturnDate = () => {
    if (!formData.lentOn || !formData.duration) return "-";
    const d = new Date(formData.lentOn + "T00:00:00");
    d.setDate(d.getDate() + formData.duration);
    return d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">New Lending</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Item to Lend *</label>
              <select required value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value, qty: 1})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none">
                <option value="">Select item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id.toString()}>{item.name} ({item.availQty} avail.)</option>
                ))}
              </select>
            </div>
            
            {selectedItem && (
              <div className="px-4 py-3 rounded-lg bg-brand-50/50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-sm text-brand-700 dark:text-brand-300">
                <strong>{selectedItem.name}</strong> — {selectedItem.availQty} of {selectedItem.qty} units available · Condition: {selectedItem.cond}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Quantity to Lend *</label>
              <input required type="number" min="1" max={selectedItem?.availQty || 1} value={formData.qty || ''} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Lending Club / Organization *</label>
                <input required type="text" value={formData.club} onChange={e => setFormData({...formData, club: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="e.g. IEEE Branch" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Their Member *</label>
                <input required type="text" value={formData.theirMember} onChange={e => setFormData({...formData, theirMember: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Borrower name" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Borrower Email (Optional)</label>
              <input type="email" value={formData.borrowerEmail} onChange={e => setFormData({...formData, borrowerEmail: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="For automated overdue alerts" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Our Member *</label>
                <input required type="text" value={formData.ourMember} onChange={e => setFormData({...formData, ourMember: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Handler name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date of Release *</label>
                <input required type="date" value={formData.lentOn} onChange={e => setFormData({...formData, lentOn: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Return Duration (Days) *</label>
              <input required type="number" min="1" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="e.g. 7" />
            </div>
            
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4" /> Expected return: <strong className="text-slate-800 dark:text-slate-100">{getExpectedReturnDate()}</strong>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm h-16 resize-none focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Purpose, special conditions..."></textarea>
            </div>
          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-white/20 dark:border-slate-700/50 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/30 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-colors w-full sm:w-auto">Confirm Lending</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
