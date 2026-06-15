import React from 'react';
import { CheckCircle, XCircle, Clock, RefreshCcw, AlertCircle, Loader } from 'lucide-react';

const statusConfig = {
  succeeded: { label: 'Succeeded', bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-700/50', icon: CheckCircle },
  failed: { label: 'Failed', bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-700/50', icon: XCircle },
  pending: { label: 'Pending', bg: 'bg-amber-900/40', text: 'text-amber-400', border: 'border-amber-700/50', icon: Clock },
  processing: { label: 'Processing', bg: 'bg-blue-900/40', text: 'text-blue-400', border: 'border-blue-700/50', icon: Loader },
  refunded: { label: 'Refunded', bg: 'bg-purple-900/40', text: 'text-purple-400', border: 'border-purple-700/50', icon: RefreshCcw },
  partially_refunded: { label: 'Partial Refund', bg: 'bg-orange-900/40', text: 'text-orange-400', border: 'border-orange-700/50', icon: RefreshCcw },
  canceled: { label: 'Canceled', bg: 'bg-slate-700/60', text: 'text-slate-400', border: 'border-slate-600', icon: XCircle },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`status-badge border ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}

export function LoadingSpinner({ size = 'md', center = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  const spinner = <div className={`${sizes[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`} />;
  if (center) return <div className="flex justify-center items-center py-12">{spinner}</div>;
  return spinner;
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <h3 className="text-base font-medium text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-600/30',
    green: 'from-emerald-600/20 to-emerald-600/5 border-emerald-600/30',
    red: 'from-red-600/20 to-red-600/5 border-red-600/30',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-600/30',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-600/30',
  };
  const iconColors = {
    blue: 'bg-blue-600/20 text-blue-400',
    green: 'bg-emerald-600/20 text-emerald-400',
    red: 'bg-red-600/20 text-red-400',
    amber: 'bg-amber-600/20 text-amber-400',
    purple: 'bg-purple-600/20 text-purple-400',
  };
  return (
    <div className={`card bg-gradient-to-br ${colors[color]} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
