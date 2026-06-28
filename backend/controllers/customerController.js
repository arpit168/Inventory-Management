import Customer from '../models/Customer.js';
import LedgerEntry from '../models/LedgerEntry.js';
import BusinessProfile from '../models/BusinessProfile.js';
import { addNotification } from '../utils/notifications.js';
import { sendEmail, generateLedgerEmailTemplate } from '../utils/email.js';

const sendLedgerNotificationEmail = async (userId, customer, type, amount, previousBalance, updatedBalance, description) => {
  if (!customer.email) return;
  try {
    const profile = await BusinessProfile.findOne({ createdBy: userId }).sort({ isDefault: -1, createdAt: -1 });
    const businessName = profile?.businessName || 'Our Shop';

    const html = generateLedgerEmailTemplate({
      businessName,
      customerName: customer.name,
      transactionType: type,
      amount,
      previousBalance,
      updatedBalance,
      notes: description || '-',
    });

    sendEmail({
      to: customer.email,
      subject: `[${businessName}] Khatabook Ledger Update: ₹${Number(amount).toFixed(2)} (${type === 'credit' ? 'Due Recorded' : 'Payment Got'})`,
      html,
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to trigger async ledger email:', err.message);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { createdBy: req.user.id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ updatedAt: -1 }).lean();

    let totalReceivable = 0; // Total Due (positive netBalance)
    let totalAdvance = 0; // Total Advance (negative netBalance)

    for (const c of customers) {
      if (c.netBalance > 0) {
        totalReceivable += c.netBalance;
      } else if (c.netBalance < 0) {
        totalAdvance += Math.abs(c.netBalance);
      }
    }

    return res.status(200).json({
      customers,
      summary: {
        totalCustomers: customers.length,
        totalReceivable,
        totalAdvance,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, openingBalance = 0 } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const openingNum = Number(openingBalance) || 0;
    const totalCredit = openingNum > 0 ? openingNum : 0;
    const totalDebit = openingNum < 0 ? Math.abs(openingNum) : 0;

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      totalCredit,
      totalDebit,
      netBalance: openingNum,
      createdBy: req.user.id,
    });

    if (openingNum !== 0) {
      await LedgerEntry.create({
        customer: customer._id,
        type: openingNum > 0 ? 'credit' : 'debit',
        amount: Math.abs(openingNum),
        description: 'Opening Balance',
        createdBy: req.user.id,
      });

      sendLedgerNotificationEmail(
        req.user.id,
        customer,
        openingNum > 0 ? 'credit' : 'debit',
        Math.abs(openingNum),
        0,
        openingNum,
        'Opening Balance'
      );
    }

    await addNotification(
      req.user.id,
      'inventory_update',
      'Customer Added',
      `${name} added to Khatabook ledger.`,
      name
    );

    return res.status(201).json({ customer, message: 'Customer created successfully' });
  } catch (error) {
    return next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { name, phone, email, address } = req.body;
    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;

    await customer.save();
    return res.status(200).json({ customer, message: 'Customer updated successfully' });
  } catch (error) {
    return next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await LedgerEntry.deleteMany({ customer: req.params.id });

    await addNotification(
      req.user.id,
      'inventory_update',
      'Customer Removed',
      `${customer.name} and their ledger records were removed.`,
      customer.name
    );

    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

export const getCustomerLedger = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user.id }).lean();
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const entries = await LedgerEntry.find({ customer: req.params.id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ customer, entries });
  } catch (error) {
    return next(error);
  }
};

export const addLedgerEntry = async (req, res, next) => {
  try {
    const { type, amount, description, date, dueDate } = req.body;

    if (!type || !['credit', 'debit'].includes(type) || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid type (credit/debit) and positive amount required' });
    }

    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const numAmount = Number(amount);

    const entry = await LedgerEntry.create({
      customer: customer._id,
      type,
      amount: numAmount,
      description: description || (type === 'credit' ? 'Goods / Credit Given' : 'Payment Received'),
      date: date || new Date(),
      dueDate,
      createdBy: req.user.id,
    });

    const previousBalance = customer.netBalance;

    if (type === 'credit') {
      customer.totalCredit += numAmount;
      customer.netBalance += numAmount;
    } else {
      customer.totalDebit += numAmount;
      customer.netBalance -= numAmount;
    }

    await customer.save();

    sendLedgerNotificationEmail(
      req.user.id,
      customer,
      type,
      numAmount,
      previousBalance,
      customer.netBalance,
      description || (type === 'credit' ? 'Goods / Credit Given' : 'Payment Received')
    );

    await addNotification(
      req.user.id,
      'inventory_update',
      type === 'credit' ? 'Credit Recorded (Gave)' : 'Payment Received (Got)',
      `₹${numAmount.toFixed(2)} ${type === 'credit' ? 'credit added for' : 'payment received from'} ${customer.name}. New Balance: ₹${customer.netBalance.toFixed(2)}`,
      customer.name
    );

    return res.status(201).json({ entry, customer, message: 'Transaction recorded successfully' });
  } catch (error) {
    return next(error);
  }
};
