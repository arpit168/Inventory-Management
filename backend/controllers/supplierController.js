import Supplier from "../models/Supplier.js";
import SupplierLedgerEntry from "../models/SupplierLedgerEntry.js";
import { addNotification } from "../utils/notifications.js";

export const getSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { createdBy: req.user.id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const suppliers = await Supplier.find(query).sort({ updatedAt: -1 }).lean();

    let totalPayable = 0; // Total we owe (positive netBalance)
    let totalAdvance = 0; // Total they owe us (negative netBalance)

    for (const s of suppliers) {
      if (s.netBalance > 0) {
        totalPayable += s.netBalance;
      } else if (s.netBalance < 0) {
        totalAdvance += Math.abs(s.netBalance);
      }
    }

    return res.status(200).json({
      suppliers,
      summary: {
        totalSuppliers: suppliers.length,
        totalPayable,
        totalAdvance,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, email, address, openingBalance = 0 } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const openingNum = Number(openingBalance) || 0;
    const totalPayable = openingNum > 0 ? openingNum : 0;
    const totalAdvance = openingNum < 0 ? Math.abs(openingNum) : 0;

    const supplier = await Supplier.create({
      name,
      phone,
      email,
      address,
      totalPayable,
      totalAdvance,
      netBalance: openingNum,
      createdBy: req.user.id,
    });

    if (openingNum !== 0) {
      await SupplierLedgerEntry.create({
        supplier: supplier._id,
        type: openingNum > 0 ? "credit" : "debit",
        amount: Math.abs(openingNum),
        description: "Opening Balance",
        createdBy: req.user.id,
      });
    }

    await addNotification(
      req.user.id,
      "inventory_update",
      "Supplier Added",
      `${name} added to Suppliers list.`,
      name,
    );

    return res
      .status(201)
      .json({ supplier, message: "Supplier created successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const { name, phone, email, address } = req.body;
    if (name !== undefined) supplier.name = name;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;

    await supplier.save();
    return res
      .status(200)
      .json({ supplier, message: "Supplier updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    await SupplierLedgerEntry.deleteMany({ supplier: req.params.id });

    await addNotification(
      req.user.id,
      "inventory_update",
      "Supplier Removed",
      `${supplier.name} and their ledger records were removed.`,
      supplier.name,
    );

    return res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getSupplierLedger = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).lean();
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const entries = await SupplierLedgerEntry.find({ supplier: req.params.id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ supplier, entries });
  } catch (error) {
    return next(error);
  }
};

const recalculateSupplierBalance = async (supplierId, userId) => {
  const entries = await SupplierLedgerEntry.find({ supplier: supplierId });
  let totalPayable = 0;
  let totalAdvance = 0;
  entries.forEach((e) => {
    if (e.type === "credit") totalPayable += e.amount;
    else totalAdvance += e.amount;
  });
  const netBalance = totalPayable - totalAdvance;
  await Supplier.updateOne(
    { _id: supplierId, createdBy: userId },
    { totalPayable, totalAdvance, netBalance },
  );
};

export const addLedgerEntry = async (req, res, next) => {
  try {
    const { type, amount, description, date, dueDate } = req.body;

    if (
      !type ||
      !["credit", "debit"].includes(type) ||
      !amount ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        message: "Valid type (credit/debit) and positive amount required",
      });
    }

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const numAmount = Number(amount);

    const entry = await SupplierLedgerEntry.create({
      supplier: supplier._id,
      type,
      amount: numAmount,
      description:
        description ||
        (type === "credit" ? "Goods Received (We Owe)" : "Payment Given"),
      date: date || new Date(),
      dueDate,
      createdBy: req.user.id,
    });

    await recalculateSupplierBalance(supplier._id, req.user.id);

    await addNotification(
      req.user.id,
      "inventory_update",
      type === "credit" ? "Credit Added (Payable)" : "Payment Made (Advance)",
      `₹${numAmount.toFixed(2)} ${type === "credit" ? "payable to" : "paid to"} ${supplier.name}.`,
      supplier.name,
    );

    return res
      .status(201)
      .json({ entry, message: "Transaction recorded successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateLedgerEntry = async (req, res, next) => {
  try {
    const { amount, description, type, date } = req.body;
    const entry = await SupplierLedgerEntry.findOne({
      _id: req.params.entryId,
      supplier: req.params.id,
      createdBy: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: "Ledger entry not found" });
    }

    if (amount !== undefined) entry.amount = Number(amount);
    if (description !== undefined) entry.description = description;
    if (type !== undefined) entry.type = type;
    if (date !== undefined) entry.date = date;

    await entry.save();

    await recalculateSupplierBalance(req.params.id, req.user.id);

    return res
      .status(200)
      .json({ entry, message: "Transaction updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const deleteLedgerEntry = async (req, res, next) => {
  try {
    const entry = await SupplierLedgerEntry.findOneAndDelete({
      _id: req.params.entryId,
      supplier: req.params.id,
      createdBy: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: "Ledger entry not found" });
    }

    await recalculateSupplierBalance(req.params.id, req.user.id);

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
