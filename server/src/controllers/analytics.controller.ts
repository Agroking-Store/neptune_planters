import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Sale } from '../models/Sale.model';

export const getSalesAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const totalQtyResult = await Sale.aggregate([
    { $group: { _id: null, totalQty: { $sum: '$quantity' }, totalRev: { $sum: '$totalAmount' } } }
  ]);
  const totalSoldQuantities = totalQtyResult[0]?.totalQty || 0;
  const soldProductsValue = totalQtyResult[0]?.totalRev || 0;

  const monthSaleResult = await Sale.aggregate([
    { $match: { month: currentMonthStr } },
    { $group: { _id: null, totalRev: { $sum: '$totalAmount' } } }
  ]);
  const thisMonthSale = monthSaleResult[0]?.totalRev || 0;

  const topSellingResult = await Sale.aggregate([
    { $group: { _id: '$productId', quantitySold: { $sum: '$quantity' } } },
    { $sort: { quantitySold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productData'
      }
    },
    { $unwind: '$productData' },
    {
      $project: {
        _id: 0,
        name: '$productData.productName',
        value: '$quantitySold'
      }
    }
  ]);

  const totalTopQty = topSellingResult.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const topSelling = topSellingResult.map((t) => ({
    ...t,
    pct: Math.round((t.value / totalTopQty) * 100)
  }));

  res.status(200).json(
    ApiResponse.success('Analytics retrieved successfully', {
      soldQuantities: totalSoldQuantities,
      soldProductsValue,
      thisMonthSale,
      topSelling
    }).toJSON()
  );
});
