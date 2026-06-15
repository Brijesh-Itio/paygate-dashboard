import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Download, FileText, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, downloadBlob } from '../utils/helpers';
import { LoadingSpinner, PageHeader, StatCard } from '../components/common/UI';
import toast from 'react-hot-toast';

const periods = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function ReportsPage() {
  const [report, setReport] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);

    api.get(`/dashboard/revenue-report?${params}`)
      .then(res => { setReport(res.data.report); setStatusBreakdown(res.data.statusBreakdown); })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [period, dateRange]);

  const totalRevenue = report.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalTx = report.reduce((s, r) => s + (r.transactions || 0), 0);

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const params = new URLSearchParams({ status: 'all', ...dateRange });
      const res = await api.get(`/payments/export/csv?${params}`, { responseType: 'blob' });
      downloadBlob(res.data, `revenue-report-${period}-${Date.now()}.csv`);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
    finally { setExportingCSV(false); }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const params = new URLSearchParams({ period, ...dateRange });
      const res = await api.get(`/reports/export/pdf?${params}`, { responseType: 'blob' });
      downloadBlob(res.data, `report-${period}-${Date.now()}.pdf`);
      toast.success('PDF exported');
    } catch { toast.error('PDF export failed'); }
    finally { setExportingPDF(false); }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value} transactions`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Revenue analytics and transaction summaries"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} disabled={exportingCSV} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={14} />
              {exportingCSV ? 'Exporting...' : 'CSV'}
            </button>
            <button onClick={handleExportPDF} disabled={exportingPDF} className="btn-secondary text-sm flex items-center gap-2">
              <FileText size={14} />
              {exportingPDF ? 'Exporting...' : 'PDF'}
            </button>
          </div>
        }
      />

      {/* Controls */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${period === p.value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <input type="date" className="input-field w-auto text-xs" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} />
          <span className="text-slate-500 text-xs">to</span>
          <input type="date" className="input-field w-auto text-xs" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={BarChart3} color="green" />
        <StatCard label="Transactions" value={totalTx} color="blue" />
        <StatCard label="Avg per Transaction" value={totalTx ? formatCurrency(totalRevenue / totalTx) : '$0'} color="purple" />
        <StatCard label="Periods Tracked" value={report.length} color="amber" />
      </div>

      {loading ? <LoadingSpinner center /> : (
        <>
          {/* Revenue bar chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Revenue by Period</h3>
            {report.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No data for selected period</div>
            )}
          </div>

          {/* Transactions line chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Transaction Volume</h3>
            {report.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={report} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No data</div>
            )}
          </div>

          {/* Status breakdown table */}
          {statusBreakdown.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Transaction Summary by Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {['Status', 'Count', 'Total Amount', '% of Total'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statusBreakdown.map((row, i) => {
                      const pct = totalTx ? ((row.count / totalTx) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i} className="border-b border-slate-700/40">
                          <td className="px-4 py-2.5 capitalize text-white">{row.status?.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-2.5 text-slate-300">{row.count}</td>
                          <td className="px-4 py-2.5 text-slate-300">{formatCurrency(row.total)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-24">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-slate-400 text-xs">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
