import Product from '../models/Product.js';

export const getSalesReport = async (
  req,
  res,
  next
) => {
  try {
    const products = await Product.find({
      createdBy: req.user.id,
    }).lean();

    const chartData = products.flatMap((product) =>
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

          sold: Math.abs(
            Number(log.quantityDelta) || 0
          ),
        }))
    );

    const grouped = chartData.reduce(
      (acc, item) => {
        acc[item.date] =
          (acc[item.date] || 0) + item.sold;

        return acc;
      },
      {}
    );

    const salesTrend = Object.entries(grouped).map(
      ([date, sold]) => ({
        date,
        sold,
      })
    );

    return res.status(200).json({
      salesTrend,
      chartData,
    });
  } catch (error) {
    return next(error);
  }
};