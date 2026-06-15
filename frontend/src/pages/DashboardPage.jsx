import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CreditCard, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatDateShort } from '../utils/helpers';
import { StatCard, StatusBadge, LoadingSpinner, PageHeader } from '../components/common/UI';
import toast from 'react-hot-toast';

const PIE_COLORS = { succeeded: '#10b981', failed: '#ef4444', pending: '#f59e0b', processing: '#3b82f6', refunded: '#a855f7', canceled: '#64748b' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white text-sm font-semibold">{formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, recentRes, reportRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-transactions'),
          api.get('/dashboard/revenue-report?period=daily'),
        ]);
        setStats(statsRes.data.stats);
        setDailyRevenue(statsRes.data.dailyRevenue);
        setRecentTx(recentRes.data.transactions);    
        setStatusBreakdown(reportRes.data.statusBreakdown || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner center size="lg" />;

  const statCards = [
    { label: 'Total Transactions', value: stats?.totalTransactions || 0, icon: CreditCard, color: 'blue', sub: 'All time' },
    { label: 'Successful', value: stats?.successfulPayments || 0, icon: CheckCircle, color: 'green', sub: 'Completed payments' },
    { label: 'Failed', value: stats?.failedPayments || 0, icon: XCircle, color: 'red', sub: 'Requires attention' },
    { label: 'Pending', value: stats?.pendingPayments || 0, icon: Clock, color: 'amber', sub: 'Awaiting processing' },
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'green', sub: 'Net collected' },
    { label: 'Refunded', value: formatCurrency(stats?.totalRefunded || 0), icon: TrendingUp, color: 'purple', sub: 'Total refunds issued' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Real-time payment overview" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">Revenue (Last 7 Days)</h2>
          </div>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatDateShort} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No revenue data yet</div>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-white text-sm mb-4">Payment Status</h2>
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75} strokeWidth={2} stroke="#1e293b">
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[entry.status] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name.charAt(0).toUpperCase() + name.slice(1)]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend formatter={val => <span className="text-xs text-slate-300 capitalize">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="font-semibold text-white text-sm">Recent Transactions</h2>
          <button onClick={() => navigate('/payments')} className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Transaction ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTx.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No transactions yet</td></tr>
              ) : recentTx.map(tx => (
                <tr
                  key={tx._id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/payments/${tx._id}`)}
                >
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{tx.paymentIntentId?.slice(-12)}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-white text-xs">{tx.customerName}</div>
                    <div className="text-slate-400 text-xs">{tx.customerEmail}</div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-white">{formatCurrency(tx.amount / 100, tx.currency)}</td>
                  <td className="px-5 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
