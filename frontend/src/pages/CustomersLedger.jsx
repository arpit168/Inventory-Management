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

const CustomersLedger = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    totalReceivable: 0,
    totalAdvance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustBalance, setNewCustBalance] = useState(0);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [entryType, setEntryType] = useState("credit"); // credit = gave to customer, debit = got from customer
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDesc, setEntryDesc] = useState("");

  useScrollLock(isAddCustomerOpen || isEntryModalOpen);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers", {
        params: search ? { search } : {},
      });
      setCustomers(res.data.customers || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchLedger = useCallback(
    async (customerId) => {
      setLedgerLoading(true);
      try {
        const res = await api.get(`/customers/${customerId}/ledger`);
        setSelectedCustomer(res.data.customer);
        setLedgerEntries(res.data.entries || []);
      } catch {
        showToast("Failed to load ledger entries", "error");
      } finally {
        setLedgerLoading(false);
      }
    },
    [showToast],
  );

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast("Name and Phone are required", "warning");
      return;
    }

    try {
      await api.post("/customers", {
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
        openingBalance: Number(newCustBalance) || 0,
      });
      showToast("Customer added successfully", "success");
      setIsAddCustomerOpen(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustAddress("");
      setNewCustBalance(0);
      fetchCustomers();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add customer",
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
          `/customers/${selectedCustomer._id}/ledger/${editingEntryId}`,
          {
            type: entryType,
            amount: Number(entryAmount),
            description: entryDesc,
          },
        );
        showToast("Transaction updated", "success");
      } else {
        await api.post(`/customers/${selectedCustomer._id}/ledger`, {
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
      fetchLedger(selectedCustomer._id);
      fetchCustomers();
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
        "Are you sure you want to delete this ledger entry? This will adjust the customer balance.",
      )
    )
      return;
    try {
      await api.delete(`/customers/${selectedCustomer._id}/ledger/${entryId}`);
      showToast("Transaction deleted", "success");
      fetchLedger(selectedCustomer._id);
      fetchCustomers();
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

  const handleDeleteCustomer = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${name} and all their ledger history?`,
      )
    )
      return;
    try {
      await api.delete(`/customers/${id}`);
      showToast("Customer deleted", "success");
      if (selectedCustomer?._id === id) setSelectedCustomer(null);
      fetchCustomers();
    } catch {
      showToast("Failed to delete customer", "error");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 max-w-full overflow-x-hidden animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
            Ledger Suite
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Khatabook Customer Ledger
          </h1>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition active:scale-95 shrink-0"
        >
          <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
              Total Customers
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {summary.totalCustomers || 0}
            </p>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-3 sm:p-3.5 text-blue-500 dark:text-blue-400">
            <BookOpen size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
              Total Due (Receivable)
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
              ₹{(summary.totalReceivable || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-red-500/10 p-3 sm:p-3.5 text-red-600 dark:text-red-400">
            <ArrowUpRight size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
              Total Advance Given
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">
              ₹{(summary.totalAdvance || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-green-500/10 p-3 sm:p-3.5 text-green-600 dark:text-green-400">
            <ArrowDownLeft size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Left Side: Customer List */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[120px]">
              <Search
                size={14}
                className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                type="text"
                placeholder="Search customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
              />
            </div>
            <button
              onClick={fetchCustomers}
              title="Refresh List"
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition shrink-0 shadow-sm"
            >
              <RefreshCw size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] pr-1">
            {loading ? (
              <LoadingSkeleton count={6} />
            ) : customers.length === 0 ? (
              <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-12">
                No customers found.
              </p>
            ) : (
              customers.map((cust) => {
                const isSelected = selectedCustomer?._id === cust._id;
                const balance = cust.netBalance || 0;
                const isDue = balance > 0;
                const isAdvance = balance < 0;

                return (
                  <div
                    key={cust._id}
                    onClick={() => fetchLedger(cust._id)}
                    className={`cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-200 flex items-center justify-between gap-2 sm:gap-3 ${
                      isSelected
                        ? "border-blue-500 dark:border-blue-400 bg-blue-500/10 shadow-sm font-semibold"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                        {cust.name}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Phone size={10} className="sm:w-3 sm:h-3" />
                        <span>{cust.phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm sm:text-base font-black ${isDue ? "text-red-600 dark:text-red-400" : isAdvance ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        ₹{Math.abs(balance).toFixed(2)}
                      </p>
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5 shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
          {!selectedCustomer ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8 sm:p-12">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 mb-4">
                <BookOpen size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Select a Customer
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Click on any customer from the list on the left to view their
                detailed transaction ledger and record entries.
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Selected Customer Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-3 sm:mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                    {selectedCustomer.name}
                  </h2>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    <span>📞 {selectedCustomer.phone}</span>
                    {selectedCustomer.email && (
                      <span className="hidden sm:inline">
                        ✉️ {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                  {selectedCustomer.address && (
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                      📍 {selectedCustomer.address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingEntryId(null);
                      setEntryAmount("");
                      setEntryDesc("");
                      setIsEntryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow-sm transition"
                  >
                    <Plus size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="hidden xs:inline">New Entry</span>
                    <span className="xs:hidden">Add</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteCustomer(
                        selectedCustomer._id,
                        selectedCustomer.name,
                      )
                    }
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-1.5 sm:p-2 text-red-500 dark:text-red-400 hover:border-red-500 dark:hover:border-red-400 hover:bg-red-500 hover:text-white dark:hover:text-white transition shadow-sm"
                    title="Delete Customer"
                  >
                    <Trash2 size={12} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Balance Summary Banner */}
              <div
                className={`rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  selectedCustomer.netBalance > 0
                    ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                    : selectedCustomer.netBalance < 0
                      ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Net Balance
                  </p>
                  <p className="text-lg sm:text-xl font-black mt-0.5">
                    ₹{Math.abs(selectedCustomer.netBalance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  <span className="inline-block w-full sm:w-auto text-center rounded-full bg-white dark:bg-gray-800 px-2.5 sm:px-3 py-1 text-[8px] sm:text-xs font-extrabold shadow-sm border border-gray-200 dark:border-gray-700">
                    {selectedCustomer.netBalance > 0
                      ? "YOU WILL GET (DUE)"
                      : selectedCustomer.netBalance < 0
                        ? "YOU WILL GIVE (ADVANCE)"
                        : "SETTLED"}
                  </span>
                </div>
              </div>

              {/* Ledger Entries List */}
              <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 max-h-[200px] sm:max-h-[300px] lg:max-h-[400px]">
                {ledgerLoading ? (
                  <LoadingSkeleton count={4} />
                ) : ledgerEntries.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-12">
                    No ledger entries recorded yet.
                  </p>
                ) : (
                  ledgerEntries.map((entry) => {
                    const isCredit = entry.type === "credit";
                    return (
                      <div
                        key={entry._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 sm:p-3.5 hover:border-gray-400 dark:hover:border-gray-500 transition gap-2 sm:gap-3"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
                          <div
                            className={`rounded-xl p-1.5 sm:p-2.5 shrink-0 ${isCredit ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-green-500/15 text-green-600 dark:text-green-400"}`}
                          >
                            {isCredit ? (
                              <ArrowUpRight
                                size={14}
                                className="sm:w-[18px] sm:h-[18px]"
                              />
                            ) : (
                              <ArrowDownLeft
                                size={14}
                                className="sm:w-[18px] sm:h-[18px]"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                              {entry.description ||
                                (isCredit
                                  ? "Credit Given"
                                  : "Payment Received")}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 w-full sm:w-auto flex flex-row sm:flex-col items-center justify-between sm:items-end gap-1 sm:gap-2">
                          <p
                            className={`text-sm sm:text-base font-black ${isCredit ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                          >
                            {isCredit ? "+" : "-"} ₹{entry.amount.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:inline">
                              {isCredit ? "Gave" : "Got"}
                            </span>
                            <button
                              onClick={() => openEditEntry(entry)}
                              className="text-[9px] sm:text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry._id)}
                              className="text-[9px] sm:text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                            >
                              Del
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

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-2xl animate-scale-up my-8 sm:my-0">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                Add New Customer
              </h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="rounded-xl p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCustomer}
              className="mt-4 sm:mt-5 space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Aleandro"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Market Road, Shop #12"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Opening Due Balance (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newCustBalance}
                  onChange={(e) => setNewCustBalance(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
                <p className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Enter positive for previous due, negative if advance received.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition w-full sm:w-auto"
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-2xl animate-scale-up my-8 sm:my-0">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
              <div>
                <p className="text-[8px] sm:text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Record Transaction
                </p>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  {selectedCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="rounded-xl p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            <form
              onSubmit={handleAddOrEditEntry}
              className="mt-4 sm:mt-5 space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryType("credit")}
                    className={`rounded-xl border px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      entryType === "credit"
                        ? "border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                    <span>You Gave</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryType("debit")}
                    className={`rounded-xl border px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      entryType === "debit"
                        ? "border-green-500 bg-green-500/15 text-green-600 dark:text-green-400 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <ArrowDownLeft size={14} className="sm:w-4 sm:h-4" />
                    <span>You Got</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
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
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-base sm:text-lg font-black text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g., Grocery items purchased on credit"
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition w-full sm:w-auto ${
                    entryType === "credit"
                      ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-red-500/20"
                      : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-green-500/20"
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

export default CustomersLedger;
