import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2, WandSparkles, Package, TrendingUp, TrendingDown, DollarSign, AlertCircle, Edit, Minus, Plus as PlusIcon, X } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';

const initialForm = {
  name: '',
  category: 'General',
  sku: '',
  quantity: 0,
  buyingPrice: 0,
  sellingPrice: 0,
  lowStockThreshold: 5,
  description: '',
};

const Products = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const debouncedSearch = useDebounce(search, 300);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get('/products', {
        params: {
          search: debouncedSearch,
          status,
          sort,
          order,
          page,
          limit,
        },
      });

      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to load products.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, sort, order, page, limit, showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredBanner = useMemo(() => {
    const metrics = products.reduce(
      (acc, product) => {
        acc.stock += Number(product.quantity || 0);
        acc.value += Number(product.inventoryValue || 0);
        acc.loss += Number(product.loss || 0);
        acc.profit += Number(product.profit || 0);
        return acc;
      },
      { stock: 0, value: 0, profit: 0, loss: 0 }
    );

    return metrics;
  }, [products]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category || 'General',
      sku: product.sku || '',
      quantity: product.quantity,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      lowStockThreshold: product.lowStockThreshold || 5,
      description: product.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.name) {
      showToast('Product name is required.', 'warning');
      return;
    }

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showToast('Product updated successfully.', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product added successfully.', 'success');
      }

      setShowModal(false);
      setPage(1);
      loadProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to save product.', 'error');
    }
  };

  const handleAdjustStock = async (productId, delta) => {
    try {
      await api.patch(`/products/${productId}/adjust-stock`, { change: Number(delta) });
      showToast(`Stock updated by ${delta > 0 ? '+' : ''}${delta}.`, 'success');
      loadProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to update stock.', 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product and save it to removed product history?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      showToast('Product removed and archived.', 'success');
      loadProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to remove product.', 'error');
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((product) => ({
        Name: product.name,
        Category: product.category,
        SKU: product.sku || 'N/A',
        Quantity: product.quantity,
        BuyingPrice: product.buyingPrice,
        SellingPrice: product.sellingPrice,
        Profit: product.profit,
        Loss: product.loss,
        InventoryValue: product.inventoryValue,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory-report.xlsx');
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text('Inventory Report', 14, 16);

    autoTable(doc, {
      head: [['Name', 'Category', 'Qty', 'Buying', 'Selling', 'Profit', 'Loss', 'Value']],
      body: products.map((product) => [
        product.name,
        product.category,
        product.quantity,
        formatCurrency(product.buyingPrice),
        formatCurrency(product.sellingPrice),
        formatCurrency(product.profit),
        formatCurrency(product.loss),
        formatCurrency(product.inventoryValue),
      ]),
      startY: 24,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 211, 238] },
    });

    doc.save('inventory-report.pdf');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium mb-3">
                <Package size={12} />
                <span>Inventory Management</span>
              </div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Products
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manage your inventory, track stock levels, and monitor profits
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-500/20">
                  <Package size={20} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">Total</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(filteredBanner.stock)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Units in stock</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                  <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Value</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(filteredBanner.value)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inventory value</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                  <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Profit</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(filteredBanner.profit)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total profit</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20">
                  <TrendingDown size={20} className="text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Loss</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(filteredBanner.loss)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total loss</p>
            </div>
          </div>
        </div>

        {/* Search and Filters - Placed right before Add Product button */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 lg:top-1/7 md:top-1/2 top-1/2  -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                placeholder="     Search products by name, SKU, or category..."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All stock states</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="updatedAt">Sort by: Updated</option>
                <option value="name">Sort by: Name</option>
                <option value="sellingPrice">Sort by: Selling price</option>
                <option value="quantity">Sort by: Quantity</option>
              </select>

              <select
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Bar with Add Product and Export Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:shadow-xl hover:scale-105 w-full sm:w-auto"
          >
            <Plus size={18} />
            Add Product
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Export:</span>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex-1 sm:flex-none"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-200 dark:border-fuchsia-500/30 bg-fuchsia-50 dark:bg-fuchsia-500/10 px-4 py-2.5 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 transition-all flex-1 sm:flex-none"
            >
              <WandSparkles size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="group rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-cyan-500/10 to-blue-500/10 px-2.5 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        <Package size={10} />
                        {product.category}
                      </span>
                      {product.status === 'out_of_stock' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                          <AlertCircle size={10} />
                          Out of stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          In stock
                        </span>
                      )}
                      {product.quantity <= (product.lowStockThreshold || 5) && product.quantity > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                          <AlertCircle size={10} />
                          Low stock
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{product.name}</h3>
                    {product.sku && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">SKU: {product.sku}</p>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{product.description || 'No description added.'}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 lg:max-w-md">
                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{formatNumber(product.quantity)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Buying</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.buyingPrice)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Selling</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.sellingPrice)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Value</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.inventoryValue)}</p>
                    </div>
                  </div>
                </div>

                {/* Profit/Loss Row */}
                <div className="mt-4 flex items-center justify-between px-2 py-2 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Profit:</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(product.profit)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown size={14} className="text-rose-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Loss:</span>
                      <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(product.loss)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustStock(product._id, 1)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                    >
                      <PlusIcon size={14} />
                      +1
                    </button>
                    <button
                      onClick={() => handleAdjustStock(product._id, -1)}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                    >
                      <Minus size={14} />
                      -1
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900/30 p-12 text-center">
                <Package size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">No products found</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filters, or add a new product.</p>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white mt-4 hover:shadow-lg transition-all"
                >
                  <Plus size={14} />
                  Add Product
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 px-5 py-4 shadow-sm">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-10">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingId ? 'Update product information' : 'Fill in the details to add a new product'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  <X size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Product name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <input
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                      placeholder="e.g., Electronics"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">SKU</label>
                    <input
                      value={form.sku}
                      onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                      placeholder="Stock keeping unit"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Low stock threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={form.lowStockThreshold}
                      onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Buying price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.buyingPrice}
                        onChange={(event) => setForm((current) => ({ ...current, buyingPrice: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 pl-7 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Selling price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.sellingPrice}
                        onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 pl-7 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all resize-none"
                      rows="3"
                      placeholder="Add optional product description"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {editingId ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;