import express from 'express';
import { JourneyController } from '../controllers/journeyController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();
const journeyController = new JourneyController();

// All journey routes require authentication
router.use(verifyToken);

// GET /api/v1/journeys/stats - Get user journey statistics
router.get('/stats', journeyController.getJourneyStats);

// GET /api/v1/journeys - Get user's journeys
router.get('/', journeyController.getJourneys);

// POST /api/v1/journeys - Create new journey
router.post('/', journeyController.createJourney);

// GET /api/v1/journeys/:id - Get journey by ID
router.get('/:id', journeyController.getJourneyById);

// PUT /api/v1/journeys/:id - Update journey
router.put('/:id', journeyController.updateJourney);

// DELETE /api/v1/journeys/:id - Delete journey
router.delete('/:id', journeyController.deleteJourney);

export default router;