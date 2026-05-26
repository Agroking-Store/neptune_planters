import { Router } from 'express';
import { getSalesAnalyticsHandler } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.get('/sales', getSalesAnalyticsHandler);
