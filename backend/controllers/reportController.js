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
        .map((log) => {
          const sold = Math.abs(Number(log.quantityDelta) || 0);
          const buyingPrice = Number(product.buyingPrice) || 0;
          const sellingPrice = Number(product.sellingPrice) || 0;
          
          const profit = Math.max(0, (sellingPrice - buyingPrice) * sold);
          const loss = Math.max(0, (buyingPrice - sellingPrice) * sold);

          return {
            name: product.name,
            date: log.createdAt
              ? new Date(log.createdAt).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            sold,
            profit,
            loss,
          };
        })
    );

    const grouped = chartData.reduce(
      (acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = { sold: 0, profit: 0, loss: 0 };
        }
        acc[item.date].sold += item.sold;
        acc[item.date].profit += item.profit;
        acc[item.date].loss += item.loss;

        return acc;
      },
      {}
    );

    const salesTrend = Object.entries(grouped).map(
      ([date, data]) => ({
        date,
        sold: data.sold,
        profit: data.profit,
        loss: data.loss,
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