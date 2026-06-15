import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export function usePayments(initialFilters = {}) {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all', startDate: '', endDate: '', ...initialFilters });
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => v && v !== 'all' && params.set(k, v));
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

  const updateFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', startDate: '', endDate: '' });
    setPage(1);
  }, []);

  return { payments, pagination, loading, filters, page, setPage, updateFilter, resetFilters, refetch: fetchPayments };
}

export function usePaymentDetail(id) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/payments/${id}`);
      setPayment(res.data.payment);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPayment(); }, [fetchPayment]);

  return { payment, loading, error, setPayment, refetch: fetchPayment };
}
