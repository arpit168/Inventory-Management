import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  emailInvoice,
} from '../controllers/invoiceController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getInvoices).post(createInvoice);
router.post('/:id/email', emailInvoice);
router.route('/:id').get(getInvoiceById).put(updateInvoice).delete(deleteInvoice);

export default router;
