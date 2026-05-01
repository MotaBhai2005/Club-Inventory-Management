"use client";
import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import AddItemModal from "./Modals/AddItemModal";
import * as api from "@/services/api";
import { Item } from "@/types";

interface InventoryTabProps {
  items: Item[];
  onRefresh: () => void;
  isAdmin?: boolean;
}

export default function InventoryTab({ items, onRefresh, isAdmin = true }: InventoryTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const categories = ["All", ...Array.from(new Set(items.map(i => i.cat)))];

  const filteredItems = items.filter(i => 
    (filter === "All" || i.cat === filter) && 
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.cat.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = async (id: number) => {
    if (confirm("Delete this item? This cannot be undone.")) {
      try {
        await api.deleteItem(id);
        onRefresh();
      } catch (err: any) {
        alert(err.response?.data?.error || "Error deleting item");
      }
    }
  };

  const handleDownloadExcel = () => {
    const data = filteredItems.map(item => ({
      "ID": item.id,
      "Item Name": item.name,
      "Category": item.cat,
      "Total Quantity": item.qty,
      "Available Quantity": item.availQty,
      "Lent Quantity": item.lentQty || 0,
      "Condition": item.cond || "Good",
      "Description": item.desc || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns for better organization
    worksheet["!cols"] = [
      { wch: 6 },  // ID
      { wch: 35 }, // Item Name
      { wch: 18 }, // Category
      { wch: 15 }, // Total Qty
      { wch: 18 }, // Avail Qty
      { wch: 15 }, // Lent Qty
      { wch: 15 }, // Condition
      { wch: 50 }, // Description
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    XLSX.writeFile(workbook, `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{isAdmin ? "All Items" : "Available Items"}</h2>
        {isAdmin && (
          <div className="flex gap-3">
            <button 
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button 
              onClick={() => { setEditItem(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input bg-white/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === c 
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30" 
                  : "bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-white/20 dark:border-slate-700/50">
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qty</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              {isAdmin && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
            {filteredItems.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-sm text-slate-500 font-medium">No items found</td></tr>
            ) : filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-300 group">
                <td className="p-4">
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{item.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.desc}</div>
                </td>
                <td className="p-4"><span className="px-2.5 py-1 bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300">{item.cat}</span></td>
                <td className="p-4 text-sm font-medium">{item.qty}</td>
                <td className="p-4 text-sm font-medium">
                  {item.availQty} <span className="text-xs text-slate-400 font-normal">{(item.lentQty ?? 0) > 0 && `(${item.lentQty} lent)`}</span>
                </td>
                <td className="p-4">
                  {item.cond === 'Needs Repair' ? (
                    <span className="inline-flex items-center px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-500/30 rounded-full text-xs font-bold shadow-sm">Maintenance</span>
                  ) : (item.availQty ?? 0) > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-500/30 rounded-full text-xs font-bold shadow-sm">Available</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/30 rounded-full text-xs font-bold shadow-sm">All Lent</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => { setEditItem(item); setModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddItemModal 
          onClose={() => setModalOpen(false)} 
          onSave={onRefresh} 
          item={editItem} 
        />
      )}
    </div>
  );
}
