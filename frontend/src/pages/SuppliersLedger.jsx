import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  UserPlus,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  X,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useScrollLock } from "../hooks/useScrollLock";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const SuppliersLedger = () => {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    totalPayable: 0,
    totalAdvance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSuppName, setNewSuppName] = useState("");
  const [newSuppPhone, setNewSuppPhone] = useState("");
  const [newSuppEmail, setNewSuppEmail] = useState("");
  const [newSuppAddress, setNewSuppAddress] = useState("");
  const [newSuppBalance, setNewSuppBalance] = useState(0);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [entryType, setEntryType] = useState("credit"); // credit = Gave, debit = Got
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDesc, setEntryDesc] = useState("");

  useScrollLock(isAddSupplierOpen || isEntryModalOpen);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/suppliers", {
        params: search ? { search } : {},
      });
      setSuppliers(res.data.suppliers || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      showToast("Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const fetchLedger = useCallback(
    async (supplierId) => {
      setLedgerLoading(true);
      try {
        const res = await api.get(`/suppliers/${supplierId}/ledger`);
        setSelectedSupplier(res.data.supplier);
        setLedgerEntries(res.data.entries || []);
      } catch {
        showToast("Failed to load ledger entries", "error");
      } finally {
        setLedgerLoading(false);
      }
    },
    [showToast],
  );

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!newSuppName.trim() || !newSuppPhone.trim()) {
      showToast("Name and Phone are required", "warning");
      return;
    }

    try {
      await api.post("/suppliers", {
        name: newSuppName,
        phone: newSuppPhone,
        email: newSuppEmail,
        address: newSuppAddress,
        openingBalance: Number(newSuppBalance) || 0,
      });
      showToast("Supplier added successfully", "success");
      setIsAddSupplierOpen(false);
      setNewSuppName("");
      setNewSuppPhone("");
      setNewSuppEmail("");
      setNewSuppAddress("");
      setNewSuppBalance(0);
      fetchSuppliers();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add supplier",
        "error",
      );
    }
  };

  const handleAddOrEditEntry = async (e) => {
    e.preventDefault();
    if (!entryAmount || Number(entryAmount) <= 0) {
      showToast("Enter a positive amount", "warning");
      return;
    }

    try {
      if (isEditMode) {
        await api.put(
          `/suppliers/${selectedSupplier._id}/ledger/${editingEntryId}`,
          {
            type: entryType,
            amount: Number(entryAmount),
            description: entryDesc,
          },
        );
        showToast("Transaction updated", "success");
      } else {
        await api.post(`/suppliers/${selectedSupplier._id}/ledger`, {
          type: entryType,
          amount: Number(entryAmount),
          description: entryDesc,
        });
        showToast("Transaction recorded", "success");
      }
      setIsEntryModalOpen(false);
      setEntryAmount("");
      setEntryDesc("");
      setIsEditMode(false);
      setEditingEntryId(null);
      fetchLedger(selectedSupplier._id);
      fetchSuppliers();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to record entry",
        "error",
      );
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this ledger entry? This will adjust the supplier balance.",
      )
    )
      return;
    try {
      await api.delete(`/suppliers/${selectedSupplier._id}/ledger/${entryId}`);
      showToast("Transaction deleted", "success");
      fetchLedger(selectedSupplier._id);
      fetchSuppliers();
    } catch {
      showToast("Failed to delete entry", "error");
    }
  };

  const openEditEntry = (entry) => {
    setEntryType(entry.type);
    setEntryAmount(entry.amount);
    setEntryDesc(entry.description);
    setEditingEntryId(entry._id);
    setIsEditMode(true);
    setIsEntryModalOpen(true);
  };

  const handleDeleteSupplier = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${name} and all their ledger history?`,
      )
    )
      return;
    try {
      await api.delete(`/suppliers/${id}`);
      showToast("Supplier deleted", "success");
      if (selectedSupplier?._id === id) setSelectedSupplier(null);
      fetchSuppliers();
    } catch {
      showToast("Failed to delete supplier", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
            Ledger Suite
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
            Khatabook Supplier Ledger
          </h1>
        </div>

        <button
          onClick={() => setIsAddSupplierOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition shrink-0 active:scale-98"
        >
          <UserPlus size={18} />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Total Suppliers
            </p>
            <p className="mt-1 text-2xl font-black text-text">
              {summary.totalSuppliers || 0}
            </p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Total Payable (We Owe)
            </p>
            <p className="mt-1 text-2xl font-black text-danger">
              ₹{(summary.totalPayable || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-danger/10 p-3.5 text-danger">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Total Advance (They Owe)
            </p>
            <p className="mt-1 text-2xl font-black text-success">
              ₹{(summary.totalAdvance || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-success/10 p-3.5 text-success">
            <ArrowDownLeft size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Left Side: Supplier List */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search supplier name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
              />
            </div>
            <button
              onClick={fetchSuppliers}
              title="Refresh List"
              className="rounded-xl border border-border bg-background p-2 text-text hover:border-primary transition shrink-0 shadow-xs"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-150 pr-1">
            {loading ? (
              <LoadingSkeleton count={6} />
            ) : suppliers.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-12">
                No suppliers found.
              </p>
            ) : (
              suppliers.map((cust) => {
                const isSelected = selectedSupplier?._id === cust._id;
                const balance = cust.netBalance || 0;
                const isDue = balance > 0;
                const isAdvance = balance < 0;

                return (
                  <div
                    key={cust._id}
                    onClick={() => fetchLedger(cust._id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm font-semibold"
                        : "border-border bg-background hover:border-text-muted/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text truncate">
                        {cust.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                        <Phone size={12} />
                        <span>{cust.phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-black ${isDue ? "text-danger" : isAdvance ? "text-success" : "text-text-muted"}`}
                      >
                        ₹{Math.abs(balance).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {isDue ? "Due" : isAdvance ? "Advance" : "Settled"}
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
          {!selectedSupplier ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-text">Select a Supplier</h3>
              <p className="mt-1 text-sm text-text-muted max-w-xs">
                Click on any supplier from the list on the left to view their
                detailed transaction ledger and record entries.
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Selected Supplier Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-text">
                    {selectedSupplier.name}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted mt-1 font-medium">
                    <span>📞 {selectedSupplier.phone}</span>
                    {selectedSupplier.email && (
                      <span>✉️ {selectedSupplier.email}</span>
                    )}
                  </div>
                  {selectedSupplier.address && (
                    <p className="text-xs text-text-muted mt-1">
                      📍 {selectedSupplier.address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingEntryId(null);
                      setEntryAmount("");
                      setEntryDesc("");
                      setIsEntryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-primary-hover transition"
                  >
                    <Plus size={14} />
                    <span>New Entry</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteSupplier(
                        selectedSupplier._id,
                        selectedSupplier.name,
                      )
                    }
                    className="rounded-xl border border-border bg-background p-2 text-danger hover:bg-danger hover:text-white transition shadow-xs"
                    title="Delete Supplier"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Balance Summary Banner */}
              <div
                className={`rounded-2xl p-4 mb-6 flex items-center justify-between ${
                  selectedSupplier.netBalance > 0
                    ? "bg-danger/10 border border-danger/20 text-danger"
                    : selectedSupplier.netBalance < 0
                      ? "bg-success/10 border border-success/20 text-success"
                      : "bg-background border border-border text-text"
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Net Balance
                  </p>
                  <p className="text-xl font-black mt-0.5">
                    ₹{Math.abs(selectedSupplier.netBalance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-extrabold shadow-xs">
                    {selectedSupplier.netBalance > 0
                      ? "WE WILL GIVE (PAYABLE)"
                      : selectedSupplier.netBalance < 0
                        ? "WE WILL GET (ADVANCE)"
                        : "SETTLED"}
                  </span>
                </div>
              </div>

              {/* Ledger Entries List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-105">
                {ledgerLoading ? (
                  <LoadingSkeleton count={4} />
                ) : ledgerEntries.length === 0 ? (
                  <p className="text-center text-xs text-text-muted py-12">
                    No ledger entries recorded yet.
                  </p>
                ) : (
                  ledgerEntries.map((entry) => {
                    const isCredit = entry.type === "credit";
                    return (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5 hover:border-text-muted/40 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`rounded-xl p-2.5 shrink-0 ${isCredit ? "bg-danger/15 text-danger" : "bg-success/15 text-success"}`}
                          >
                            {isCredit ? (
                              <ArrowUpRight size={18} />
                            ) : (
                              <ArrowDownLeft size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text truncate">
                              {entry.description ||
                                (isCredit
                                  ? "Goods Received (We Owe)"
                                  : "Payment Given (Advance)")}
                            </p>
                            <p className="text-[11px] text-text-muted">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3 flex flex-col items-end">
                          <p
                            className={`text-sm font-black ${isCredit ? "text-danger" : "text-success"}`}
                          >
                            {isCredit ? "+" : "-"} ₹{entry.amount.toFixed(2)}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            {isCredit
                              ? "Got Goods (Payable)"
                              : "Gave Money (Advance)"}
                          </span>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => openEditEntry(entry)}
                              className="text-xs text-primary hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry._id)}
                              className="text-xs text-danger hover:underline"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-2xl animate-scale-up my-8 sm:my-0">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-black text-text">Add New Supplier</h3>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="rounded-xl p-2 text-text-muted hover:bg-background transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="john aleandro"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={newSuppPhone}
                  onChange={(e) => setNewSuppPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={newSuppEmail}
                  onChange={(e) => setNewSuppEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Market Road, Shop #12"
                  value={newSuppAddress}
                  onChange={(e) => setNewSuppAddress(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Opening Due Balance (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newSuppBalance}
                  onChange={(e) => setNewSuppBalance(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Enter positive for previous due, negative if advance received.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="rounded-xl border border-border bg-background px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-text hover:bg-surface transition w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition w-full sm:w-auto"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Entry Modal */}
      {isEntryModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-2xl animate-scale-up my-8 sm:my-0">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-primary">
                  Record Transaction
                </p>
                <h3 className="text-lg font-black text-text">
                  {selectedSupplier.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="rounded-xl p-2 text-text-muted hover:bg-background transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOrEditEntry} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryType("credit")}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
                      entryType === "credit"
                        ? "border-danger bg-danger/15 text-danger shadow-xs"
                        : "border-border bg-background text-text-muted hover:text-text"
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    <span>WE GOT GOODS (Payable)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryType("debit")}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
                      entryType === "debit"
                        ? "border-success bg-success/15 text-success shadow-xs"
                        : "border-border bg-background text-text-muted hover:text-text"
                    }`}
                  >
                    <ArrowDownLeft size={16} />
                    <span>WE GAVE MONEY (Advance)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Amount (₹) *
                </label>
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
                <label className="block text-xs font-bold text-text-muted mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g., Grocery items purchased on credit"
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="rounded-xl border border-border bg-background px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-text hover:bg-surface transition w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition w-full sm:w-auto ${
                    entryType === "credit"
                      ? "bg-danger hover:bg-red-600 shadow-danger/20"
                      : "bg-success hover:bg-emerald-600 shadow-success/20"
                  }`}
                >
                  {isEditMode ? "Update Entry" : "Record Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersLedger;
