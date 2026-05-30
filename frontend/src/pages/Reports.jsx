import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Package,
  Wallet,
  TrendingUp,
  TriangleAlert,
  BarChart3,
} from 'lucide-react';

import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totals: {},
    charts: {},
  });
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  const totals = analytics?.totals || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Analytics
        </p>

        <h1 className="mt-2 text-3xl font-bold text-text">
          Reports & Analytics
        </h1>

        <p className="mt-2 text-secondary">
          Monitor inventory performance, sales trends, profitability, and stock
          health from a single dashboard.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-3xl border border-secondary/20 bg-background p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-primary/10 p-3">
              <Package className="h-5 w-5 text-primary" />
            </span>

            <span className="text-xs text-secondary">Inventory</span>
          </div>

          <p className="mt-5 text-sm text-secondary">Total Stock</p>

          <h3 className="mt-2 text-3xl font-bold text-text">
            {formatNumber(totals.totalStockCount || 0)}
          </h3>
        </div>

        <div className="group rounded-3xl border border-secondary/20 bg-background p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-primary/10 p-3">
              <Wallet className="h-5 w-5 text-primary" />
            </span>

            <span className="text-xs text-secondary">Assets</span>
          </div>

          <p className="mt-5 text-sm text-secondary">Inventory Value</p>

          <h3 className="mt-2 text-3xl font-bold text-text">
            {formatCurrency(totals.totalInventoryValue || 0)}
          </h3>
        </div>

        <div className="group rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-emerald-500/10 p-3">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </span>

            <span className="text-xs text-emerald-400">Profit</span>
          </div>

          <p className="mt-5 text-sm text-secondary">Total Profit</p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-400">
            {formatCurrency(totals.totalProfit || 0)}
          </h3>
        </div>

        <div className="group rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-rose-500/10 p-3">
              <TriangleAlert className="h-5 w-5 text-rose-400" />
            </span>

            <span className="text-xs text-rose-400">Alert</span>
          </div>

          <p className="mt-5 text-sm text-secondary">Low Stock Items</p>

          <h3 className="mt-2 text-3xl font-bold text-rose-400">
            {formatNumber(totals.lowStockCount || 0)}
          </h3>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="rounded-3xl border border-secondary/20 bg-background p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-text">
              Sales Trend Overview
            </h2>

            <p className="text-sm text-secondary">
              Date-wise sales performance
            </p>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend}>
              <defs>
                <linearGradient
                  id="salesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary-hover)"
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                strokeOpacity={0.15}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />

              <Tooltip
                cursor={{
                  fill: 'rgba(255,255,255,0.03)',
                }}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />

              <Bar
                dataKey="sold"
                fill="url(#salesGradient)"
                radius={[12, 12, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profit & Loss */}
        <div className="rounded-3xl border border-secondary/20 bg-background p-6 shadow-lg">
          <h2 className="text-xl font-bold text-text">
            Profit & Loss Summary
          </h2>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-sm text-secondary">Total Profit</p>

              <h3 className="mt-2 text-3xl font-bold text-emerald-400">
                {formatCurrency(totals.totalProfit || 0)}
              </h3>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <p className="text-sm text-secondary">Total Loss</p>

              <h3 className="mt-2 text-3xl font-bold text-rose-400">
                {formatCurrency(totals.totalLoss || 0)}
              </h3>
            </div>
          </div>
        </div>

        {/* Inventory Insights */}
        <div className="rounded-3xl border border-secondary/20 bg-background p-6 shadow-lg">
          <h2 className="text-xl font-bold text-text">
            Inventory Insights
          </h2>

          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-secondary/10 p-4">
              <span className="text-secondary">
                Total Inventory Value
              </span>

              <span className="font-semibold text-text">
                {formatCurrency(totals.totalInventoryValue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-secondary/10 p-4">
              <span className="text-secondary">
                Total Stock Units
              </span>

              <span className="font-semibold text-text">
                {formatNumber(totals.totalStockCount || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
              <span className="text-secondary">
                Low Stock Products
              </span>

              <span className="font-semibold text-rose-400">
                {formatNumber(totals.lowStockCount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;