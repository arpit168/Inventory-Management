import express from "express";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
} from "../controllers/customerController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getCustomers).post(createCustomer);
router.route("/:id").put(updateCustomer).delete(deleteCustomer);
router.route("/:id/ledger").get(getCustomerLedger).post(addLedgerEntry);
router
  .route("/:id/ledger/:entryId")
  .put(updateLedgerEntry)
  .delete(deleteLedgerEntry);

export default router;
