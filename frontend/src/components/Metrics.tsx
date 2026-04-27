import { Layers, Box, Activity, AlertCircle, LucideIcon } from "lucide-react";
import { DashboardMetrics } from "@/types";

interface MetricsProps {
  metrics: DashboardMetrics | null;
}

export default function MetricsComp({ metrics }: MetricsProps) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <MetricCard 
        label="Unique Items" 
        value={metrics.uniqueItems} 
        icon={Layers} 
        colorClass="text-brand-500"
        bgClass="bg-brand-50 dark:bg-brand-500/10"
      />
      <MetricCard 
        label="Total Units" 
        value={metrics.totalUnits} 
        icon={Box} 
        colorClass="text-slate-700 dark:text-slate-200"
        bgClass="bg-slate-50 dark:bg-slate-800/50"
      />
      <MetricCard 
        label="Active Lendings" 
        value={metrics.activeLendings} 
        icon={Activity} 
        colorClass="text-amber-600 dark:text-amber-400"
        bgClass="bg-amber-50 dark:bg-amber-400/10"
      />
      <MetricCard 
        label="Overdue" 
        value={metrics.overdue} 
        icon={AlertCircle} 
        colorClass="text-red-600 dark:text-red-400"
        bgClass="bg-red-50 dark:bg-red-400/10"
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

function MetricCard({ label, value, icon: Icon, colorClass, bgClass }: MetricCardProps) {
  return (
    <div className={`glass-card p-5 flex items-center justify-between group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl border border-white/40 dark:border-slate-700/50 relative overflow-hidden`}>
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:opacity-30 group-hover:scale-110 ${bgClass}`} />
      
      <div className="relative z-10">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
          {label}
        </div>
        <div className={`text-4xl font-black tracking-tighter ${colorClass}`}>
          {value || 0}
        </div>
      </div>
      <div className={`relative z-10 p-4 rounded-2xl ${bgClass} transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm border border-white/50 dark:border-slate-600/30`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );
}
