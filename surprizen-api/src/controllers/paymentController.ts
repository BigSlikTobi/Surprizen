import { Request, Response, NextFunction } from 'express';
import { stripeService } from '../services/stripeService';
import { User } from '../models/User';
import { ApiError } from '../middleware/errorHandler';

const userModel = new User();

/**
 * Create or get Stripe customer for user
 */
export const getOrCreateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    let customerId = userProfile.subscription?.stripeCustomerId;
    
    // If user doesn't have a Stripe customer, create one
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: userProfile.email,
        name: userProfile.displayName,
        metadata: {
          userId: req.user.uid,
        },
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      await userModel.updateSubscription(req.user.uid, {
        stripeCustomerId: customerId,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        customerId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment intent for experience credits
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { credits } = req.body;
    
    if (!credits || credits <= 0) {
      throw new ApiError(400, 'Credits must be a positive number');
    }

    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    let customerId = userProfile.subscription?.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: userProfile.email,
        name: userProfile.displayName,
        metadata: {
          userId: req.user.uid,
        },
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      await userModel.updateSubscription(req.user.uid, {
        stripeCustomerId: customerId,
      });
    }

    const amount = stripeService.calculateAmountFromCredits(credits);
    
    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency: 'usd',
      customerId,
      metadata: {
        userId: req.user.uid,
        credits: credits.toString(),
        type: 'experience_credits',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        credits,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment and add credits to user account
 */
export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      throw new ApiError(400, 'Payment intent ID is required');
    }

    // Get payment intent from Stripe to verify it's completed
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    
    if (!paymentIntent) {
      throw new ApiError(404, 'Payment intent not found');
    }
    
    if (paymentIntent.status !== 'succeeded') {
      throw new ApiError(400, 'Payment not completed');
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata.userId !== req.user.uid) {
      throw new ApiError(403, 'Payment does not belong to this user');
    }

    const credits = parseInt(paymentIntent.metadata.credits || '0');
    
    if (credits <= 0) {
      throw new ApiError(400, 'Invalid credits amount');
    }

    // Add credits to user account
    const updatedProfile = await userModel.updateExperienceCredits(
      req.user.uid,
      credits,
      'add'
    );

    if (!updatedProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    res.status(200).json({
      success: true,
      data: {
        creditsAdded: credits,
        totalCredits: updatedProfile.experienceCredits,
        paymentIntentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create subscription
 */
export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { priceId } = req.body;
    
    if (!priceId) {
      throw new ApiError(400, 'Price ID is required');
    }

    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    let customerId = userProfile.subscription?.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: userProfile.email,
        name: userProfile.displayName,
        metadata: {
          userId: req.user.uid,
        },
      });
      
      customerId = customer.id;
    }

    const subscription = await stripeService.createSubscription({
      customerId,
      priceId,
      metadata: {
        userId: req.user.uid,
      },
    });

    // Update user profile with subscription details
    await userModel.updateSubscription(req.user.uid, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      type: priceId.includes('monthly') ? 'monthly' : 'yearly',
      status: subscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: (subscription as any).latest_invoice?.payment_intent?.client_secret,
        status: subscription.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription
 */
export const updateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { priceId, cancelAtPeriodEnd } = req.body;
    
    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile?.subscription?.stripeSubscriptionId) {
      throw new ApiError(404, 'No active subscription found');
    }

    const subscription = await stripeService.updateSubscription({
      subscriptionId: userProfile.subscription.stripeSubscriptionId,
      priceId,
      cancelAtPeriodEnd,
    });

    // Update user profile with new subscription details
    const subscriptionUpdate: any = {
      status: subscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    };

    if (priceId) {
      subscriptionUpdate.type = priceId.includes('monthly') ? 'monthly' : 'yearly';
    }

    await userModel.updateSubscription(req.user.uid, subscriptionUpdate);

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile?.subscription?.stripeSubscriptionId) {
      throw new ApiError(404, 'No active subscription found');
    }

    const subscription = await stripeService.cancelSubscription(
      userProfile.subscription.stripeSubscriptionId
    );

    // Update user profile
    await userModel.updateSubscription(req.user.uid, {
      status: 'cancelled',
      cancelAtPeriodEnd: true,
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelledAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available pricing plans
 */
export const getPricingPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const prices = await stripeService.getPrices();
    
    // Filter and format prices for experience credits and subscriptions
    const formattedPrices = prices.map(price => ({
      id: price.id,
      productId: price.product,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count,
      type: price.recurring ? 'subscription' : 'one_time',
      active: price.active,
    }));

    res.status(200).json({
      success: true,
      data: formattedPrices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's payment methods
 */
export const getPaymentMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile?.subscription?.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const paymentMethods = await stripeService.getCustomerPaymentMethods(
      userProfile.subscription.stripeCustomerId
    );

    const formattedPaymentMethods = paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedPaymentMethods,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create setup intent for saving payment methods
 */
export const createSetupIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    let customerId = userProfile.subscription?.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: userProfile.email,
        name: userProfile.displayName,
        metadata: {
          userId: req.user.uid,
        },
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      await userModel.updateSubscription(req.user.uid, {
        stripeCustomerId: customerId,
      });
    }

    const setupIntent = await stripeService.createSetupIntent(customerId);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
};