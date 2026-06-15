import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, downloadBlob } from '../utils/helpers';
import { StatusBadge, LoadingSpinner, EmptyState, PageHeader } from '../components/common/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';

const STATUSES = ['all', 'pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'canceled'];

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...filters });
      Object.keys(filters).forEach(k => !filters[k] && params.delete(k));
      const res = await api.get(`/payments?${params}`);
      setPayments(res.data.payments);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await api.get(`/payments/export/csv?${params}`, { responseType: 'blob' });
      downloadBlob(res.data, `payments-${Date.now()}.csv`);
      toast.success('CSV exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description={`${pagination.total} total transactions`}
        actions={
          <>
            {isAdmin && (
              <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm flex items-center gap-2">
                <Download size={15} />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            )}
            {isAdmin && (
              <button onClick={() => navigate('/payments/new')} className="btn-primary text-sm flex items-center gap-2">
                <Plus size={15} />
                New Payment
              </button>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by name, email, or transaction ID..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
            ))}
          </select>
          <input type="date" className="input-field w-auto" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
          <input type="date" className="input-field w-auto" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner center />
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments found" description="Adjust your filters or create a new payment" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    {['Transaction ID', 'Customer', 'Amount', 'Method', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr
                      key={p._id}
                      className="border-b border-slate-700/40 hover:bg-slate-700/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/payments/${p._id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-400">{p.paymentIntentId?.slice(-14)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-xs">{p.customerName}</div>
                        <div className="text-slate-400 text-xs">{p.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{formatCurrency(p.amount / 100, p.currency)}</span>
                        <span className="text-slate-500 text-xs ml-1">{p.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs capitalize">
                        {p.cardBrand && p.last4 ? `${p.cardBrand} ••${p.last4}` : p.paymentMethodType || 'card'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className="text-slate-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <span className="text-xs text-slate-400">
                Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-400 px-2">Page {page} of {pagination.totalPages}</span>
                <button
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
