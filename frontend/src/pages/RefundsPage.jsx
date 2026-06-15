import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { StatusBadge, LoadingSpinner, EmptyState, PageHeader } from '../components/common/UI';
import toast from 'react-hot-toast';

export default function RefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/refunds?page=${page}&limit=20`)
      .then(res => { setRefunds(res.data.refunds); setPagination(res.data.pagination); })
      .catch(() => toast.error('Failed to load refunds'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-5">
      <PageHeader title="Refunds" description={`${pagination.total} refund records`} />

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner center />
        ) : refunds.length === 0 ? (
          <EmptyState icon={RefreshCcw} title="No refunds yet" description="Refunds issued from payment details will appear here" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    {['Refund ID', 'Payment', 'Customer', 'Amount', 'Reason', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-700/40 hover:bg-slate-700/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/payments/${r.payment?.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.stripeRefundId?.slice(-14) || r.refundId?.slice(-14)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.payment?.paymentIntentId?.slice(-12)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-white">{r.payment?.customerName}</div>
                        <div className="text-xs text-slate-400">{r.payment?.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{formatCurrency(r.amount / 100)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs capitalize">{r.reason?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <span className="text-xs text-slate-400">{pagination.total} total refunds</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-400 px-2">Page {page} of {pagination.totalPages}</span>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
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
