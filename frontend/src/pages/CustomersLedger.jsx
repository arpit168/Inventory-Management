import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserPlus, Phone, ArrowUpRight, ArrowDownLeft, Trash2, X, BookOpen, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';


const CustomersLedger = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalCustomers: 0, totalReceivable: 0, totalAdvance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustBalance, setNewCustBalance] = useState(0);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('credit'); // credit = Gave, debit = Got
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDesc, setEntryDesc] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: search ? { search } : {} });
      setCustomers(res.data.customers || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchLedger = useCallback(async (customerId) => {
    setLedgerLoading(true);
    try {
      const res = await api.get(`/customers/${customerId}/ledger`);
      setSelectedCustomer(res.data.customer);
      setLedgerEntries(res.data.entries || []);
    } catch {
      showToast('Failed to load ledger entries', 'error');
    } finally {
      setLedgerLoading(false);
    }
  }, [showToast]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast('Name and Phone are required', 'warning');
      return;
    }

    try {
      await api.post('/customers', {
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
        openingBalance: Number(newCustBalance) || 0,
      });
      showToast('Customer added successfully', 'success');
      setIsAddCustomerOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustAddress('');
      setNewCustBalance(0);
      fetchCustomers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add customer', 'error');
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryAmount || Number(entryAmount) <= 0) {
      showToast('Enter a positive amount', 'warning');
      return;
    }

    try {
      await api.post(`/customers/${selectedCustomer._id}/ledger`, {
        type: entryType,
        amount: Number(entryAmount),
        description: entryDesc,
      });
      showToast('Transaction recorded', 'success');
      setIsEntryModalOpen(false);
      setEntryAmount('');
      setEntryDesc('');
      fetchLedger(selectedCustomer._id);
      fetchCustomers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record entry', 'error');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} and all their ledger history?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      showToast('Customer deleted', 'success');
      if (selectedCustomer?._id === id) setSelectedCustomer(null);
      fetchCustomers();
    } catch {
      showToast('Failed to delete customer', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">Ledger Suite</p>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Khatabook Customer Ledger</h1>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition shrink-0 active:scale-98"
        >
          <UserPlus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Total Customers</p>
            <p className="mt-1 text-2xl font-black text-text">{summary.totalCustomers || 0}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Total Due (Receivable)</p>
            <p className="mt-1 text-2xl font-black text-danger">₹{(summary.totalReceivable || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-danger/10 p-3.5 text-danger">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Total Advance Given</p>
            <p className="mt-1 text-2xl font-black text-success">₹{(summary.totalAdvance || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-success/10 p-3.5 text-success">
            <ArrowDownLeft size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        
        {/* Left Side: Customer List */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              />
            </div>
            <button
              onClick={fetchCustomers}
              title="Refresh List"
              className="rounded-xl border border-border bg-background p-2 text-text hover:border-primary transition shrink-0 shadow-xs"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-150 pr-1">
            {loading ? (
              <LoadingSkeleton count={6} />
            ) : customers.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-12">No customers found.</p>
            ) : (
              customers.map((cust) => {
                const isSelected = selectedCustomer?._id === cust._id;
                const balance = cust.balance || 0;
                const isDue = balance > 0;
                const isAdvance = balance < 0;

                return (
                  <div
                    key={cust._id}
                    onClick={() => fetchLedger(cust._id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm font-semibold'
                        : 'border-border bg-background hover:border-text-muted/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text truncate">{cust.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                        <Phone size={12} />
                        <span>{cust.phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black ${isDue ? 'text-danger' : isAdvance ? 'text-success' : 'text-text-muted'}`}>
                        ₹{Math.abs(balance).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {isDue ? 'Due' : isAdvance ? 'Advance' : 'Settled'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Ledger Detail View */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col min-h-125">
          {!selectedCustomer ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-text">Select a Customer</h3>
              <p className="mt-1 text-sm text-text-muted max-w-xs">
                Click on any customer from the list on the left to view their detailed transaction ledger and record entries.
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              
              {/* Selected Customer Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-text">{selectedCustomer.name}</h2>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted mt-1 font-medium">
                    <span>📞 {selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                  </div>
                  {selectedCustomer.address && <p className="text-xs text-text-muted mt-1">📍 {selectedCustomer.address}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEntryModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-primary-hover transition"
                  >
                    <Plus size={14} />
                    <span>New Entry</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer._id, selectedCustomer.name)}
                    className="rounded-xl border border-border bg-background p-2 text-danger hover:bg-danger hover:text-white transition shadow-xs"
                    title="Delete Customer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Balance Summary Banner */}
              <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between ${
                selectedCustomer.balance > 0 ? 'bg-danger/10 border border-danger/20 text-danger' :
                selectedCustomer.balance < 0 ? 'bg-success/10 border border-success/20 text-success' :
                'bg-background border border-border text-text'
              }`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Net Balance</p>
                  <p className="text-xl font-black mt-0.5">₹{Math.abs(selectedCustomer.balance || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-extrabold shadow-xs">
                    {selectedCustomer.balance > 0 ? 'YOU WILL GET (DUE)' : selectedCustomer.balance < 0 ? 'YOU WILL GIVE (ADVANCE)' : 'SETTLED'}
                  </span>
                </div>
              </div>

              {/* Ledger Entries List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-105">
                {ledgerLoading ? (
                  <LoadingSkeleton count={4} />
                ) : ledgerEntries.length === 0 ? (
                  <p className="text-center text-xs text-text-muted py-12">No ledger entries recorded yet.</p>
                ) : (
                  ledgerEntries.map((entry) => {
                    const isCredit = entry.type === 'credit';
                    return (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5 hover:border-text-muted/40 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`rounded-xl p-2.5 shrink-0 ${isCredit ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`}>
                            {isCredit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text truncate">{entry.description || (isCredit ? 'Credit Given' : 'Payment Received')}</p>
                            <p className="text-[11px] text-text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <p className={`text-sm font-black ${isCredit ? 'text-danger' : 'text-success'}`}>
                            {isCredit ? '+' : '-'} ₹{entry.amount.toFixed(2)}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            {isCredit ? 'Gave (Due)' : 'Got (Paid)'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-black text-text">Add New Customer</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="rounded-xl p-2 text-text-muted hover:bg-background transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="john aleandro"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Market Road, Shop #12"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Opening Due Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newCustBalance}
                  onChange={(e) => setNewCustBalance(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
                <p className="text-[10px] text-text-muted mt-1">Enter positive for previous due, negative if advance received.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-text hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Entry Modal */}
      {isEntryModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-primary">Record Transaction</p>
                <h3 className="text-lg font-black text-text">{selectedCustomer.name}</h3>
              </div>
              <button onClick={() => setIsEntryModalOpen(false)} className="rounded-xl p-2 text-text-muted hover:bg-background transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">Transaction Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryType('credit')}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
                      entryType === 'credit'
                        ? 'border-danger bg-danger/15 text-danger shadow-xs'
                        : 'border-border bg-background text-text-muted hover:text-text'
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    <span>YOU GAVE (Due)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryType('debit')}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
                      entryType === 'debit'
                        ? 'border-success bg-success/15 text-success shadow-xs'
                        : 'border-border bg-background text-text-muted hover:text-text'
                    }`}
                  >
                    <ArrowDownLeft size={16} />
                    <span>YOU GOT (Paid)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base font-black text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g., Grocery items purchased on credit"
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-text hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition ${
                    entryType === 'credit' ? 'bg-danger hover:bg-red-600 shadow-danger/20' : 'bg-success hover:bg-emerald-600 shadow-success/20'
                  }`}
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomersLedger;
