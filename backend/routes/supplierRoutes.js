import express from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
} from "../controllers/supplierController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getSuppliers).post(createSupplier);
router.route("/:id").put(updateSupplier).delete(deleteSupplier);
router.route("/:id/ledger").get(getSupplierLedger).post(addLedgerEntry);
router
  .route("/:id/ledger/:entryId")
  .put(updateLedgerEntry)
  .delete(deleteLedgerEntry);

export default router;
