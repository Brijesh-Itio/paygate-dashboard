import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, User, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { StatusBadge, LoadingSpinner, PageHeader } from '../components/common/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function TimelineItem({ event, description, timestamp, isLast }) {
  const icons = {
    created: Clock, payment_succeeded: CheckCircle, payment_failed: XCircle,
    refund_initiated: RefreshCcw, charge_refunded: RefreshCcw, payment_processing: Clock,
    payment_canceled: XCircle, dispute_created: AlertCircle,
  };
  const colors = {
    created: 'text-blue-400 bg-blue-900/30', payment_succeeded: 'text-emerald-400 bg-emerald-900/30',
    payment_failed: 'text-red-400 bg-red-900/30', refund_initiated: 'text-purple-400 bg-purple-900/30',
    charge_refunded: 'text-purple-400 bg-purple-900/30', payment_processing: 'text-amber-400 bg-amber-900/30',
    payment_canceled: 'text-slate-400 bg-slate-700/30', dispute_created: 'text-red-400 bg-red-900/30',
  };
  const Icon = icons[event] || Clock;
  const color = colors[event] || 'text-slate-400 bg-slate-700/30';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={14} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-700 mt-1" />}
      </div>
      <div className="pb-5 min-w-0">
        <p className="text-sm font-medium text-white capitalize">{event.replace(/_/g, ' ')}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        <p className="text-xs text-slate-500 mt-1">{formatDate(timestamp)}</p>
      </div>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: 'requested_by_customer' });
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    api.get(`/payments/${id}`)
      .then(res => setPayment(res.data.payment))
      .catch(() => toast.error('Payment not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefund = async () => {
    setRefunding(true);
    try {
      const res = await api.post('/payments/refund', {
        paymentId: id,
        amount: refundForm.amount ? parseFloat(refundForm.amount) : undefined,
        reason: refundForm.reason,
      });
      setPayment(res.data.payment);
      setRefundModal(false);
      toast.success('Refund initiated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  if (loading) return <LoadingSpinner center size="lg" />;
  if (!payment) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Payment not found</p>
      <button onClick={() => navigate('/payments')} className="btn-secondary mt-4 text-sm">Back to payments</button>
    </div>
  );

  const canRefund = isAdmin && ['succeeded', 'partially_refunded'].includes(payment.status);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/payments')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title="Payment Details"
          description={`Transaction ${payment.paymentIntentId}`}
          actions={canRefund && (
            <button onClick={() => setRefundModal(true)} className="btn-danger text-sm flex items-center gap-2">
              <RefreshCcw size={14} />
              Issue Refund
            </button>
          )}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Payment summary */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-white">{formatCurrency(payment.amount / 100, payment.currency)}</div>
                <div className="text-slate-400 text-sm mt-1">{payment.currency}</div>
              </div>
              <StatusBadge status={payment.status} />
            </div>
            {payment.description && (
              <p className="text-slate-300 text-sm border-t border-slate-700 pt-3">{payment.description}</p>
            )}
          </div>

          {/* Customer info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <User size={15} className="text-blue-400" />
              Customer Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['Payment ID', payment._id], 
                ['Name', payment.customerName],
                ['Email', payment.customerEmail],
                ['Payment Method', payment.cardBrand && payment.last4 ? `${payment.cardBrand} ••••${payment.last4}` : payment.paymentMethodType || 'Card'],
                ['Created', formatDate(payment.createdAt)],
                payment.paidAt && ['Paid At', formatDate(payment.paidAt)],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stripe data */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-blue-400" />
              Stripe Transaction Data
            </h3>
            <div className="space-y-2">
              {[
                ['Stripe Transaction ID', payment.paymentIntentId],
                payment.failureCode && ['Failure Code', payment.failureCode],
                payment.failureMessage && ['Failure Message', payment.failureMessage],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
                  <span className="text-xs text-white font-mono text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Refunds */}
          {payment.refunds?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Refund History</h3>
              {payment.refunds.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
                  <div>
                    <p className="text-sm text-white">{formatCurrency(r.amount / 100)}</p>
                    <p className="text-xs text-slate-400">{r.reason} · {formatDate(r.createdAt)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Payment Timeline</h3>
          {payment.timeline?.length > 0 ? (
            <div>
              {payment.timeline.map((event, i) => (
                <TimelineItem
                  key={i}
                  {...event}
                  isLast={i === payment.timeline.length - 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No timeline events</p>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-semibold text-white mb-4">Issue Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Amount (leave blank for full refund)</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  min="0"
                  max={payment.amount / 100}
                  placeholder={`Max: ${formatCurrency(payment.amount / 100)}`}
                  value={refundForm.amount}
                  onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Reason</label>
                <select
                  className="input-field"
                  value={refundForm.reason}
                  onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))}
                >
                  <option value="requested_by_customer">Requested by customer</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="fraudulent">Fraudulent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRefundModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleRefund} disabled={refunding} className="btn-danger flex-1 text-sm">
                {refunding ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
