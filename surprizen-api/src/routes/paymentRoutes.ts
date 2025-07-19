import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import {
  getOrCreateCustomer,
  createPaymentIntent,
  confirmPayment,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getPricingPlans,
  getPaymentMethods,
  createSetupIntent,
} from '../controllers/paymentController';
import { handleStripeWebhook } from '../controllers/webhookController';

const router = express.Router();

// Public routes
router.get('/pricing', getPricingPlans);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.get('/customer', verifyToken, getOrCreateCustomer);
router.post('/payment-intent', verifyToken, createPaymentIntent);
router.post('/confirm-payment', verifyToken, confirmPayment);
router.post('/setup-intent', verifyToken, createSetupIntent);
router.get('/payment-methods', verifyToken, getPaymentMethods);

// Subscription routes
router.post('/subscription', verifyToken, createSubscription);
router.patch('/subscription', verifyToken, updateSubscription);
router.delete('/subscription', verifyToken, cancelSubscription);

export default router;