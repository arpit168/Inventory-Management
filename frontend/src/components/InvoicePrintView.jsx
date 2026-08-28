import { useState } from "react";
import { X, Printer, Download, Mail } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const InvoicePrintView = ({ invoice, onClose }) => {
  const { showToast } = useToast();
  const [emailing, setEmailing] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    const targetEmail =
      invoice.customerEmail || prompt("Enter customer email address:", "");
    if (!targetEmail) return;

    setEmailing(true);
    try {
      await api.post(`/invoices/${invoice._id}/email`, { targetEmail });
      showToast(`Invoice emailed to ${targetEmail}!`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send email", "error");
    } finally {
      setEmailing(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(22);
      doc.setTextColor(6, 182, 212); // Primary Cyan
      doc.text("INVENTORY PRO SUITE", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Commercial Billing & Ledger Suite", 14, 26);
      doc.text(
        `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
        14,
        32,
      );

      // Invoice Details
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`INVOICE: ${invoice.invoiceNumber}`, 140, 20);
      doc.setFontSize(10);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 26);
      if (invoice.dueDate) {
        doc.text(
          `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
          140,
          32,
        );
      }

      // Customer Details
      doc.text("Billed To:", 14, 45);
      doc.setFontSize(12);
      doc.text(invoice.customerName || "N/A", 14, 51);
      doc.setFontSize(10);
      if (invoice.customerPhone)
        doc.text(`Phone: ${invoice.customerPhone}`, 14, 57);
      if (invoice.customerEmail)
        doc.text(`Email: ${invoice.customerEmail}`, 14, 63);
      if (invoice.customerAddress)
        doc.text(`Address: ${invoice.customerAddress}`, 14, 69);

      // Table items
      const tableColumn = [
        "Item Description",
        "Qty",
        "Unit Price (INR)",
        "Tax (%)",
        "Total (INR)",
      ];
      const tableRows = (invoice.items || []).map((item) => [
        item.name,
        item.quantity,
        `INR ${item.unitPrice.toFixed(2)}`,
        `${item.taxRate}%`,
        `INR ${item.total.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 75,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [6, 182, 212] },
      });

      const finalY = doc.lastAutoTable.finalY || 120;

      doc.text(
        `Subtotal: INR ${invoice.subTotal.toFixed(2)}`,
        140,
        finalY + 10,
      );
      doc.text(
        `Tax Total: INR ${invoice.taxTotal.toFixed(2)}`,
        140,
        finalY + 16,
      );
      doc.text(
        `Discount: INR ${invoice.discount.toFixed(2)}`,
        140,
        finalY + 22,
      );
      doc.setFontSize(12);
      doc.text(
        `Grand Total: INR ${invoice.grandTotal.toFixed(2)}`,
        140,
        finalY + 30,
      );

      doc.save(`${invoice.invoiceNumber}.pdf`);
      showToast("PDF downloaded successfully", "success");
    } catch {
      showToast("Failed to download PDF", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl text-text max-h-[90vh] overflow-y-auto print:max-w-none print:border-none print:shadow-none print:bg-white print:text-black print:p-0 animate-scale-up">
        {/* Actions bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-3 print:hidden shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h3 className="text-lg font-black text-text">Invoice Preview</h3>
            <button
              onClick={onClose}
              className="sm:hidden rounded-xl p-2 text-text-muted hover:bg-background hover:text-text transition"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleEmail}
              disabled={emailing}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-xl bg-success px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-white shadow-md hover:bg-success/90 transition disabled:opacity-50 whitespace-nowrap"
            >
              <Mail size={14} className="hidden sm:block" />{" "}
              {emailing ? "Sending..." : "Email"}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition whitespace-nowrap"
            >
              <Download size={14} className="hidden sm:block" /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-xl border border-border bg-background px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-text hover:border-primary transition shadow-xs whitespace-nowrap"
            >
              <Printer size={14} className="hidden sm:block" /> Print
            </button>
            <button
              onClick={onClose}
              className="hidden sm:block rounded-xl p-2 text-text-muted hover:bg-background hover:text-text transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="mt-6 space-y-8 print:mt-0 print:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border pb-6 print:border-black">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
              {invoice.businessProfile?.logo && (
                <img
                  src={invoice.businessProfile.logo}
                  alt="Shop Logo"
                  className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-xl border border-border print:border-black shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-black text-text print:text-black truncate">
                  {invoice.businessProfile?.businessName ||
                    "INVENTORY PRO SUITE"}
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-primary mt-0.5 print:text-cyan-700 truncate">
                  {invoice.businessProfile?.ownerName
                    ? `Proprietor: ${invoice.businessProfile.ownerName}`
                    : "COMMERCIAL BILLING"}
                </p>
                {invoice.businessProfile?.gstNumber && (
                  <p className="text-xs font-semibold text-text mt-1 print:text-black">
                    GSTIN: {invoice.businessProfile.gstNumber}
                  </p>
                )}
                {invoice.businessProfile?.address && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {invoice.businessProfile.address}
                  </p>
                )}
                {(invoice.businessProfile?.phone ||
                  invoice.businessProfile?.email) && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {[
                      invoice.businessProfile?.phone,
                      invoice.businessProfile?.email,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full sm:w-auto sm:text-right flex flex-row sm:flex-col items-center justify-between sm:items-end">
              <div className="flex items-center gap-2 sm:gap-0 sm:flex-col sm:items-end">
                <h2 className="text-lg sm:text-xl font-bold text-text print:text-black">
                  {invoice.invoiceNumber}
                </h2>
                <span
                  className={`inline-block sm:mt-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase ${
                    invoice.status === "paid"
                      ? "bg-success/15 text-success print:text-emerald-700"
                      : "bg-danger/15 text-danger print:text-rose-700"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              {invoice.dueDate && (
                <p className="text-[10px] sm:text-xs text-text-muted sm:mt-1">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Billed To */}
          <div className="rounded-2xl border border-border bg-background/60 p-5 print:border-slate-300 print:bg-slate-50">
            <p className="text-xs font-extrabold uppercase text-text-muted">
              Billed To:
            </p>
            <p className="text-lg font-black mt-1 text-text print:text-black">
              {invoice.customerName}
            </p>
            {invoice.customerPhone && (
              <p className="text-xs text-text-muted mt-0.5">
                Phone: {invoice.customerPhone}
              </p>
            )}
            {invoice.customerEmail && (
              <p className="text-xs text-text-muted mt-0.5">
                Email: {invoice.customerEmail}
              </p>
            )}
            {invoice.customerAddress && (
              <p className="text-xs text-text-muted mt-0.5">
                Address: {invoice.customerAddress}
              </p>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4 print:hidden">
              {(invoice.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-background p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start border-b border-border pb-2">
                    <span className="font-bold text-text">{item.name}</span>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Unit Price</span>
                    <span className="font-medium text-text">
                      ₹{item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">GST</span>
                    <span className="font-medium text-text">
                      {item.taxRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-bold text-text-muted">
                      Total
                    </span>
                    <span className="font-black text-text">
                      ₹{item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="hidden sm:table print:table w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b-2 border-border print:border-black text-xs uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-3 font-bold">Item Description</th>
                  <th className="py-3 px-3 font-bold">Qty</th>
                  <th className="py-3 px-3 font-bold">Unit Price</th>
                  <th className="py-3 px-3 font-bold">GST</th>
                  <th className="py-3 px-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-slate-300">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-3 font-bold text-text print:text-black">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-text print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-text-muted font-medium">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-text-muted font-medium">
                      {item.taxRate}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-text print:text-black">
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2.5 text-sm border-t border-border pt-4 print:border-black">
              <div className="flex justify-between text-text-muted font-medium">
                <span>Subtotal:</span>
                <span className="text-text font-bold print:text-black">
                  ₹{invoice.subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-text-muted font-medium">
                <span>Total GST / Tax:</span>
                <span className="text-text font-bold print:text-black">
                  ₹{invoice.taxTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-danger font-semibold print:text-rose-700">
                <span>Discount:</span>
                <span>- ₹{invoice.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-black text-text print:border-black print:text-black">
                <span>Grand Total:</span>
                <span className="text-primary print:text-black">
                  ₹{invoice.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-4 text-xs text-text-muted print:border-slate-300">
            <p className="font-bold text-text print:text-black">
              Notes & Terms:
            </p>
            <p className="mt-1">
              {invoice.notes ||
                "Thank you for choosing us! Please pay by the due date."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintView;
