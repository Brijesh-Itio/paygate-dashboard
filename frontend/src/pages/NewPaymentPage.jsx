import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import { PageHeader } from '../components/common/UI';
import toast from 'react-hot-toast';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      '::placeholder': { color: '#64748b' },
      iconColor: '#94a3b8',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  }
};

function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: '', customerEmail: '', amount: '', currency: 'usd', description: '' });
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!form.customerName || !form.customerEmail || !form.amount) return toast.error('Fill in all required fields');

    setLoading(true);
    setCardError('');

    try {
      // 1. Create payment intent
      const { data } = await api.post('/payments/create-intent', {
        amount: parseFloat(form.amount),
        currency: form.currency,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        description: form.description,
      });

      // 2. Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: form.customerName, email: form.customerEmail },
        }
      });

      if (error) {
        setCardError(error.message);
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment processed successfully!');
        navigate(`/payments/${data.payment._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Customer Details</h3>
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Full Name *</label>
          <input className="input-field" placeholder="John Doe" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Email *</label>
          <input className="input-field" type="email" placeholder="john@example.com" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Payment Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Amount *</label>
            <input className="input-field" type="number" step="0.01" min="0.5" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Currency</label>
            <select className="input-field" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['usd', 'eur', 'gbp', 'inr', 'cad', 'aud'].map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Description</label>
          <input className="input-field" placeholder="Product or service description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <CreditCard size={15} className="text-blue-400" />
          Card Information
        </h3>
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} onChange={e => setCardError(e.error?.message || '')} />
        </div>
        {cardError && <p className="text-red-400 text-xs">{cardError}</p>}
        <p className="text-xs text-slate-500">Test card: 4242 4242 4242 4242 · Any future date · Any CVC</p>
      </div>

      <button type="submit" className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2" disabled={!stripe || loading}>
        {loading ? <><Loader size={16} className="animate-spin" /> Processing...</> : `Charge ${form.amount ? `$${parseFloat(form.amount).toFixed(2)}` : ''}`}
      </button>
    </form>
  );
}

export default function NewPaymentPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/payments')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <PageHeader title="New Payment" description="Process a card payment via Stripe" />
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
