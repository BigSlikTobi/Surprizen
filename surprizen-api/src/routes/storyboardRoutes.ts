import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { 
  generateJourneyStoryboard,
  updateJourneyStoryboard,
  previewJourney
} from '../controllers/storyboardController';

const router = Router();

// All storyboard routes require authentication
router.use(verifyToken);

// Generate journey storyboard
router.post('/generate', generateJourneyStoryboard);

// Update journey storyboard
router.put('/update', updateJourneyStoryboard);

// Preview journey from recipient perspective
router.post('/preview', previewJourney);

export default router;