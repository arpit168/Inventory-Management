import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getOutOfStockProducts,
  getAnalytics,
} from "../controllers/productController.js";

const router = express.Router();

router.use(protect);

router.get("/", getProducts);

router.get("/out-of-stock", getOutOfStockProducts);

router.get("/analytics", getAnalytics);

router.post("/", createProduct);

router.put("/:id", updateProduct);

router.patch("/:id/adjust-stock", adjustStock);

router.delete("/:id", deleteProduct);

export default router;
