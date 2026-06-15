import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getSettingsHandler,
  updateSettingsHandler,
  resetSettingsHandler,
} from '../controllers/settings.controller';

const router = Router();

// All settings routes are protected
router.use(authenticate);

router.get('/', getSettingsHandler);
router.put('/', updateSettingsHandler);
router.post('/reset', resetSettingsHandler);

export default router;
