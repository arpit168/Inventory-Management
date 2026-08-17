import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleDollarSign, Package, Truck, Warehouse, BookOpen, Wallet, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';

const statCards = [
  { key: 'totalProducts', label: 'Total products', icon: Package, badgeBg: 'bg-primary/15 text-primary' },
  { key: 'totalInventoryValue', label: 'Inventory value', icon: CircleDollarSign, badgeBg: 'bg-success/15 text-success' },
  { key: 'totalStockCount', label: 'Stock count', icon: Warehouse, badgeBg: 'bg-info/15 text-info' },
  { key: 'outOfStockCount', label: 'Out of stock', icon: Truck, badgeBg: 'bg-warning/15 text-warning' },
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totals: {}, charts: {}, recentActivity: [] });
  const [financials, setFinancials] = useState({ ledger: {}, expenses: {} });

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsResponse, , customersResponse, expensesResponse] = await Promise.all([
          api.get('/products/analytics'),
          api.get('/reports/sales'),
          api.get('/customers').catch(() => ({ data: { summary: {} } })),
          api.get('/expenses').catch(() => ({ data: { summary: {} } })),
        ]);

        setAnalytics(analyticsResponse.data);
        setFinancials({
          ledger: customersResponse.data?.summary || {},
          expenses: expensesResponse.data?.summary || {},
        });
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
    <div className="space-y-8 animate-fade-in">
      
      {/* Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, badgeBg }) => (
          <div
            key={key}
            className="rounded-2xl border border-border bg-surface p-6 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-text-muted">{label}</p>
                <p className="mt-2 text-2xl font-black text-text">
                  {key === 'totalInventoryValue'
                    ? formatCurrency(analytics.totals[key] || 0)
                    : formatNumber(analytics.totals[key] || 0)}
                </p>
              </div>
              <div className={`rounded-2xl p-3.5 ${badgeBg}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commercial Financial Snapshot */}
      <div className="rounded-3xl border border-border bg-linear-to-r from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-extrabold text-primary">Commercial Insights</p>
            <h2 className="text-xl sm:text-2xl font-black mt-1">Financial & Ledger Overview</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/invoices" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-primary-hover transition shadow-sm">
              View Invoices
            </Link>
            <Link to="/customers" className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition backdrop-blur-xs">
              Khatabook Ledger
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-danger/20 text-danger shrink-0">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-semibold truncate">Total Due (Receivable)</p>
                <p className="text-xl sm:text-2xl font-black text-danger mt-0.5 truncate">₹{financials.ledger.totalReceivable?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-warning/20 text-warning shrink-0">
                <Wallet size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-semibold truncate">Total Shop Expenses</p>
                <p className="text-xl sm:text-2xl font-black text-warning mt-0.5 truncate">₹{financials.expenses.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-success/20 text-success shrink-0">
                <TrendingUp size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-semibold truncate">Customer Advance Given</p>
                <p className="text-xl sm:text-2xl font-black text-success mt-0.5 truncate">₹{financials.ledger.totalAdvance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Performance Bar Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-extrabold">Profit & Loss Snapshot</p>
              <h3 className="mt-1 text-lg font-black text-text">Overall Performance</h3>
            </div>
            <div className="rounded-full border border-success/30 bg-success/10 px-3.5 py-1 text-xs font-bold text-success">
              Net Profit: {formatCurrency(analytics.totals.totalProfit || 0)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <p className="text-xs text-success font-bold uppercase tracking-wider">Total Profit</p>
              <p className="mt-1 text-xl font-black text-text">{formatCurrency(analytics.totals.totalProfit || 0)}</p>
            </div>
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
              <p className="text-xs text-danger font-bold uppercase tracking-wider">Total Loss</p>
              <p className="mt-1 text-xl font-black text-text">{formatCurrency(analytics.totals.totalLoss || 0)}</p>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.charts?.profitLossData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="profit" name="Profit" radius={[8, 8, 0, 0]} fill="var(--color-success)" />
                <Bar dataKey="loss" name="Loss" radius={[8, 8, 0, 0]} fill="var(--color-danger)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution Pie Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-extrabold">Stock Mix</p>
            <h3 className="mt-1 text-lg font-black text-text">Stock Distribution</h3>
          </div>

          <div className="my-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? 'var(--color-primary)' : 'var(--color-danger)'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2.5">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-text">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-danger'}`} />
                  <span>{item.name}</span>
                </div>
                <span className="font-black">{formatNumber(item.value)} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity & Category Row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        
        {/* Recent Activity List */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-extrabold">Recent Activity</p>
              <h3 className="mt-1 text-lg font-black text-text">Live Product Logs</h3>
            </div>
            <Link to="/products" className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition">
              <span>Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-80 pr-1">
            {(analytics.recentActivity || []).length === 0 ? (
              <p className="text-center text-xs text-text-muted py-8">No recent activities logged.</p>
            ) : (
              (analytics.recentActivity || []).map((item, index) => (
                <div key={`${item.product}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary/40 transition">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-sm text-text truncate">{item.product}</p>
                    <p className="text-xs text-text-muted truncate">{item.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black ${item.quantityDelta > 0 ? 'text-success' : 'text-danger'}`}>
                      {item.quantityDelta > 0 ? '+' : ''}{item.quantityDelta}
                    </p>
                    <p className="text-[10px] text-text-muted">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Analysis Bar Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-extrabold">Category Analysis</p>
            <h3 className="mt-1 text-lg font-black text-text">Stock by Category</h3>
          </div>

          <div className="my-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--color-info)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-3.5 text-center">
              <p className="text-xs font-bold text-text-muted uppercase">Low Stock Alerts</p>
              <p className="mt-1 text-xl font-black text-warning">{analytics.totals.lowStockCount || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3.5 text-center">
              <p className="text-xs font-bold text-text-muted uppercase">Out of Stock</p>
              <p className="mt-1 text-xl font-black text-danger">{analytics.totals.outOfStockCount || 0}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
