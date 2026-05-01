import { History } from "@/types";

interface HistoryTabProps {
  history: History[];
}

export default function HistoryTab({ history }: HistoryTabProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Lending History</h2>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-white/20 dark:border-slate-700/50">
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lent To</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Members</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lent On</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Returned On</th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
            {history.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-sm text-slate-500">No lending history yet.</td></tr>
            ) : history.map(h => (
              <tr key={h.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{h.itemName || 'Unknown'}</div>
                  <div className="text-xs text-slate-500">Qty: {h.qty}</div>
                </td>
                <td className="p-4 text-sm font-medium">{h.club}</td>
                <td className="p-4">
                  <div className="text-sm">{h.theirMember} <span className="text-slate-400 text-xs">(Borrower)</span></div>
                  <div className="text-sm">{h.ourMember} <span className="text-slate-400 text-xs">(Handler)</span></div>
                </td>
                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(h.lentOn)}</td>
                <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(h.returnedOn)}</td>
                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{h.duration} day(s)</span>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
