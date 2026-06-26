import { useEffect, useState } from 'react';
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
  DollarSign,
  Tag
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

  const loadProducts = async () => {
    try {
      const response = await api.get('/products/out-of-stock');
      setProducts(response.data.products || []);
    } catch (error) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRestore = async (productId) => {
    if (!restockQuantity || Number(restockQuantity) <= 0) {
      showToast('Please enter a valid quantity', 'warning');
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
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-50 via-white to-rose-50 dark:from-rose-950/20 dark:via-slate-950 dark:to-rose-950/20 border border-rose-200/50 dark:border-rose-400/20 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/20 dark:bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-xl">
              <PackageX className="w-6 h-6 text-rose-600 dark:text-rose-300" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
              Inventory Alert
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Out of Stock Products
          </h1>
          
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
            {products.length === 0 
              ? 'All products are currently in stock. Great job managing your inventory!'
              : `${products.length} product${products.length > 1 ? 's are' : ' is'} currently unavailable. Restore stock to make them available for purchase again.`
            }
          </p>

          {products.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">{products.length}</strong> items need attention
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Total value: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalLostValue)}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-400 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-400 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="group rounded-2xl border border-slate-200 dark:border-rose-400/20 bg-white dark:bg-slate-950/70 p-6 hover:shadow-xl dark:hover:shadow-rose-500/5 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Product Image/Avatar */}
                <div className="shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-slate-100 to-rose-50 dark:from-slate-900 dark:to-rose-950/30 border border-slate-200 dark:border-rose-400/10 flex items-center justify-center">
                    <PackageX className="w-10 h-10 text-rose-300 dark:text-rose-400/50" />
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Tag className="w-3 h-3" />
                        {product.category}
                      </span>
                      <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        SKU: {product.sku || 'N/A'}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-400/20 text-sm font-semibold text-rose-700 dark:text-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Out of Stock
                    </span>
                  </div>

                  {/* Price Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    {[
                      { icon: ShoppingCart, label: 'Buying Price', value: formatCurrency(product.buyingPrice), color: 'blue' },
                      { icon: DollarSign, label: 'Selling Price', value: formatCurrency(product.sellingPrice), color: 'green' },
                      { icon: TrendingDown, label: 'Stock Value', value: formatCurrency(product.inventoryValue || 0), color: 'purple' }
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="group/stat relative overflow-hidden rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 hover:border-rose-200 dark:hover:border-rose-400/30 transition-all duration-300"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-bl from-rose-100/50 to-transparent dark:from-rose-500/5 rounded-bl-3xl" />
                        <div className="relative">
                          <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4">
                    {restockId === product._id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10"
                      >
                        <div className="flex-1 min-w-50">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                            Restock Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={restockQuantity}
                            onChange={(e) => setRestockQuantity(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-400 outline-none transition-all"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(product._id)}
                            disabled={restoringId === product._id}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 dark:bg-rose-400 dark:hover:bg-rose-300 px-5 py-2.5 font-semibold text-white dark:text-slate-950 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {restoringId === product._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Restoring...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                Confirm Restore
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setRestockId(null)}
                            className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setRestockId(product._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-400 dark:to-emerald-500 dark:hover:from-emerald-300 dark:hover:to-emerald-400 px-5 py-2.5 font-semibold text-white dark:text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all transform hover:scale-105"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore Stock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredProducts.length === 0 && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <PackageX className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              No products match your search
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-rose-500 hover:text-rose-600 dark:text-rose-400 font-medium"
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* No Products at All */}
        {products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-950/55 p-12 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              All Products Are in Stock!
            </h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Your inventory is well-managed. Come back here when products run out of stock.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OutOfStock;