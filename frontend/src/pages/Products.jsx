import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2, WandSparkles, Package, TrendingUp, TrendingDown, DollarSign, AlertCircle, Edit, Minus, Plus as PlusIcon, X, RefreshCw } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { useScrollLock } from '../hooks/useScrollLock';

const initialForm = {
  name: '',
  category: 'General',
  sku: '',
  quantity: 0,
  unit: 'pcs',
  buyingPrice: 0,
  sellingPrice: 0,
  lowStockThreshold: 5,
  description: '',
  image: '',
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
  const [uploadingImage, setUploadingImage] = useState(false);

  useScrollLock(showModal);
  const debouncedSearch = useDebounce(search, 300);

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      showToast('Uploading product image...', 'info');
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => ({ ...prev, image: res.data.url }));
      showToast('Image uploaded!', 'success');
    } catch {
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

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
      unit: product.unit || 'pcs',
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      lowStockThreshold: product.lowStockThreshold || 5,
      description: product.description || '',
      image: product.image || '',
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
      headStyles: { fillColor: [6, 182, 212] },
    });

    doc.save('inventory-report.pdf');
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 max-w-full overflow-x-hidden animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-extrabold mb-1.5 sm:mb-2">
            <Package size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span>Inventory Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Products Catalog</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Manage inventory stock, adjust quantities, and monitor profit valuations.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Total Units</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-gray-900 dark:text-white">{formatNumber(filteredBanner.stock)}</p>
            <p className="text-[8px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Units in stock</p>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-2.5 sm:p-3.5 text-blue-600 dark:text-blue-400">
            <Package size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Stock Value</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(filteredBanner.value)}</p>
            <p className="text-[8px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Total valuation</p>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-2.5 sm:p-3.5 text-blue-600 dark:text-blue-400">
            <DollarSign size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Expected Profit</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-green-600 dark:text-green-400">{formatCurrency(filteredBanner.profit)}</p>
            <p className="text-[8px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Potential margin</p>
          </div>
          <div className="rounded-2xl bg-green-500/10 p-2.5 sm:p-3.5 text-green-600 dark:text-green-400">
            <TrendingUp size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Potential Loss</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-red-600 dark:text-red-400">{formatCurrency(filteredBanner.loss)}</p>
            <p className="text-[8px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Depreciation / risk</p>
          </div>
          <div className="rounded-2xl bg-red-500/10 p-2.5 sm:p-3.5 text-red-600 dark:text-red-400">
            <TrendingDown size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 min-w-[150px]">
            <Search size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="Search products..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
            >
              <option value="">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
            >
              <option value="updatedAt">Sort: Updated</option>
              <option value="name">Sort: Name</option>
              <option value="sellingPrice">Sort: Price</option>
              <option value="quantity">Sort: Quantity</option>
            </select>

            <select
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>

            <button
              onClick={loadProducts}
              title="Refresh List"
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-2.5 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition shadow-sm"
            >
              <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar with Add Product and Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition active:scale-95 shrink-0 w-full sm:w-auto"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Add New Product</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 hidden sm:block">Export:</span>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition shadow-sm flex-1 sm:flex-none"
          >
            <Download size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition shadow-sm flex-1 sm:flex-none"
          >
            <WandSparkles size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 sm:gap-4">
                {/* Product Info & Thumbnail */}
                <div className="flex-1 flex gap-3 sm:gap-4 items-start min-w-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-900" />
                  ) : (
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
                      <Package size={20} className="sm:w-6 sm:h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-xs font-extrabold text-blue-600 dark:text-blue-400">
                        <Package size={10} className="sm:w-3 sm:h-3" />
                        {product.category}
                      </span>
                      {product.status === 'out_of_stock' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-xs font-extrabold text-red-600 dark:text-red-400">
                          <AlertCircle size={10} className="sm:w-3 sm:h-3" />
                          Out of stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-xs font-extrabold text-green-600 dark:text-green-400">
                          In stock
                        </span>
                      )}
                      {product.quantity <= (product.lowStockThreshold || 5) && product.quantity > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-xs font-extrabold text-yellow-600 dark:text-yellow-400">
                          <AlertCircle size={10} className="sm:w-3 sm:h-3" />
                          Low stock
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate mb-0.5 sm:mb-1">{product.name}</h3>
                    {product.sku && (
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono mb-1 sm:mb-2">SKU: {product.sku}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description || 'No description added.'}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1 lg:max-w-md">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60 p-2 sm:p-3 text-center">
                    <p className="text-[8px] sm:text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">Qty</p>
                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">{formatNumber(product.quantity)} <span className="text-[8px] sm:text-xs font-normal text-gray-500 dark:text-gray-400">{product.unit || 'pcs'}</span></p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60 p-2 sm:p-3 text-center">
                    <p className="text-[8px] sm:text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">Buying</p>
                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">{formatCurrency(product.buyingPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60 p-2 sm:p-3 text-center">
                    <p className="text-[8px] sm:text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">Selling</p>
                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60 p-2 sm:p-3 text-center">
                    <p className="text-[8px] sm:text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">Valuation</p>
                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">{formatCurrency(product.inventoryValue)}</p>
                  </div>
                </div>
              </div>

              {/* Profit/Loss Row & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-2.5 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp size={14} className="sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Profit:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(product.profit)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingDown size={14} className="sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Loss:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(product.loss)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5 sm:p-1">
                    <button
                      onClick={() => handleAdjustStock(product._id, 1)}
                      className="inline-flex items-center gap-0.5 rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold text-green-600 dark:text-green-400 hover:bg-green-500/15 transition"
                      title="Add +1 to stock"
                    >
                      <PlusIcon size={12} className="sm:w-[14px] sm:h-[14px]" /> +1
                    </button>
                    <div className="w-[1px] h-3 sm:h-4 bg-gray-200 dark:border-gray-700 mx-0.5 sm:mx-1"></div>
                    <button
                      onClick={() => handleAdjustStock(product._id, -1)}
                      className="inline-flex items-center gap-0.5 rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/15 transition"
                      title="Subtract -1 from stock"
                    >
                      <Minus size={12} className="sm:w-[14px] sm:h-[14px]" /> -1
                    </button>
                  </div>

                  <button
                    onClick={() => openEdit(product)}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-1 sm:py-2 text-[8px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition shadow-sm"
                  >
                    <Edit size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="hidden xs:inline">Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(product._id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 sm:px-3.5 py-1 sm:py-2 text-[8px] sm:text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:text-white transition shadow-sm"
                  >
                    <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="hidden xs:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 sm:p-12 text-center">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
                <Package size={28} className="sm:w-8 sm:h-8" />
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">No Products Found</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search criteria or add a new product item.</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white mt-4 sm:mt-5 shadow-md shadow-blue-500/20 transition"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                Add Product
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-5 py-3 sm:py-4 shadow-sm">
              <div className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page === 1}
                  className="flex-1 sm:flex-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex-1 sm:flex-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
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
  <div 
    className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto"
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowModal(false);
    }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div className="w-full max-w-2xl rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-2xl my-8 sm:my-0 animate-scale-up max-h-none sm:max-h-[90vh] overflow-visible sm:overflow-y-auto flex flex-col">
      
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Catalog Item
          </p>
          <h2 
            id="modal-title"
            className="text-base sm:text-xl font-black text-gray-900 dark:text-white truncate"
          >
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="p-1.5 sm:p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition shrink-0"
          aria-label="Close modal"
        >
          <X size={16} className="sm:w-[20px] sm:h-[20px]" />
        </button>
      </div>

      {/* Modal Body */}
      <form onSubmit={handleSave} className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          
          {/* Product Name - Full Width */}
          <div className="sm:col-span-2">
            <label 
              htmlFor="productName"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="productName"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="Enter product name"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label 
              htmlFor="category"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Category
            </label>
            <input
              id="category"
              type="text"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="e.g., Electronics"
            />
          </div>

          {/* SKU */}
          <div>
            <label 
              htmlFor="sku"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={form.sku}
              onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="Stock keeping unit"
            />
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label 
              htmlFor="lowStockThreshold"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Low Stock Threshold
            </label>
            <input
              id="lowStockThreshold"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="5"
            />
          </div>

          {/* Quantity & Unit */}
          <div>
            <label 
              htmlFor="quantity"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Quantity & Unit
            </label>
            <div className="flex gap-2">
              <input
                id="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                placeholder="0"
              />
              <select
                id="unit"
                value={form.unit || 'pcs'}
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                className="w-20 sm:w-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-1.5 sm:px-2.5 py-2.5 sm:py-2.5 text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="ltr">ltr</option>
                <option value="box">box</option>
                <option value="doz">doz</option>
                <option value="m">m</option>
              </select>
            </div>
          </div>

          {/* Product Image - Full Width */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400">
              Product Image
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {form.image && (
                <img 
                  src={form.image} 
                  alt="Product preview" 
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0"
                />
              )}
              <label 
                className={`flex-1 cursor-pointer rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-2.5 sm:p-3.5 text-center text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-gray-700 dark:hover:text-gray-300 transition ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingImage ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  form.image ? 'Click to Change Image' : 'Click to Upload Product Image'
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProductImageUpload} 
                  disabled={uploadingImage} 
                  className="hidden" 
                />
              </label>
            </div>
            <p className="mt-1 text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500">
              Supported formats: JPG, PNG, GIF (Max 5MB)
            </p>
          </div>

          {/* Buying Price */}
          <div>
            <label 
              htmlFor="buyingPrice"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Buying Price (₹)
            </label>
            <input
              id="buyingPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.buyingPrice}
              onChange={(event) => setForm((current) => ({ ...current, buyingPrice: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="0.00"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label 
              htmlFor="sellingPrice"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Selling Price (₹)
            </label>
            <input
              id="sellingPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              placeholder="0.00"
            />
          </div>

          {/* Description - Full Width */}
          <div className="sm:col-span-2">
            <label 
              htmlFor="description"
              className="mb-1 block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400"
            >
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-sm text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition resize-none"
              rows={3}
              placeholder="Add optional product details..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 sm:px-5 py-2.5 sm:py-2.5 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition w-full sm:w-auto active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 sm:px-6 py-2.5 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-md shadow-blue-500/20 transition w-full sm:w-auto active:scale-95"
          >
            {editingId ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Product
              </span>
            )}
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