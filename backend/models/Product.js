import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: String,

    quantityDelta: Number,

    previousQuantity: Number,

    newQuantity: Number,

    note: String,
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        'Product name is required',
      ],
      trim: true,
    },

    category: {
      type: String,
      default: 'General',
      trim: true,
    },

    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    unit: {
      type: String,
      default: 'pcs',
      trim: true,
    },

    image: {
      type: String,
      default: '',
    },

    quantity: {
      type: Number,

      required: [
        true,
        'Quantity is required',
      ],

      min: [
        0,
        'Quantity cannot be negative',
      ],

      default: 0,
    },

    buyingPrice: {
      type: Number,

      required: [
        true,
        'Buying price is required',
      ],

      min: [
        0,
        'Buying price must be positive',
      ],
    },

    sellingPrice: {
      type: Number,

      required: [
        true,
        'Selling price is required',
      ],

      min: [
        0,
        'Selling price must be positive',
      ],
    },

    lowStockThreshold: {
      type: Number,

      default: 5,

      min: [
        0,
        'Low stock threshold must be positive',
      ],
    },

    description: {
      type: String,
      default: '',
    },

    status: {
      type: String,

      enum: [
        'in_stock',
        'out_of_stock',
      ],

      default: 'in_stock',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    activityLogs: [activityLogSchema],

    lowStockAlertSent: {
      type: Boolean,
      default: false,
    },

    outOfStockAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ createdBy: 1 });
productSchema.index({ createdBy: 1, status: 1 });
productSchema.index({ createdBy: 1, category: 1 });

const Product = mongoose.model(
  'Product',
  productSchema
);

export default Product;