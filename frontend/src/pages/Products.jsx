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
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold mb-2">
            <Package size={14} />
            <span>Inventory Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Products Catalog</h1>
          <p className="text-sm text-text-muted mt-1">Manage inventory stock, adjust quantities, and monitor profit valuations.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Total Units</p>
            <p className="mt-1 text-2xl font-black text-text">{formatNumber(filteredBanner.stock)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Units in stock</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <Package size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Stock Value</p>
            <p className="mt-1 text-2xl font-black text-text">{formatCurrency(filteredBanner.value)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Total valuation</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Expected Profit</p>
            <p className="mt-1 text-2xl font-black text-success">{formatCurrency(filteredBanner.profit)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Potential margin</p>
          </div>
          <div className="rounded-2xl bg-success/10 p-3.5 text-success">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Potential Loss</p>
            <p className="mt-1 text-2xl font-black text-danger">{formatCurrency(filteredBanner.loss)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Depreciation / risk</p>
          </div>
          <div className="rounded-2xl bg-danger/10 p-3.5 text-danger">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              placeholder="Search products by name, SKU, or category..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
            >
              <option value="">All Stock States</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
            >
              <option value="updatedAt">Sort: Updated</option>
              <option value="name">Sort: Name</option>
              <option value="sellingPrice">Sort: Price</option>
              <option value="quantity">Sort: Quantity</option>
            </select>

            <select
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>

            <button
              onClick={loadProducts}
              title="Refresh List"
              className="rounded-xl border border-border bg-background p-2.5 text-text hover:border-primary transition shadow-xs"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar with Add Product and Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition shrink-0 active:scale-98"
        >
          <Plus size={18} />
          <span>Add New Product</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-text-muted hidden sm:block">Export:</span>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-text hover:border-primary transition shadow-xs"
          >
            <Download size={14} />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-text hover:border-primary transition shadow-xs"
          >
            <WandSparkles size={14} />
            <span>PDF Report</span>
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
              className="rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-text-muted/40 transition flex flex-col gap-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Product Info & Thumbnail */}
                <div className="flex-1 flex gap-4 items-start min-w-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover border border-border shrink-0 bg-background" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl border border-border bg-background flex items-center justify-center text-text-muted shrink-0">
                      <Package size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                        <Package size={12} />
                        {product.category}
                      </span>
                      {product.status === 'out_of_stock' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-3 py-1 text-xs font-extrabold text-danger">
                          <AlertCircle size={12} />
                          Out of stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-extrabold text-success">
                          In stock
                        </span>
                      )}
                      {product.quantity <= (product.lowStockThreshold || 5) && product.quantity > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-extrabold text-warning">
                          <AlertCircle size={12} />
                          Low stock
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-text truncate mb-1">{product.name}</h3>
                    {product.sku && (
                      <p className="text-xs text-text-muted font-mono mb-2">SKU: {product.sku}</p>
                    )}
                    <p className="text-sm text-text-muted line-clamp-2">{product.description || 'No description added.'}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 lg:max-w-md">
                  <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Quantity</p>
                    <p className="text-lg font-black text-text mt-0.5">{formatNumber(product.quantity)} <span className="text-xs font-normal text-text-muted">{product.unit || 'pcs'}</span></p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Buying</p>
                    <p className="text-lg font-black text-text mt-0.5">{formatCurrency(product.buyingPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Selling</p>
                    <p className="text-lg font-black text-text mt-0.5">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                    <p className="text-[11px] font-bold uppercase text-text-muted">Valuation</p>
                    <p className="text-lg font-black text-text mt-0.5">{formatCurrency(product.inventoryValue)}</p>
                  </div>
                </div>
              </div>

              {/* Profit/Loss Row & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-success" />
                    <span className="text-text-muted font-medium">Profit:</span>
                    <span className="font-bold text-success">{formatCurrency(product.profit)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-danger" />
                    <span className="text-text-muted font-medium">Loss:</span>
                    <span className="font-bold text-danger">{formatCurrency(product.loss)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center rounded-xl border border-border bg-background p-1">
                    <button
                      onClick={() => handleAdjustStock(product._id, 1)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-success hover:bg-success/15 transition"
                      title="Add +1 to stock"
                    >
                      <PlusIcon size={14} /> +1
                    </button>
                    <div className="w-[1px] h-4 bg-border mx-1"></div>
                    <button
                      onClick={() => handleAdjustStock(product._id, -1)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger/15 transition"
                      title="Subtract -1 from stock"
                    >
                      <Minus size={14} /> -1
                    </button>
                  </div>

                  <button
                    onClick={() => openEdit(product)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-text hover:border-primary transition shadow-xs"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(product._id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-danger hover:bg-danger hover:text-white transition shadow-xs"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Package size={32} />
              </div>
              <p className="text-lg font-bold text-text">No Products Found</p>
              <p className="text-sm text-text-muted mt-1">Try adjusting your search criteria or add a new product item.</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 mt-5 shadow-md shadow-primary/20 hover:bg-primary-hover transition"
              >
                <Plus size={16} />
                Add Product
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 shadow-xs">
              <div className="text-xs font-bold text-text-muted">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-text hover:bg-surface disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-text hover:bg-surface disabled:opacity-40 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Catalog Item</p>
                <h2 className="text-xl font-black text-text">
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-text-muted hover:bg-background hover:text-text transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">
                    Product Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Category</label>
                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
                    placeholder="e.g., Electronics"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
                    placeholder="Stock keeping unit"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Quantity & Unit</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                    />
                    <select
                      value={form.unit || 'pcs'}
                      onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                      className="w-24 rounded-xl border border-border bg-background px-2.5 py-2.5 text-xs font-bold text-text focus:border-primary focus:outline-hidden transition"
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

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Product Image (Cloudinary Upload)</label>
                  <div className="flex items-center gap-4">
                    {form.image && <img src={form.image} alt="Preview" className="h-14 w-14 rounded-xl object-cover border border-border bg-background shrink-0" />}
                    <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-border bg-background/50 p-3.5 text-center text-xs font-semibold text-text-muted hover:border-primary hover:text-text transition">
                      {uploadingImage ? 'Uploading image...' : form.image ? 'Click to Change Image' : 'Click to Upload Product Image'}
                      <input type="file" accept="image/*" onChange={handleProductImageUpload} disabled={uploadingImage} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Buying Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buyingPrice}
                    onChange={(event) => setForm((current) => ({ ...current, buyingPrice: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-text-muted">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition resize-none"
                    rows="3"
                    placeholder="Add optional product details..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-text hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition"
                >
                  {editingId ? 'Save Changes' : 'Create Product'}
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