import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import {
  createSession,
  refreshToken,
  getCurrentUser,
  createOrUpdateProfile,
  updatePreferences,
  deleteAccount,
  verifySession,
  updateExperienceCredits,
  getExperienceCredits,
  checkCredits,
  updateSubscription,
  getSubscriptionStatus,
  updateSpecificPreferences,
} from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/session', createSession);
router.post('/refresh-token', refreshToken);
router.get('/verify-session', verifyToken, verifySession);

// Protected routes
router.get('/profile', verifyToken, getCurrentUser);
router.post('/profile', verifyToken, createOrUpdateProfile);
router.patch('/preferences', verifyToken, updatePreferences);
router.delete('/account', verifyToken, deleteAccount);

// Experience Credits routes
router.patch('/credits', verifyToken, updateExperienceCredits);
router.get('/credits', verifyToken, getExperienceCredits);
router.get('/credits/check', verifyToken, checkCredits);

// Subscription routes
router.patch('/subscription', verifyToken, updateSubscription);
router.get('/subscription', verifyToken, getSubscriptionStatus);

// Specific preference routes
router.patch('/preferences/:preferenceType', verifyToken, updateSpecificPreferences);

export default router;