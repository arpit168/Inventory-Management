import Expense from '../models/Expense.js';
import { addNotification } from '../utils/notifications.js';

export const getExpenses = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { createdBy: req.user.id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 }).lean();

    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const byCategory = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
      return acc;
    }, {});

    return res.status(200).json({ expenses, summary: { totalAmount, byCategory } });
  } catch (error) {
    return next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { title, category = 'Other', amount, date, description, receiptImage } = req.body;

    if (!title || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Title and positive amount are required' });
    }

    const expense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      date: date || new Date(),
      description,
      receiptImage: receiptImage || '',
      createdBy: req.user.id,
    });

    await addNotification(
      req.user.id,
      'inventory_update',
      'Expense Recorded',
      `₹${Number(amount).toFixed(2)} recorded under ${category} (${title})`,
      category
    );

    return res.status(201).json({ expense, message: 'Expense recorded successfully' });
  } catch (error) {
    return next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ message: 'Expense removed successfully' });
  } catch (error) {
    return next(error);
  }
};
