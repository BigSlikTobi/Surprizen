import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import {
  handleVisionChat,
  getInitialVisionPrompt,
} from '../controllers/visionChatController';

const router = express.Router();

// All vision chat routes require authentication
router.use(verifyToken);

// Get initial vision chat prompt
router.get('/initial', getInitialVisionPrompt);

// Handle vision chat conversation
router.post('/chat', handleVisionChat);

export default router;