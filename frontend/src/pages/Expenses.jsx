import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Wallet,
  Trash2,
  X,
  PieChart,
  Calendar,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useScrollLock } from "../hooks/useScrollLock";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const CATEGORIES = [
  "All",
  "Rent",
  "Utilities",
  "Salary",
  "Supplies",
  "Maintenance",
  "Marketing",
  "Other",
];

const Expenses = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [expCat, setExpCat] = useState("Supplies");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [desc, setDesc] = useState("");

  useScrollLock(isAddOpen);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== "All") params.category = category;
      if (search) params.search = search;

      const res = await api.get("/expenses", { params });
      setExpenses(res.data.expenses || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, [category, search, showToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      showToast("Enter valid title and positive amount", "warning");
      return;
    }

    try {
      await api.post("/expenses", {
        title,
        category: expCat,
        amount: Number(amount),
        date,
        description: desc,
      });
      showToast("Expense recorded successfully", "success");
      setIsAddOpen(false);
      setTitle("");
      setAmount("");
      setDesc("");
      fetchExpenses();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to record expense",
        "error",
      );
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete expense "${name}"?`)) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast("Expense removed", "success");
      fetchExpenses();
    } catch {
      showToast("Failed to delete expense", "error");
    }
  };

  // Find top category
  let topCat = "None";
  let topVal = 0;
  if (summary.byCategory) {
    for (const [key, val] of Object.entries(summary.byCategory)) {
      if (val > topVal) {
        topVal = val;
        topCat = key;
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
            Expense Analytics
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
            Shop & Business Expenses
          </h1>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition shrink-0 active:scale-98"
        >
          <Plus size={18} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Total Recorded Expenses
            </p>
            <p className="mt-1 text-2xl font-black text-danger">
              ₹{summary.totalAmount?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="rounded-2xl bg-danger/10 p-3.5 text-danger">
            <Wallet size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Highest Spending Category
            </p>
            <p className="mt-1 text-2xl font-black text-primary truncate">
              {topCat}{" "}
              <span className="text-sm font-bold text-text-muted">
                {topVal > 0 ? `(₹${topVal.toFixed(2)})` : ""}
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <PieChart size={24} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search expenses by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
            />
          </div>
          <button
            onClick={fetchExpenses}
            title="Refresh List"
            className="rounded-xl border border-border bg-background p-2 text-text hover:border-primary transition shrink-0 shadow-xs"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                category === cat
                  ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                  : "border border-border bg-background text-text-muted hover:text-text hover:border-text-muted/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-4">
              <Wallet size={32} />
            </div>
            <h3 className="text-lg font-bold text-text">
              No Expenses Recorded
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Try switching category filter or record a new expense.
            </p>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-border bg-background/70 text-xs uppercase tracking-wider font-bold text-text-muted">
                  <tr>
                    <th className="py-3.5 px-5">Title</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((exp) => (
                    <tr
                      key={exp._id}
                      className="hover:bg-background/50 transition-colors"
                    >
                      <td className="py-4 px-5 font-bold text-text">
                        {exp.title}
                        {exp.description && (
                          <p className="text-xs font-normal text-text-muted mt-0.5">
                            {exp.description}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-text-muted font-medium flex items-center gap-1.5">
                        <Calendar size={14} className="text-text-muted" />{" "}
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 font-black text-danger">
                        ₹{Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDelete(exp._id, exp.title)}
                          title="Delete Expense"
                          className="rounded-xl p-2 text-danger hover:bg-danger/15 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block sm:hidden divide-y divide-border">
              {expenses.map((exp) => (
                <div
                  key={exp._id}
                  className="p-4 hover:bg-background/50 transition-colors flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-text">{exp.title}</h4>
                      {exp.description && (
                        <p className="text-xs font-normal text-text-muted mt-0.5">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-danger text-lg">
                        ₹{Number(exp.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-extrabold text-primary uppercase tracking-wider">
                        {exp.category}
                      </span>
                      <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                        <Calendar size={12} />{" "}
                        {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(exp._id, exp.title)}
                      title="Delete Expense"
                      className="rounded-xl p-2 text-danger bg-danger/10 hover:bg-danger/20 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-2xl animate-scale-up my-8 sm:my-0">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Financial Log
                </p>
                <h3 className="text-lg font-black text-text">
                  Record New Expense
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-2 text-text-muted hover:bg-background hover:text-text rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Electricity Bill / Shop Repair"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Category
                </label>
                <select
                  value={expCat}
                  onChange={(e) => setExpCat(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="1250.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base font-black text-danger focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">
                  Description / Notes
                </label>
                <input
                  type="text"
                  placeholder="Paid via UPI to vendor"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-border bg-background px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-text hover:bg-surface transition w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition w-full sm:w-auto"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
