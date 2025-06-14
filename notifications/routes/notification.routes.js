import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { getMyNotifications, markAsRead } from '../controllers/notification.controller.js';

const router = express.Router();
router.use(protect);

router.get('/', getMyNotifications);
router.put('/read', markAsRead);

export default router;