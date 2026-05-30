import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totals: {}, charts: {} });
  const [salesTrend, setSalesTrend] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsResponse, salesResponse] = await Promise.all([
          api.get('/products/analytics'),
          api.get('/reports/sales'),
        ]);

        setAnalytics(analyticsResponse.data);
        setSalesTrend(salesResponse.data.salesTrend || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Total stock</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(analytics.totals.totalStockCount || 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Inventory value</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.totals.totalInventoryValue || 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Low stock</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(analytics.totals.lowStockCount || 0)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Date-wise sales report</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Sales trend snapshot</h2>
          </div>
        </div>

        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Bar radius={[8, 8, 0, 0]} dataKey="sold" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profit / loss summary</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 hover:shadow-sm transition-all">
            <p className="text-sm text-emerald-700 dark:text-emerald-100 font-semibold">Total profit</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-white">{formatCurrency(analytics.totals.totalProfit || 0)}</p>
          </div>
          <div className="rounded-xl border border-rose-300 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-500/10 p-4 hover:shadow-sm transition-all">
            <p className="text-sm text-rose-700 dark:text-rose-100 font-semibold">Total loss</p>
            <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-white">{formatCurrency(analytics.totals.totalLoss || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;