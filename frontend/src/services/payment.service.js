import api from './api';
import { downloadBlob } from '../utils/helpers';

export const paymentService = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && v !== 'all' && query.set(k, v));
    const res = await api.get(`/payments?${query}`);
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/payments/${id}`);
    return res.data.payment;
  },

  async createIntent(data) {
    const res = await api.post('/payments/create-intent', data);
    return res.data;
  },

  async refund(paymentId, amount, reason) {
    const res = await api.post('/payments/refund', { paymentId, amount, reason });
    return res.data;
  },

  async exportCSV(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await api.get(`/payments/export/csv?${params}`, { responseType: 'blob' });
    downloadBlob(res.data, `payments-${Date.now()}.csv`);
  },
};

export const dashboardService = {
  async getStats(dateRange = {}) {
    const params = new URLSearchParams(dateRange);
    const res = await api.get(`/dashboard/stats?${params}`);
    return res.data;
  },

  async getRevenueReport(period = 'daily', dateRange = {}) {
    const params = new URLSearchParams({ period, ...dateRange });
    const res = await api.get(`/dashboard/revenue-report?${params}`);
    return res.data;
  },

  async getRecentTransactions() {
    const res = await api.get('/dashboard/recent-transactions');
    return res.data.transactions;
  },
};

export const reportService = {
  async exportPDF(params = {}) {
    const query = new URLSearchParams(params);
    const res = await api.get(`/reports/export/pdf?${query}`, { responseType: 'blob' });
    downloadBlob(res.data, `report-${Date.now()}.pdf`);
  },
};
