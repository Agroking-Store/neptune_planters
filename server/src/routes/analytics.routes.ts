import { Router } from 'express';
import { getSalesAnalyticsHandler, getSalesReportHandler } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.get('/sales', getSalesAnalyticsHandler);
analyticsRouter.get('/report', getSalesReportHandler);
