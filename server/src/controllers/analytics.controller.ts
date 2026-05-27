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

// ─────────────────────────────────────────────
// GET /api/analytics/report?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns per-product-variant sales data for Excel export
// ─────────────────────────────────────────────
export const getSalesReportHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const { from, to } = req.query as { from?: string; to?: string };

  // IST is UTC+5:30 (330 minutes). Sales are stored in UTC.
  // A browser sends YYYY-MM-DD which is local IST date.
  // We convert to the equivalent UTC range:
  //   from: YYYY-MM-DD 00:00:00 IST = YYYY-MM-DD 00:00:00 - 5:30 UTC = prev day 18:30 UTC
  //   to:   YYYY-MM-DD 23:59:59 IST = YYYY-MM-DD 23:59:59 - 5:30 UTC = same day 18:29:59 UTC
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 330 minutes in ms

  const matchStage: any = {};
  if (from || to) {
    matchStage.saleDate = {};
    if (from) {
      const fromUtc = new Date(`${from}T00:00:00.000Z`);
      fromUtc.setTime(fromUtc.getTime() - IST_OFFSET_MS);
      matchStage.saleDate.$gte = fromUtc;
    }
    if (to) {
      const toUtc = new Date(`${to}T23:59:59.999Z`);
      toUtc.setTime(toUtc.getTime() - IST_OFFSET_MS);
      matchStage.saleDate.$lte = toUtc;
    }
  }

  // Debug: log what we're querying
  console.log('[Analytics Report] matchStage:', JSON.stringify(matchStage));
  const totalCount = await Sale.countDocuments(Object.keys(matchStage).length ? matchStage : {});
  console.log('[Analytics Report] Matching sale records:', totalCount);

  const rows = await Sale.aggregate([
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: {
          productId: '$productId',
          selectedSize: '$selectedSize',
          selectedTexture: '$selectedTexture',
        },
        quantitySold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productName: '$product.productName',
        hsnNumber: '$product.hsnNumber',
        productImage: {
          $let: {
            vars: {
              img: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $ifNull: ['$product.productImages', []] },
                      as: 'img',
                      cond: { $eq: ['$$img.type', 'product'] }
                    }
                  },
                  0
                ]
              }
            },
            in: '$$img.url'
          }
        },
        selectedSize: '$_id.selectedSize',
        selectedTexture: '$_id.selectedTexture',
        quantitySold: 1,
        totalRevenue: 1,
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  const grandTotal = rows.reduce((sum, r) => sum + r.totalRevenue, 0);

  res.status(200).json(
    ApiResponse.success('Sales report generated', { rows, grandTotal }).toJSON()
  );
});
