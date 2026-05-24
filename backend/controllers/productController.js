import Product from '../models/Product.js';
import RemovedProduct from '../models/RemovedProduct.js';
import { addNotification } from '../utils/notifications.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const getMetrics = (product) => {
  const quantity = Number(product.quantity || 0);
  const buyingPrice = Number(product.buyingPrice || 0);
  const sellingPrice = Number(product.sellingPrice || 0);

  const inventoryValue = quantity * buyingPrice;
  const profit = Math.max(
    0,
    (sellingPrice - buyingPrice) * quantity
  );

  const loss = Math.max(
    0,
    (buyingPrice - sellingPrice) * quantity
  );

  return {
    inventoryValue,
    profit,
    loss,
  };
};

const ALLOWED_SORT_FIELDS = new Set([
  'name',
  'category',
  'quantity',
  'buyingPrice',
  'sellingPrice',
  'createdAt',
  'updatedAt',
]);

export const getProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      status,
      sort = 'updatedAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      createdBy: req.user.id,
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Math.max(Number(limit), 1), 100);

    const sortField = ALLOWED_SORT_FIELDS.has(sort) ? sort : 'updatedAt';
    const sortDirection = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortField]: sortDirection })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),

      Product.countDocuments(query),
    ]);

    const enrichedProducts = products.map((product) => ({
      ...product,
      ...getMetrics(product),
    }));

    return res.status(200).json({
      products: enrichedProducts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      sku,
      quantity,
      buyingPrice,
      sellingPrice,
      lowStockThreshold,
      description,
    } = req.body;

    if (
      !name ||
      quantity === undefined ||
      buyingPrice === undefined ||
      sellingPrice === undefined
    ) {
      return res.status(400).json({
        message:
          'Name, quantity, buyingPrice, and sellingPrice are required',
      });
    }

    const status =
      Number(quantity) <= 0
        ? 'out_of_stock'
        : 'in_stock';

    const product = await Product.create({
      name,
      category: category || 'General',
      sku,
      quantity: Number(quantity),
      buyingPrice: Number(buyingPrice),
      sellingPrice: Number(sellingPrice),
      lowStockThreshold: Number(lowStockThreshold || 5),
      description: description || '',
      createdBy: req.user.id,
      status,

      activityLogs: [
        {
          action: 'created',
          quantityDelta: Number(quantity),
          previousQuantity: 0,
          newQuantity: Number(quantity),
          note: 'Product created',
        },
      ],
    });

    await addNotification(
      req.user.id,
      'inventory_update',
      'Product added',
      `${product.name} has been added to your inventory.`,
      product.name
    );

    return res.status(201).json({
      product: {
        ...product.toObject(),
        ...getMetrics(product.toObject()),
      },
      message: 'Product added successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    const previousQuantity = Number(product.quantity);
    const previousStatus = product.status;

    const {
      name,
      category,
      sku,
      quantity,
      buyingPrice,
      sellingPrice,
      lowStockThreshold,
      description,
    } = req.body;

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (sku !== undefined) product.sku = sku;
    if (description !== undefined) product.description = description;
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (buyingPrice !== undefined) product.buyingPrice = Number(buyingPrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);

    product.status =
      product.quantity <= 0
        ? 'out_of_stock'
        : 'in_stock';

    product.activityLogs.push({
      action: 'updated',
      quantityDelta:
        product.quantity - previousQuantity,
      previousQuantity,
      newQuantity: product.quantity,
      note: 'Product details updated',
    });

    await product.save();

    if (
      product.quantity <= 0 &&
      previousStatus !== 'out_of_stock'
    ) {
      await addNotification(
        req.user.id,
        'out_of_stock',
        'Out of stock alert',
        `${product.name} is now out of stock.`,
        product.name
      );
    }

    if (
      product.quantity > 0 &&
      previousQuantity <= product.lowStockThreshold &&
      product.quantity > 0
    ) {
      await addNotification(
        req.user.id,
        'inventory_update',
        'Inventory restored',
        `${product.name} has been restocked and is back in inventory.`,
        product.name
      );
    }

    return res.status(200).json({
      product: {
        ...product.toObject(),
        ...getMetrics(product.toObject()),
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    const metrics = getMetrics(product);

    await RemovedProduct.create({
      name: product.name,
      category: product.category,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      profit: metrics.profit,
      loss: metrics.loss,
      remainingStockValue: metrics.inventoryValue,
      removedBy: req.user.id,
    });

    await addNotification(
      req.user.id,
      'product_removed',
      'Product removed',
      `${product.name} was removed from inventory and saved to history.`,
      product.name
    );

    await Product.deleteOne({
      _id: req.params.id,
    });

    return res.status(200).json({
      message: 'Product removed successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { change } = req.body;

    if (
      change === undefined ||
      Number.isNaN(Number(change))
    ) {
      return res.status(400).json({
        message: 'A numeric change is required',
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    const previousQuantity = Number(product.quantity);

    const nextQuantity = Math.max(
      0,
      previousQuantity + Number(change)
    );

    const delta = nextQuantity - previousQuantity;

    product.quantity = nextQuantity;

    product.status =
      nextQuantity <= 0
        ? 'out_of_stock'
        : 'in_stock';

    product.activityLogs.push({
      action: delta >= 0 ? 'increased' : 'decreased',
      quantityDelta: delta,
      previousQuantity,
      newQuantity: nextQuantity,
      note: `Stock adjusted by ${delta}`,
    });

    await product.save();

    if (nextQuantity <= 0) {
      await addNotification(
        req.user.id,
        'out_of_stock',
        'Out of stock alert',
        `${product.name} is now out of stock.`,
        product.name
      );
    } else if (
      nextQuantity <= product.lowStockThreshold
    ) {
      await addNotification(
        req.user.id,
        'low_stock',
        'Low stock alert',
        `${product.name} is running low.`,
        product.name
      );
    } else {
      await addNotification(
        req.user.id,
        'inventory_update',
        'Inventory updated',
        `${product.name} stock was adjusted successfully.`,
        product.name
      );
    }

    if (delta > 0 && previousQuantity === 0) {
      await addNotification(
        req.user.id,
        'inventory_update',
        'Inventory restored',
        `${product.name} has returned to stock.`,
        product.name
      );
    }

    const metrics = getMetrics(product);

    return res.status(200).json({
      product: {
        ...product.toObject(),
        ...metrics,
      },
      message: 'Stock updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const getOutOfStockProducts = async (
  req,
  res,
  next
) => {
  try {
    const products = await Product.find({
      createdBy: req.user.id,
      status: 'out_of_stock',
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      products: products.map((product) => ({
        ...product,
        ...getMetrics(product),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const products = await Product.find({
      createdBy: req.user.id,
    }).lean();

    const totalProducts = products.length;
    const enriched = products.map((p) => ({ ...p, ...getMetrics(p) }));

    let totalInventoryValue = 0;
    let totalStockCount = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    for (const p of enriched) {
      totalInventoryValue += p.inventoryValue;
      totalStockCount += Number(p.quantity || 0);
      totalProfit += p.profit;
      totalLoss += p.loss;

      if (p.quantity <= 0) {
        outOfStockCount += 1;
      } else if (p.quantity <= Number(p.lowStockThreshold || 5)) {
        lowStockCount += 1;
      }
    }

    const salesData = products.flatMap((product) =>
      (product.activityLogs || [])
        .filter(
          (log) =>
            log.action === 'decreased' ||
            log.action === 'sold'
        )
        .map((log) => ({
          name: product.name,
          date: log.createdAt
            ? new Date(log.createdAt)
                .toISOString()
                .slice(0, 10)
            : new Date()
                .toISOString()
                .slice(0, 10),
          quantity: Math.abs(
            Number(log.quantityDelta) || 0
          ),
        }))
    );

    const statusData = [
      {
        name: 'In Stock',
        value: totalProducts - outOfStockCount,
      },
      {
        name: 'Out of Stock',
        value: outOfStockCount,
      },
    ];

    const categoryData = products.reduce(
      (acc, product) => {
        const key = product.category || 'General';

        acc[key] =
          (acc[key] || 0) +
          Number(product.quantity || 0);

        return acc;
      },
      {}
    );

    const recentActivity = products
      .flatMap((product) =>
        (product.activityLogs || []).map((log) => ({
          product: product.name,
          action: log.action,
          quantityDelta: log.quantityDelta,
          timestamp: log.createdAt || new Date(),
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      )
      .slice(0, 8);

    return res.status(200).json({
      totals: {
        totalProducts,
        totalInventoryValue,
        totalStockCount,
        outOfStockCount,
        lowStockCount,
        totalProfit,
        totalLoss,
      },

      charts: {
        statusData,
        categoryData,
        salesData,
      },

      recentActivity,

      products: enriched,
    });
  } catch (error) {
    return next(error);
  }
};