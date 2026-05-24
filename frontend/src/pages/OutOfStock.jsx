import { useEffect, useState } from 'react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

const OutOfStock = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockId, setRestockId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(1);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products/out-of-stock');
      setProducts(response.data.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRestore = async (productId) => {
    if (!restockQuantity || Number(restockQuantity) <= 0) {
      showToast('Enter a valid quantity to restore.', 'warning');
      return;
    }

    try {
      await api.patch(`/products/${productId}/adjust-stock`, { change: Number(restockQuantity) });
      showToast('Stock restored successfully.', 'success');
      setRestockId(null);
      setRestockQuantity(1);
      loadProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to restore stock.', 'error');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Out of stock</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Manage unavailable products</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Products here are currently unavailable. Restore them when new stock arrives to move them back into your active inventory.
        </p>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product._id} className="rounded-xl border border-slate-200 dark:border-rose-400/30 bg-white dark:bg-slate-950/70 p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-rose-600 dark:text-rose-200 font-semibold">{product.category}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">SKU: {product.sku || 'N/A'}</p>
              </div>
              <div className="rounded-full border border-rose-300 dark:border-rose-400/40 bg-rose-100 dark:bg-rose-500/10 px-3 py-1 text-sm text-rose-700 dark:text-rose-100 font-semibold">
                Out of stock
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Buying price</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.buyingPrice)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Selling price</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.sellingPrice)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Remaining stock value</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.inventoryValue || 0)}</p>
              </div>
            </div>

            {restockId === product._id ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(event) => setRestockQuantity(event.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400 outline-none transition"
                />
                <button
                  onClick={() => handleRestore(product._id)}
                  className="rounded-xl bg-cyan-500 dark:bg-cyan-400 px-4 py-2 font-semibold text-white dark:text-slate-950 hover:bg-cyan-600 dark:hover:bg-cyan-300 transition-colors shadow-md"
                >
                  Confirm restore
                </button>
                <button
                  onClick={() => setRestockId(null)}
                  className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRestockId(product._id)}
                className="mt-4 rounded-xl bg-emerald-500 dark:bg-emerald-400 px-4 py-2 font-semibold text-white dark:text-slate-950 hover:bg-emerald-600 dark:hover:bg-emerald-300 transition-colors shadow-md"
              >
                Restore stock
              </button>
            )}
          </div>
        ))}

        {products.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-950/55 p-8 text-center text-slate-600 dark:text-slate-300 font-medium">
            No products are currently out of stock.
          </div>
        )}
      </div>
    </div>
  );
};

export default OutOfStock;
