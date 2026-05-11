import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import * as api from "@/services/api";
import { Item } from "@/types";

interface AddItemModalProps {
  onClose: () => void;
  onSave: () => void;
  item: Item | null;
  existingItems?: Item[];
}

export default function AddItemModal({ onClose, onSave, item, existingItems = [] }: AddItemModalProps) {
  const [formData, setFormData] = useState({
    name: "", cat: "", qty: 1, desc: "", cond: "Good"
  });
  const [editingExistingItemId, setEditingExistingItemId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item) setFormData({ 
      name: item.name, 
      cat: item.cat, 
      qty: item.qty, 
      desc: item.desc || "", 
      cond: item.cond || "Good" 
    });
  }, [item]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = formData.name && !editingExistingItemId && !item && existingItems.length > 0
    ? existingItems.filter(i => i.name.toLowerCase().includes(formData.name.toLowerCase())).slice(0, 5)
    : [];

  const handleSuggestionClick = (suggestion: Item) => {
    setFormData({
      name: suggestion.name,
      cat: suggestion.cat,
      qty: suggestion.qty,
      desc: suggestion.desc || "",
      cond: suggestion.cond || "Good"
    });
    setEditingExistingItemId(suggestion.id);
    setShowSuggestions(false);
  };

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
      if (item) {
        await api.updateItem(item.id, formData);
      } else if (editingExistingItemId) {
        await api.updateItem(editingExistingItemId, formData);
      } else {
        await api.addItem(formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "An error occurred");
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{item ? 'Edit Item' : editingExistingItemId ? 'Update Existing Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            <div className="relative" ref={wrapperRef}>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Item Name *</label>
              <input required type="text" value={formData.name} onChange={e => {
                setFormData({...formData, name: e.target.value});
                setEditingExistingItemId(null);
                setShowSuggestions(true);
              }} onFocus={() => setShowSuggestions(true)} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="e.g. Arduino Uno R3" />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{suggestion.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{suggestion.cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Category *</label>
                <select required value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none">
                  <option value="">Select category</option>
                  <option>Electronics</option>
                  <option>Hardware</option>
                  <option>Accessories</option>
                  <option>Tools</option>
                  <option>Sensors</option>
                  <option>Cables & Connectors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Quantity *</label>
                <input required type="number" min="1" value={formData.qty || ''} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Description / Notes</label>
              <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm h-20 resize-none focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="Specs, condition, location..."></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Condition</label>
              <select value={formData.cond} onChange={e => setFormData({...formData, cond: e.target.value})} className="w-full px-3 py-2 rounded-lg glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none">
                <option>Good</option>
                <option>Fair</option>
                <option>Needs Repair</option>
              </select>
            </div>
          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-white/20 dark:border-slate-700/50 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/30 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-colors w-full sm:w-auto">Save Item</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
