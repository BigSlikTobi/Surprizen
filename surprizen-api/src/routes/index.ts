import express from 'express';
import authRoutes from './authRoutes';
import visionChatRoutes from './visionChatRoutes';
import strategyChatRoutes from './strategyChatRoutes';
import storyboardRoutes from './storyboardRoutes';
import paymentRoutes from './paymentRoutes';
import journeyRoutes from './journeyRoutes';
import experienceRoutes from './experienceRoutes';
import contentRoutes from './contentRoutes';

const router = express.Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/vision-chat`, visionChatRoutes);
router.use(`${API_PREFIX}/strategy-chat`, strategyChatRoutes);
router.use(`${API_PREFIX}/storyboard`, storyboardRoutes);
router.use(`${API_PREFIX}/payment`, paymentRoutes);
router.use(`${API_PREFIX}/journeys`, journeyRoutes);
router.use(`${API_PREFIX}/experiences`, experienceRoutes);
router.use(`${API_PREFIX}/content`, contentRoutes);

// Health check route
router.get(`${API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;