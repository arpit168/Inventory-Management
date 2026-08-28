import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useScrollLock } from "../hooks/useScrollLock";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import InvoicePrintView from "../components/InvoicePrintView";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const Invoices = () => {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useScrollLock(isCreateOpen || !!selectedInvoice);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get("/invoices", { params });
      setInvoices(res.data.invoices || []);
    } catch {
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleStatusToggle = async (invoice) => {
    const nextStatus = invoice.status === "paid" ? "unpaid" : "paid";
    try {
      await api.put(`/invoices/${invoice._id}`, { status: nextStatus });
      showToast(`Marked as ${nextStatus.toUpperCase()}`, "success");
      fetchInvoices();
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;
    try {
      await api.delete(`/invoices/${id}`);
      showToast("Invoice deleted", "success");
      fetchInvoices();
    } catch {
      showToast("Failed to delete invoice", "error");
    }
  };

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner & Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Total Invoices
            </p>
            <p className="mt-1 text-2xl font-black text-text">
              {invoices.length}
            </p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <FileText size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Paid Revenue
            </p>
            <p className="mt-1 text-2xl font-black text-success">
              ₹{totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-success/10 p-3.5 text-success">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-text-muted">
              Pending Dues
            </p>
            <p className="mt-1 text-2xl font-black text-warning">
              ₹{pendingAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-warning/10 p-3.5 text-warning">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search invoice # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid Only</option>
          </select>

          <button
            onClick={fetchInvoices}
            title="Refresh List"
            className="rounded-xl border border-border bg-background p-2.5 text-text hover:border-primary transition self-start sm:self-auto shadow-xs"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition shrink-0 active:scale-98"
        >
          <Plus size={18} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-text">No Invoices Found</h3>
            <p className="mt-1 text-sm text-text-muted">
              Try adjusting your search criteria or create a new billing
              invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4 p-4">
              {invoices.map((inv) => {
                const isPaid = inv.status === "paid";
                return (
                  <div
                    key={inv._id}
                    className="rounded-xl border border-border bg-background p-4 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start border-b border-border pb-3">
                      <div>
                        <span className="font-black text-primary block">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-text-muted mt-1 block">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStatusToggle(inv)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition shadow-xs ${
                          isPaid
                            ? "bg-success/15 text-success hover:bg-success hover:text-white"
                            : "bg-warning/15 text-warning hover:bg-warning hover:text-white"
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <AlertCircle size={12} />
                        )}
                        <span>{isPaid ? "PAID" : "UNPAID"}</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-text truncate max-w-[60%]">
                        {inv.customerName || "Walk-in Customer"}
                      </span>
                      <span className="font-black text-text">
                        ₹{(inv.grandTotal || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-1">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="rounded-xl border border-border bg-background p-2 text-text hover:border-primary hover:text-primary transition shadow-xs"
                        title="Print / View Invoice"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="rounded-xl border border-border bg-background p-2 text-danger hover:border-danger hover:bg-danger hover:text-white transition shadow-xs"
                        title="Delete Invoice"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <table className="hidden sm:table w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-border bg-background/70 text-xs uppercase tracking-wider font-bold text-text-muted">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "paid";
                  return (
                    <tr
                      key={inv._id}
                      className="hover:bg-background/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-black text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 font-bold text-text">
                        {inv.customerName || "Walk-in Customer"}
                      </td>
                      <td className="px-5 py-4 text-text-muted font-medium">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-black text-text">
                        ₹{(inv.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleStatusToggle(inv)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition shadow-xs ${
                            isPaid
                              ? "bg-success/15 text-success hover:bg-success hover:text-white"
                              : "bg-warning/15 text-warning hover:bg-warning hover:text-white"
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          <span>{isPaid ? "PAID" : "UNPAID"}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="rounded-xl border border-border bg-background p-2 text-text hover:border-primary hover:text-primary transition shadow-xs"
                            title="Print / View Invoice"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className="rounded-xl border border-border bg-background p-2 text-danger hover:border-danger hover:bg-danger hover:text-white transition shadow-xs"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <CreateInvoiceModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchInvoices();
          }}
        />
      )}

      {selectedInvoice && (
        <InvoicePrintView
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default Invoices;
