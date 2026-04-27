import { useState, useEffect } from "react";
import { Plus, Eye } from "lucide-react";
import { Request } from "@/types";
import RequestModal from "./Modals/RequestModal";
import * as api from "@/services/api";

interface RequestsTabProps {
  isAdmin?: boolean;
}

export default function RequestsTab({ isAdmin = false }: RequestsTabProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  const openNewRequestModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(true);
  };

  const openRequestDetails = (req: Request) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Requests</h2>
        <div className="flex gap-3">
          {!isAdmin && (
            <button
              onClick={openNewRequestModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-lg shadow-brand-500/30 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                {isAdmin && <th className="p-4">User</th>}
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{req.title}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{req.type.replace('_', ' ')}</td>
                  {isAdmin && <td className="p-4 text-slate-600 dark:text-slate-400">{req.user?.username}</td>}
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      req.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      req.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openRequestDetails(req)}
                      className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        request={selectedRequest}
        onRefresh={loadRequests}
        isAdmin={isAdmin}
      />
    </div>
  );
}
