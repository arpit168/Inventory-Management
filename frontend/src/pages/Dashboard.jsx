import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleDollarSign, Package, Truck, Warehouse } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';

const statCards = [
  { key: 'totalProducts', label: 'Total products', icon: Package, accent: 'from-cyan-100 to-cyan-50 dark:from-cyan-400/40 dark:to-cyan-500/10', textColor: 'text-slate-900 dark:text-white' },
  { key: 'totalInventoryValue', label: 'Inventory value', icon: CircleDollarSign, accent: 'from-emerald-100 to-emerald-50 dark:from-emerald-400/40 dark:to-emerald-500/10', textColor: 'text-slate-900 dark:text-white' },
  { key: 'totalStockCount', label: 'Stock count', icon: Warehouse, accent: 'from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-400/40 dark:to-fuchsia-500/10', textColor: 'text-slate-900 dark:text-white' },
  { key: 'outOfStockCount', label: 'Out of stock', icon: Truck, accent: 'from-amber-100 to-amber-50 dark:from-amber-400/40 dark:to-amber-500/10', textColor: 'text-slate-900 dark:text-white' },
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totals: {}, charts: {}, recentActivity: [] });
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

  const pieData = useMemo(() => {
    const statusData = analytics.charts?.statusData || [];
    return statusData.map((item) => ({ name: item.name, value: item.value }));
  }, [analytics]);

  const categoryData = useMemo(() => {
    const data = analytics.charts?.categoryData || {};
    return Object.entries(data).map(([name, value]) => ({ name, value: Number(value) }));
  }, [analytics]);

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, accent, textColor }) => (
          <div
            key={key}
            className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br ${accent} p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm text-slate-600 dark:text-slate-200 font-medium`}>{label}</p>
                <p className={`mt-3 text-2xl font-bold ${textColor}`}>
                  {key === 'totalInventoryValue' || key === 'totalProfit' || key === 'totalLoss'
                    ? formatCurrency(analytics.totals[key] || 0)
                    : formatNumber(analytics.totals[key] || 0)}
                </p>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-white/10 p-3">
                <Icon className="text-slate-700 dark:text-white/80" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Profit & loss snapshot</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Overall performance</h3>
            </div>
            <div className="rounded-full border border-emerald-300 dark:border-emerald-400/40 bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-100 font-semibold">
              Profit {formatCurrency(analytics.totals.totalProfit || 0)}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-100 font-semibold">Total profit</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-white">{formatCurrency(analytics.totals.totalProfit || 0)}</p>
            </div>
            <div className="rounded-xl border border-rose-300 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-500/10 p-4">
              <p className="text-sm text-rose-700 dark:text-rose-100 font-semibold">Total loss</p>
              <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-white">{formatCurrency(analytics.totals.totalLoss || 0)}</p>
            </div>
          </div>

          <div className="mt-6 h-72 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="sold" radius={[8, 8, 0, 0]} fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Stock mix</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Stock distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={45} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? '#22d3ee' : '#fb7185'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition">
                <span>{item.name}</span>
                <span className="font-semibold">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Recent activity</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Live product activities</h3>
            </div>
            <Link to="/products" className="text-sm text-cyan-600 dark:text-cyan-200 hover:text-cyan-700 dark:hover:text-cyan-100 font-semibold flex items-center gap-1 transition">
              Manage products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {(analytics.recentActivity || []).map((item, index) => (
              <div key={`${item.product}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/10 transition">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.product}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.quantityDelta > 0 ? '+' : ''}{item.quantityDelta}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Category analysis</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Category stock</h3>

          <div className="mt-4 h-64 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Low stock items</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{analytics.totals.lowStockCount || 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Stock alerts</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{analytics.totals.outOfStockCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
