import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { 
  PackageX, 
  RotateCcw, 
  TrendingDown, 
  AlertTriangle,
  Search,
  Filter,
  ShoppingCart,
  Tag,
  RefreshCw
} from 'lucide-react';

const OutOfStock = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockId, setRestockId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [restoringId, setRestoringId] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/out-of-stock');
      setProducts(response.data.products || []);
    } catch {
      showToast('Failed to load out of stock products', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRestore = async (productId) => {
    if (!restockQuantity || Number(restockQuantity) <= 0) {
      showToast('Please enter a valid positive quantity', 'warning');
      return;
    }

    setRestoringId(productId);
    try {
      await api.patch(`/products/${productId}/adjust-stock`, { change: Number(restockQuantity) });
      showToast('Stock restored successfully!', 'success');
      setRestockId(null);
      setRestockQuantity(1);
      await loadProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to restore stock', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const totalLostValue = products.reduce((sum, p) => sum + (p.inventoryValue || 0), 0);

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="p-2.5 bg-danger/15 rounded-2xl text-danger">
              <PackageX size={24} />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-danger">
              Inventory Alert
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mb-2">
            Out of Stock Products
          </h1>
          
          <p className="text-sm text-text-muted max-w-2xl">
            {products.length === 0 
              ? 'All products are currently in stock. Great job managing your inventory supply!'
              : `${products.length} product${products.length > 1 ? 's are' : ' is'} currently unavailable. Restore stock levels to enable sales again.`
            }
          </p>

          {products.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border text-xs font-bold text-text">
                <AlertTriangle size={16} className="text-warning" />
                <span><strong className="text-warning">{products.length}</strong> items depleted</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border text-xs font-bold text-text">
                <TrendingDown size={16} className="text-danger" />
                <span>Depleted Valuation: <strong className="text-danger">{formatCurrency(totalLostValue)}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      {products.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadProducts}
              title="Refresh List"
              className="rounded-xl border border-border bg-background p-2.5 text-text hover:border-primary transition shadow-xs shrink-0"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs hover:border-text-muted/40 transition flex flex-col gap-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                <div className="flex gap-4 items-start flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0 text-danger">
                    <PackageX size={32} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                        <Tag size={12} />
                        {product.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger/15 text-xs font-extrabold text-danger">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                        Out of Stock
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-text truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      SKU: {product.sku || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Price Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                  <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Buying</p>
                    <p className="text-base font-black text-text mt-0.5">{formatCurrency(product.buyingPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Selling</p>
                    <p className="text-base font-black text-text mt-0.5">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Lost Valuation</p>
                    <p className="text-base font-black text-danger mt-0.5">{formatCurrency(product.inventoryValue || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Restock Action Controls */}
              <div className="pt-3 border-t border-border flex justify-end">
                {restockId === product._id ? (
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto bg-background p-3 rounded-xl border border-border animate-fade-in">
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <label className="text-xs font-bold text-text-muted whitespace-nowrap">Add Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={restockQuantity}
                        onChange={(e) => setRestockQuantity(e.target.value)}
                        className="w-24 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-bold text-text focus:border-primary focus:outline-hidden text-center"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleRestore(product._id)}
                        disabled={restoringId === product._id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-emerald-400 transition disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        <span>Confirm Restore</span>
                      </button>
                      <button
                        onClick={() => setRestockId(null)}
                        className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-text hover:bg-background transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRestockId(product._id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition active:scale-98"
                  >
                    <RotateCcw size={14} />
                    <span>Restore Stock</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <PackageX size={48} className="text-text-muted mx-auto mb-3 opacity-60" />
            <p className="text-base font-bold text-text">No matching depleted products</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs font-bold text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* No Products at All */}
        {products.length === 0 && (
          <div className="rounded-3xl border border-border bg-surface p-16 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-success/15 text-success flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} />
            </div>
            <h3 className="text-xl font-black text-text mb-1">
              All Products Are in Stock!
            </h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Your inventory levels are healthy. None of your catalog items are currently depleted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutOfStock;