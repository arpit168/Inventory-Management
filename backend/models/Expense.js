import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Rent', 'Utilities', 'Salary', 'Supplies', 'Maintenance', 'Marketing', 'Other'],
      default: 'Other',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: '',
    },
    receiptImage: {
      type: String,
      default: '',
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

expenseSchema.index({ createdBy: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
