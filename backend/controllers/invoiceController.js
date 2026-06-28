import Invoice from '../models/Invoice.js';
import BusinessProfile from '../models/BusinessProfile.js';
import { addNotification } from '../utils/notifications.js';
import { sendEmail, generateInvoiceEmailTemplate } from '../utils/email.js';

export const getInvoices = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { createdBy: req.user.id };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ invoices });
  } catch (error) {
    return next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user.id }).lean();
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    return res.status(200).json({ invoice });
  } catch (error) {
    return next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items = [],
      discount = 0,
      status = 'unpaid',
      dueDate,
      notes,
      businessProfileId,
    } = req.body;

    if (!customerName || items.length === 0) {
      return res.status(400).json({ message: 'Customer name and at least one item are required' });
    }

    let subTotal = 0;
    let taxTotal = 0;

    const processedItems = items.map((item) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const basePrice = quantity * unitPrice;
      const itemTax = (basePrice * taxRate) / 100;
      const total = basePrice + itemTax;

      subTotal += basePrice;
      taxTotal += itemTax;

      return {
        product: item.product || null,
        name: item.name,
        quantity,
        unitPrice,
        taxRate,
        total,
      };
    });

    const discountNum = Number(discount) || 0;
    const grandTotal = Math.max(0, subTotal + taxTotal - discountNum);

    // Generate unique invoice number e.g. INV-2026-XXXX
    const count = await Invoice.countDocuments({ createdBy: req.user.id });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 101).padStart(4, '0')}`;

    let profileSnapshot = null;
    if (businessProfileId) {
      const p = await BusinessProfile.findOne({ _id: businessProfileId, createdBy: req.user.id });
      if (p) {
        profileSnapshot = {
          businessName: p.businessName,
          ownerName: p.ownerName,
          logo: p.logo,
          email: p.email,
          phone: p.phone,
          gstNumber: p.gstNumber,
          address: [p.address, p.city, p.state, p.postalCode].filter(Boolean).join(', '),
        };
      }
    }

    if (!profileSnapshot) {
      const defaultP = await BusinessProfile.findOne({ createdBy: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
      if (defaultP) {
        profileSnapshot = {
          businessName: defaultP.businessName,
          ownerName: defaultP.ownerName,
          logo: defaultP.logo,
          email: defaultP.email,
          phone: defaultP.phone,
          gstNumber: defaultP.gstNumber,
          address: [defaultP.address, defaultP.city, defaultP.state, defaultP.postalCode].filter(Boolean).join(', '),
        };
      } else {
        profileSnapshot = {
          businessName: 'Inventory Management Shop',
          ownerName: req.user.name || 'Owner',
        };
      }
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      businessProfile: profileSnapshot,
      items: processedItems,
      subTotal,
      taxTotal,
      discount: discountNum,
      grandTotal,
      status,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // default 15 days
      notes,
      createdBy: req.user.id,
    });

    await addNotification(
      req.user.id,
      'inventory_update',
      'Invoice Created',
      `Invoice ${invoiceNumber} generated for ${customerName} (₹${grandTotal.toFixed(2)})`,
      customerName
    );

    return res.status(201).json({ invoice, message: 'Invoice created successfully' });
  } catch (error) {
    return next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { status, notes, dueDate } = req.body;
    if (status !== undefined) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate !== undefined) invoice.dueDate = dueDate;

    await invoice.save();

    await addNotification(
      req.user.id,
      'inventory_update',
      'Invoice Updated',
      `Invoice ${invoice.invoiceNumber} status marked as ${invoice.status.toUpperCase()}`,
      invoice.customerName
    );

    return res.status(200).json({ invoice, message: 'Invoice updated successfully' });
  } catch (error) {
    return next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await addNotification(
      req.user.id,
      'inventory_update',
      'Invoice Deleted',
      `Invoice ${invoice.invoiceNumber} was removed.`,
      invoice.customerName
    );

    return res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

export const emailInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { targetEmail } = req.body;
    const recipient = targetEmail || invoice.customerEmail;

    if (!recipient) {
      return res.status(400).json({ message: 'No recipient email address provided' });
    }

    const businessName = invoice.businessProfile?.businessName || 'Our Shop';

    const html = generateInvoiceEmailTemplate({
      businessName,
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal,
      dueDate: invoice.dueDate,
      items: invoice.items,
      notes: invoice.notes,
    });

    const sent = await sendEmail({
      to: recipient,
      subject: `[${businessName}] Invoice ${invoice.invoiceNumber} Statement (₹${invoice.grandTotal.toFixed(2)})`,
      html,
    });

    if (!sent) {
      return res.status(500).json({ message: 'Failed to dispatch email' });
    }

    return res.status(200).json({ message: `Invoice emailed successfully to ${recipient}` });
  } catch (error) {
    return next(error);
  }
};
