import { Request, Response, NextFunction } from 'express';
import { stripeService } from '../services/stripeService';
import { User } from '../models/User';
import { ApiError } from '../middleware/errorHandler';

const userModel = new User();

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (!signature) {
      throw new ApiError(400, 'Missing Stripe signature');
    }

    if (!endpointSecret) {
      throw new ApiError(500, 'Webhook endpoint secret not configured');
    }

    // Construct the event from the webhook payload
    const event = await stripeService.handleWebhook(
      req.body,
      signature,
      endpointSecret
    );

    console.log('Processing webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    next(error);
  }
};

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  const userId = paymentIntent.metadata?.userId;
  
  if (!userId) {
    console.log('No userId in payment intent metadata');
    return;
  }

  // If this is for experience credits, add them to the user's account
  if (paymentIntent.metadata?.type === 'experience_credits') {
    const credits = parseInt(paymentIntent.metadata.credits || '0');
    
    if (credits > 0) {
      try {
        await userModel.updateExperienceCredits(userId, credits, 'add');
        console.log(`Added ${credits} credits to user ${userId}`);
      } catch (error) {
        console.error('Error adding credits to user:', error);
      }
    }
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object;
  const userId = paymentIntent.metadata?.userId;
  
  console.log(`Payment failed for user ${userId}:`, paymentIntent.last_payment_error?.message);
  
  // Could send notification to user about failed payment
  // For now, just log the event
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  // Find user by Stripe customer ID
  const userId = await findUserByCustomerId(customerId);
  
  if (!userId) {
    console.log('No user found for customer:', customerId);
    return;
  }

  try {
    await userModel.updateSubscription(userId, {
      stripeSubscriptionId: subscription.id,
      status: subscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
    
    console.log(`Subscription created for user ${userId}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  // Find user by Stripe customer ID
  const userId = await findUserByCustomerId(customerId);
  
  if (!userId) {
    console.log('No user found for customer:', customerId);
    return;
  }

  try {
    await userModel.updateSubscription(userId, {
      status: subscription.status === 'active' ? 'active' : 'inactive',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
    
    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  // Find user by Stripe customer ID
  const userId = await findUserByCustomerId(customerId);
  
  if (!userId) {
    console.log('No user found for customer:', customerId);
    return;
  }

  try {
    await userModel.updateSubscription(userId, {
      status: 'cancelled',
      cancelAtPeriodEnd: true,
    });
    
    console.log(`Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

/**
 * Handle successful invoice payment (for subscriptions)
 */
async function handleInvoicePaymentSucceeded(event: any) {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  
  // Find user by Stripe customer ID
  const userId = await findUserByCustomerId(customerId);
  
  if (!userId) {
    console.log('No user found for customer:', customerId);
    return;
  }

  // For subscription renewals, could add bonus credits or update status
  console.log(`Invoice payment succeeded for user ${userId}`);
  
  // If this is a subscription with credits included, add them
  if (invoice.subscription) {
    // Could add monthly/yearly credits based on subscription type
    // For now, just log the successful payment
  }
}

/**
 * Handle failed invoice payment (for subscriptions)
 */
async function handleInvoicePaymentFailed(event: any) {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  
  // Find user by Stripe customer ID
  const userId = await findUserByCustomerId(customerId);
  
  if (!userId) {
    console.log('No user found for customer:', customerId);
    return;
  }

  console.log(`Invoice payment failed for user ${userId}`);
  
  // Could update subscription status to past_due
  try {
    await userModel.updateSubscription(userId, {
      status: 'past_due',
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
  }
}

/**
 * Helper function to find user by Stripe customer ID
 */
async function findUserByCustomerId(customerId: string): Promise<string | null> {
  try {
    const userId = await userModel.findByStripeCustomerId(customerId);
    return userId;
  } catch (error) {
    console.error('Error finding user by customer ID:', error);
    return null;
  }
}