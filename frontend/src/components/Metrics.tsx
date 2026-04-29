import { Layers, Box, Activity, AlertCircle, LucideIcon } from "lucide-react";
import { DashboardMetrics } from "@/types";

interface MetricsProps {
  metrics: DashboardMetrics | null;
}

export default function MetricsComp({ metrics }: MetricsProps) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <MetricCard 
        label="Unique Items" 
        value={metrics.uniqueItems} 
        icon={Layers} 
        valueColor="text-[#185FA5] dark:text-[#2589e6]"
        iconBg="bg-[#185FA5]/10 dark:bg-[#185FA5]/20"
        iconColor="text-[#185FA5] dark:text-[#2589e6]"
      />
      <MetricCard 
        label="Total Units" 
        value={metrics.totalUnits} 
        icon={Box} 
        valueColor="text-slate-800 dark:text-slate-200"
        iconBg="bg-slate-100 dark:bg-slate-800/80"
        iconColor="text-slate-500 dark:text-slate-300"
      />
      <MetricCard 
        label="Active Lendings" 
        value={metrics.activeLendings} 
        icon={Activity} 
        valueColor="text-amber-500"
        iconBg="bg-amber-500/10 dark:bg-amber-500/10"
        iconColor="text-amber-500"
      />
      <MetricCard 
        label="Overdue" 
        value={metrics.overdue} 
        icon={AlertCircle} 
        valueColor="text-red-500 dark:text-red-400"
        iconBg="bg-red-500/10 dark:bg-red-500/10"
        iconColor="text-red-500 dark:text-red-400"
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  valueColor: string;
  iconBg: string;
  iconColor: string;
}

function MetricCard({ label, value, icon: Icon, valueColor, iconBg, iconColor }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-[#0b1121] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:shadow-lg dark:hover:border-slate-700">
      <div className="flex flex-col gap-1.5">
        <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</span>
        <span className={`text-4xl font-black tracking-tight ${valueColor}`}>{value || 0}</span>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}
