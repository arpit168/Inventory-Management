import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2, WandSparkles } from 'lucide-react';
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
    loadProducts(); // eslint-disable-line react-hooks/set-state-in-effect
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-lg transition-all">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300">Product management</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Inventory and pricing control</h1>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 px-4 py-3 font-semibold text-white dark:text-slate-950 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            Add product
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-4 shadow-sm hover:shadow-md transition-shadow dark:hover:bg-white/8">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Total stock</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(filteredBanner.stock)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-4 shadow-sm hover:shadow-md transition-shadow dark:hover:bg-white/8">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Inventory value</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(filteredBanner.value)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-4 shadow-sm hover:shadow-md transition-shadow dark:hover:bg-white/8">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Profit</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(filteredBanner.profit)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-4 shadow-sm hover:shadow-md transition-shadow dark:hover:bg-white/8">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Loss</p>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-300">{formatCurrency(filteredBanner.loss)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <label className="flex flex-1 min-w-[220px] items-center gap-3 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-cyan-500 dark:focus-within:ring-cyan-400">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Search products"
            />
          </label>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 outline-none"
          >
            <option value="">All stock states</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 outline-none"
          >
            <option value="updatedAt">Sort: updated</option>
            <option value="name">Sort: name</option>
            <option value="sellingPrice">Sort: selling price</option>
            <option value="quantity">Sort: quantity</option>
          </select>

          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 outline-none"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 dark:border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-50 shadow-sm hover:shadow-md hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
          >
            <Download size={16} />
            Excel
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-300 dark:border-fuchsia-400/40 bg-fuchsia-50 dark:bg-fuchsia-500/10 px-4 py-3 text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-50 shadow-sm hover:shadow-md hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 transition-all"
          >
            <WandSparkles size={16} />
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product._id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">{product.category}</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{product.name}</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{product.description || 'No description added.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${product.status === 'out_of_stock' ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-100' : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-100'}`}>
                    {product.status === 'out_of_stock' ? 'Out of stock' : 'In stock'}
                  </span>
                  {product.quantity <= (product.lowStockThreshold || 5) && product.quantity > 0 && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-100">Low stock</span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Quantity</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatNumber(product.quantity)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Buying</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(product.buyingPrice)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Selling</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(product.sellingPrice)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Profit</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-300">{formatCurrency(product.profit)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Loss</p>
                  <p className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(product.loss)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleAdjustStock(product._id, 1)} className="rounded-2xl border border-emerald-300 dark:border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-50 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                    +1
                  </button>
                  <button onClick={() => handleAdjustStock(product._id, -1)} className="rounded-2xl border border-rose-300 dark:border-rose-400/40 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-50 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                    -1
                  </button>
                  <button onClick={() => openEdit(product)} className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    Edit
                  </button>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span>Stock value: {formatCurrency(product.inventoryValue)}</span>
                  <button onClick={() => handleDelete(product._id)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 dark:border-rose-400/40 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-50 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-950/55 p-12 text-center text-slate-500 dark:text-slate-300">
              <p className="text-sm font-medium">No products match your filters yet. Add a new product to get started.</p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 px-6 py-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page === 1}
                className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page === totalPages}
                className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-6 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300">{editingId ? 'Edit product' : 'Add product'}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{editingId ? 'Update product details' : 'New inventory item'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Close</button>
            </div>

            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Product name *</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="Enter product name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="e.g., Electronics" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">SKU</label>
                <input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="Stock keeping unit" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Low stock threshold</label>
                <input type="number" min="0" value={form.lowStockThreshold} onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="5" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Quantity</label>
                <input type="number" min="0" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="0" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Buying price</label>
                <input type="number" min="0" step="0.01" value={form.buyingPrice} onChange={(event) => setForm((current) => ({ ...current, buyingPrice: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="0.00" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Selling price</label>
                <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all" placeholder="0.00" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all resize-none" rows="4" placeholder="Add optional product description" />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  Cancel
                </button>
                <button type="submit" className="rounded-2xl bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 px-6 py-3 text-sm font-semibold text-white dark:text-slate-950 transition-all shadow-md hover:shadow-lg">
                  {editingId ? 'Save changes' : 'Create product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
