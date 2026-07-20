import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    totalAdvance: {
      type: Number,
      default: 0,
    },
    totalPayable: {
      type: Number,
      default: 0,
    },
    netBalance: {
      type: Number,
      default: 0,
      // positive = we owe them (Payable), negative = they owe us (Advance)
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

supplierSchema.index({ createdBy: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
