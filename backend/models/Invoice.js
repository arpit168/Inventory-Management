import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 }, // e.g. 0, 5, 12, 18, 28
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    businessProfile: {
      businessName: { type: String },
      ownerName: { type: String },
      logo: { type: String },
      email: { type: String },
      phone: { type: String },
      gstNumber: { type: String },
      address: { type: String },
    },
    items: [invoiceItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial'],
      default: 'unpaid',
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: 'Thank you for your business!',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ invoiceNumber: 1, createdBy: 1 }, { unique: true });
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
