import mongoose from "mongoose";

const supplierLedgerEntrySchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      // credit = We took goods (We Owe), debit = We Paid (Advance)
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"],
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

supplierLedgerEntrySchema.index({ supplier: 1, date: -1 });

const SupplierLedgerEntry = mongoose.model(
  "SupplierLedgerEntry",
  supplierLedgerEntrySchema,
);
export default SupplierLedgerEntry;
