import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const CreateInvoiceModal = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [businessProfiles, setBusinessProfiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState('unpaid');
  const [notes] = useState('Thank you for your business!');

  const [items, setItems] = useState([
    { product: '', name: '', quantity: 1, unitPrice: 0, taxRate: 18 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, profRes, custRes] = await Promise.all([
          api.get('/products?limit=100'),
          api.get('/business-profile'),
          api.get('/customers'),
        ]);
        setProducts(prodRes.data.products || []);
        setCustomers(custRes.data.customers || []);
        const profList = profRes.data.profiles || [];
        setBusinessProfiles(profList);
        if (profList.length > 0) {
          const def = profList.find((p) => p.isDefault) || profList[0];
          setSelectedProfileId(def._id);
        }
      } catch {
        // ignore
      }
    };
    fetchData();
  }, []);

  const handleCustomerSelect = (e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    if (id) {
      const cust = customers.find(c => c._id === id);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        setCustomerEmail(cust.email || '');
        setCustomerAddress(cust.address || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { product: '', name: '', quantity: 1, unitPrice: 0, taxRate: 18 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'product' && value) {
        const selected = products.find((p) => p._id === value);
        if (selected) {
          updated[index].name = selected.name;
          updated[index].unitPrice = selected.sellingPrice;
        }
      }
      return updated;
    });
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const taxTotal = items.reduce((sum, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + (base * (Number(item.taxRate) || 0)) / 100;
  }, 0);
  const grandTotal = Math.max(0, subTotal + taxTotal - (Number(discount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Enter customer name', 'warning');
      return;
    }
    if (items.some((item) => !item.name.trim() || Number(item.unitPrice) < 0 || Number(item.quantity) < 1)) {
      showToast('Please check item names, positive quantities and prices', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/invoices', {
        customerId: selectedCustomerId || undefined,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        items,
        discount: Number(discount) || 0,
        status,
        notes,
        businessProfileId: selectedProfileId || undefined,
      });
      showToast('Invoice generated successfully!', 'success');
      onSuccess();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to generate invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-2xl max-h-none sm:max-h-[90vh] flex flex-col animate-scale-up my-8 sm:my-0">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">New Billing</p>
            <h3 className="text-xl font-black text-text">Create Invoice</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-background hover:text-text transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 overflow-visible sm:overflow-y-auto pr-1 flex-1">
          
          {/* Shop Profile Selector */}
          {businessProfiles.length > 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <label className="block text-xs font-bold text-primary mb-1">Issuing Business / Shop Identity</label>
              {businessProfiles.length === 1 ? (
                <div className="text-sm font-bold text-text flex items-center justify-between">
                  <span>🏢 {businessProfiles[0].businessName} ({businessProfiles[0].ownerName})</span>
                  <span className="text-xs font-normal text-text-muted">Auto-selected</span>
                </div>
              ) : (
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition mt-1"
                >
                  {businessProfiles.map((p) => (
                    <option key={p._id} value={p._id}>
                      🏢 {p.businessName} — {p.ownerName} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Customer info */}
          {customers.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-primary mb-1">Select Existing Customer (Links to Ledger)</label>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
              >
                <option value="">-- Walk-in / New Customer (No Ledger Link) --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="John Doe / Store Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Phone Number</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Billing Address</label>
              <input
                type="text"
                placeholder="City, State, ZIP"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-text">Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-slate-950 transition"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3 overflow-x-auto pb-1">
              {items.map((item, index) => (
                <div key={index} className="flex min-w-[650px] items-center gap-3 rounded-2xl border border-border bg-background/60 p-3">
                  <div className="w-1/4">
                    <select
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-hidden transition"
                    >
                      <option value="">Select Product / Custom</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (₹{p.sellingPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Item name"
                      required
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
                    />
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-hidden transition text-center"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-hidden transition text-right"
                    />
                  </div>

                  <div className="w-24">
                    <select
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-hidden transition"
                    >
                      <option value="0">0% GST</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-danger hover:bg-danger/15 rounded-xl transition"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Status */}
          <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-border">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">Payment Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid / Due</option>
                  <option value="partial">Partial Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-5 space-y-2.5 text-sm">
              <div className="flex justify-between text-text-muted font-medium">
                <span>Subtotal:</span>
                <span className="text-text font-bold">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-muted font-medium">
                <span>Total GST / Tax:</span>
                <span className="text-text font-bold">₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-danger font-semibold">
                <span>Discount:</span>
                <span>- ₹{(Number(discount) || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-black text-lg text-text">
                <span>Grand Total:</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-bold text-text hover:bg-surface transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
