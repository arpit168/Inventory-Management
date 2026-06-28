import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Package, DollarSign, AlertCircle, BarChart3 } from 'lucide-react';
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
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold mb-2">
            <BarChart3 size={14} />
            <span>Business Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-text-muted mt-1">Review inventory valuation, sales velocity, and net profit estimations.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Total Stock Units</p>
            <p className="mt-1 text-2xl font-black text-text">{formatNumber(analytics.totals?.totalStockCount || 0)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Physical items in storage</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <Package size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Inventory Valuation</p>
            <p className="mt-1 text-2xl font-black text-text">{formatCurrency(analytics.totals?.totalInventoryValue || 0)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Cumulative stock worth</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Low Stock Alerts</p>
            <p className="mt-1 text-2xl font-black text-warning">{formatNumber(analytics.totals?.lowStockCount || 0)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Items needing re-order</p>
          </div>
          <div className="rounded-2xl bg-warning/10 p-3.5 text-warning">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Date-Wise Velocity</p>
            <h2 className="text-xl font-black text-text">Sales Trend Snapshot</h2>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
              <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar radius={[8, 8, 0, 0]} dataKey="sold" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit / Loss Summary */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-xl font-black text-text mb-4">Profit & Loss Estimates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-success/10 p-5 flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/20 text-success text-xs font-bold mb-1">
                <TrendingUp size={12} /> Positive Margin
              </span>
              <p className="text-sm font-bold text-text-muted">Expected Gross Profit</p>
              <p className="mt-1 text-3xl font-black text-success">{formatCurrency(analytics.totals?.totalProfit || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-success/20 text-success">
              <TrendingUp size={28} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-danger/10 p-5 flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger/20 text-danger text-xs font-bold mb-1">
                <TrendingDown size={12} /> Risk / Depreciation
              </span>
              <p className="text-sm font-bold text-text-muted">Estimated Potential Loss</p>
              <p className="mt-1 text-3xl font-black text-danger">{formatCurrency(analytics.totals?.totalLoss || 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-danger/20 text-danger">
              <TrendingDown size={28} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;