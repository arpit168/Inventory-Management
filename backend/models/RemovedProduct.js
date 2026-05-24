import mongoose from 'mongoose';

const removedProductSchema = new mongoose.Schema(
  {
    name: String,

    category: String,

    buyingPrice: Number,

    sellingPrice: Number,

    quantity: Number,

    profit: Number,

    loss: Number,

    remainingStockValue: Number,

    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const RemovedProduct = mongoose.model(
  'RemovedProduct',
  removedProductSchema
);

export default RemovedProduct;