import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Link as LinkIcon, Save, CheckCircle, XCircle } from "lucide-react";
import { Request } from "@/types";
import * as api from "@/services/api";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onRefresh: () => void;
  isAdmin: boolean;
}

export default function RequestModal({ isOpen, onClose, request, onRefresh, isAdmin }: RequestModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("COMPONENT");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState<{ itemName: string; quantity: number; notes: string }[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setTitle(request.title);
      setType(request.type);
      setPriority(request.priority);
      setDescription(request.description || "");
      setDeadline(request.deadline || "");
      setItems(request.items.map(i => ({ itemName: i.itemName, quantity: i.quantity, notes: i.notes || "" })));
      setLinks(request.inspirationLinks || []);
      setAdminNotes(request.adminNotes || "");
    } else {
      setTitle("");
      setType("COMPONENT");
      setPriority("MEDIUM");
      setDescription("");
      setDeadline("");
      setItems([{ itemName: "", quantity: 1, notes: "" }]);
      setLinks([]);
      setAdminNotes("");
    }
  }, [request, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { itemName: "", quantity: 1, notes: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as any;
    setItems(newItems);
  };

  const handleAddLink = () => {
    setLinks([...links, ""]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (request && isAdmin) {
        // Admin updating an existing request
        await api.updateRequest(request.id, {
          deadline,
          items
        });
      } else if (!request) {
        // Member creating a new request
        await api.createRequest({
          title,
          type,
          priority,
          description,
          deadline,
          inspirationLinks: links.filter(l => l.trim() !== ""),
          items: items.filter(i => i.itemName.trim() !== "")
        });
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    setIsSubmitting(true);
    try {
      await api.updateRequestStatus(request.id, {
        status: newStatus,
        adminNotes
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = !!request && !isAdmin;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {request ? (isAdmin ? "Review Request" : "Request Details") : "New Request"}
            </h2>
            {request && (
              <p className="text-sm text-slate-500 mt-1">
                Status: <strong className="uppercase">{request.status}</strong>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="requestForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  disabled={isReadOnly || (!!request && isAdmin)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                  placeholder="E.g., Raspberry Pi 4 for Robotics"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  disabled={isReadOnly || (!!request && isAdmin)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                >
                  <option value="COMPONENT">Component</option>
                  <option value="BULK_ORDER">Bulk Order</option>
                  <option value="PROJECT_IDEA">Project Idea</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isReadOnly || (!!request && isAdmin)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deadline (Optional)</label>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                disabled={isReadOnly || (!!request && isAdmin)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                placeholder="Why do you need this?"
              />
            </div>

            {/* Inspiration Links */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Inspiration / Reference Links</label>
                {(!request) && (
                  <button type="button" onClick={handleAddLink} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                    <input 
                      type="url" 
                      value={link} 
                      onChange={(e) => handleLinkChange(index, e.target.value)} 
                      disabled={isReadOnly || (!!request && isAdmin)}
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none disabled:opacity-50"
                      placeholder="https://example.com"
                    />
                    {(!request) && (
                      <button type="button" onClick={() => handleRemoveLink(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {links.length === 0 && <p className="text-xs text-slate-400 italic">No links added.</p>}
              </div>
            </div>

            {/* Requested Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Items</label>
                {(!isReadOnly) && (
                  <button type="button" onClick={handleAddItem} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex-1 w-full">
                      <input 
                        type="text" 
                        value={item.itemName} 
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} 
                        disabled={isReadOnly}
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none disabled:opacity-50"
                        placeholder="Item Name"
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} 
                        disabled={isReadOnly}
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none disabled:opacity-50"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <input 
                        type="text" 
                        value={item.notes} 
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)} 
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none disabled:opacity-50"
                        placeholder="Notes (optional)"
                      />
                    </div>
                    {(!isReadOnly) && items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-end sm:self-auto">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes Section */}
            {(isAdmin || (request && request.adminNotes)) && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin Notes</label>
                <textarea 
                  value={adminNotes} 
                  onChange={(e) => setAdminNotes(e.target.value)} 
                  disabled={!isAdmin}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                  placeholder="Add notes or rejection reason..."
                />
              </div>
            )}
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-4">
          <div>
            {isAdmin && request && request.status === "PENDING" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange("APPROVED")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("REJECTED")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Close
            </button>
            {(!request || isAdmin) && (
              <button
                type="submit"
                form="requestForm"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : (request ? "Save Changes" : "Submit Request")}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
