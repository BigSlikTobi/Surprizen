import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { 
  handleStrategyChat, 
  getInitialStrategyPrompt 
} from '../controllers/strategyChatController';

const router = Router();

// All strategy chat routes require authentication
router.use(verifyToken);

// Get initial strategy prompt
router.post('/initial', getInitialStrategyPrompt);

// Handle strategy chat conversation
router.post('/chat', handleStrategyChat);

export default router;