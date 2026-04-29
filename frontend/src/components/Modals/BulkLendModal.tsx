import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Search } from "lucide-react";
import * as api from "@/services/api";
import { Item } from "@/types";

interface BulkLendModalProps {
  onClose: () => void;
  onSave: () => void;
  items: Item[]; // The full inventory list
}

export default function BulkLendModal({ onClose, onSave, items }: BulkLendModalProps) {
  const [formData, setFormData] = useState({
    club: "", 
    theirMember: "",
    borrowerEmail: "",
    ourMember: "", 
    lentOn: new Date().toISOString().split('T')[0], 
    duration: 7, 
    notes: ""
  });
  
  const [searchTerm, setSearchTerm] = useState("");

  // Track quantities, default to 0!
  const [itemQtys, setItemQtys] = useState<Record<number, number>>({});

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.cat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    try {
      // Safely filter out items that legitimately have a quantity selected
      const formattedItems = Object.entries(itemQtys)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({
          itemId: parseInt(id),
          qty
        }));
        
      if (formattedItems.length === 0) {
        alert("You must include at least one item in the checkout bundle with a quantity > 0!");
        return;
      }

      await api.bulkLend({
        ...formData,
        items: formattedItems
      });
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error checking out bulk items");
    }
  };
  
  const getExpectedReturnDate = () => {
    if (!formData.lentOn || !formData.duration) return "-";
    const d = new Date(formData.lentOn + "T00:00:00");
    d.setDate(d.getDate() + formData.duration);
    return d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
  };

  const handleQtyChange = (id: number, val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
       setItemQtys(prev => ({ ...prev, [id]: num }));
    } else {
       setItemQtys(prev => ({ ...prev, [id]: 0 }));
    }
  };

  const totalBundleSize = Object.values(itemQtys).filter(q => q > 0).length;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Shopping Cart (Bulk Checkout)</h3>
            <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mt-0.5">{totalBundleSize} unique component(s) attached to bundle</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-8">
          {/* Left Column: Organization & Timing Details */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Organization / Club *</label>
                <input required type="text" value={formData.club} onChange={e => setFormData({...formData, club: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="e.g. IEEE Branch" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Borrower Name *</label>
                <input required type="text" value={formData.theirMember} onChange={e => setFormData({...formData, theirMember: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Borrower name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Borrower Email (Optional)</label>
                <input type="email" value={formData.borrowerEmail} onChange={e => setFormData({...formData, borrowerEmail: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="For overdue alerts" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Handler Name *</label>
                <input required type="text" value={formData.ourMember} onChange={e => setFormData({...formData, ourMember: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Handler name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Release Date *</label>
                <input required type="date" value={formData.lentOn} onChange={e => setFormData({...formData, lentOn: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Duration (Days) *</label>
                <input required type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="e.g. 7" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4" /> Return expected by: <strong className="text-slate-800 dark:text-slate-100">{getExpectedReturnDate()}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm h-12 resize-none focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Purpose, special conditions..."></textarea>
            </div>
          </div>

          {/* Right Column: Dynamic Item Selector */}
          <div className="flex-1 border-l border-white/20 dark:border-slate-700/50 pl-0 lg:pl-8 mt-6 lg:mt-0 flex flex-col h-[400px]">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Add Hardware to Cart</h4>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search components..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input bg-white/80 dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all shadow-sm"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {filteredItems.map(item => {
                const isActive = (itemQtys[item.id] || 0) > 0;
                const isOutOfStock = (item.availQty || 0) <= 0;
                
                return (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700' : 'bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800'} ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex-1 pr-3">
                      <div className={`text-sm font-semibold ${isActive ? 'text-brand-900 dark:text-brand-100' : 'text-slate-700 dark:text-slate-200'} truncate`}>{item.name}</div>
                      <div className={`text-xs ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>{item.availQty} available · {item.cat}</div>
                    </div>
                    
                    <div className="w-20">
                      <input 
                        type="number" 
                        min="0"
                        max={item.availQty || 0} 
                        disabled={isOutOfStock}
                        value={itemQtys[item.id] || 0} 
                        onChange={e => handleQtyChange(item.id, e.target.value)}
                        className={`w-full px-2 py-1.5 text-center rounded-lg text-sm font-medium focus:outline-none ${isActive ? 'bg-brand-500 text-white shadow-sm' : 'glass-input bg-slate-100 dark:bg-slate-700'} disabled:bg-slate-200 dark:disabled:bg-slate-800/50 disabled:text-slate-400`}
                      />
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                 <div className="p-4 text-center text-sm text-slate-500">No components match your search.</div>
              )}
            </div>
          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-white/20 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 mt-auto">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm bg-slate-100 dark:bg-slate-800">Cancel</button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]">Complete Checkout</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
