import express from 'express';
import { 
  ExperienceController,
  reactionValidation,
  statusUpdateValidation,
  experienceIdValidation,
  recipientIdValidation,
  experienceQueryValidation
} from '../controllers/experienceController';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();
const experienceController = new ExperienceController();

// GET /api/v1/experiences/current - Get current experience (no auth required for recipients)
router.get('/current', experienceQueryValidation, experienceController.getCurrentExperience);

// GET /api/v1/experiences/recipient/:id - Get experiences for recipient (no auth required)
router.get('/recipient/:id', recipientIdValidation, experienceQueryValidation, experienceController.getRecipientExperiences);

// POST /api/v1/experiences/:id/reaction - Add reaction to experience (no auth required for recipients)
router.post('/:id/reaction', reactionValidation, experienceController.addReaction);

// PATCH /api/v1/experiences/:id/status - Update experience status (no auth required for recipients)
router.patch('/:id/status', statusUpdateValidation, experienceController.updateStatus);

// Routes that require authentication (for gift givers)
router.use(verifyToken);

// GET /api/v1/experiences/:id - Get experience by ID
router.get('/:id', experienceIdValidation, experienceController.getExperienceById);

// GET /api/v1/experiences/journey/:id - Get experiences for a journey
router.get('/journey/:id', experienceIdValidation, experienceController.getJourneyExperiences);

// POST /api/v1/experiences/:id/set-current - Set current step
router.post('/:id/set-current', experienceIdValidation, experienceController.setCurrentStep);

export default router;