import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useDashboardStats(dateRange = {}) {
  const [stats, setStats] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange.startDate) params.set('startDate', dateRange.startDate);
    if (dateRange.endDate) params.set('endDate', dateRange.endDate);
    api.get(`/dashboard/stats?${params}`)
      .then(res => { setStats(res.data.stats); setDailyRevenue(res.data.dailyRevenue); })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  return { stats, dailyRevenue, loading };
}

export function useRevenueReport(period = 'daily', dateRange = {}) {
  const [report, setReport] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (dateRange.startDate) params.set('startDate', dateRange.startDate);
    if (dateRange.endDate) params.set('endDate', dateRange.endDate);
    api.get(`/dashboard/revenue-report?${params}`)
      .then(res => { setReport(res.data.report); setStatusBreakdown(res.data.statusBreakdown || []); })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [period, dateRange.startDate, dateRange.endDate]);

  return { report, statusBreakdown, loading };
}
