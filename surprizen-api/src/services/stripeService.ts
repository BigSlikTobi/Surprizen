// Simple Stripe service with mock functionality for beta/development
console.log('Running in beta mode - using mock payment features for Stripe');

// Mock data storage
const mockCustomers = new Map<string, any>();
const mockPaymentIntents = new Map<string, any>();
const mockSubscriptions = new Map<string, any>();
let mockIdCounter = 1;

const generateMockId = (prefix: string) => `${prefix}_mock_${mockIdCounter++}_${Date.now()}`;

export interface CreateCustomerData {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentData {
  amount: number; // in cents
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionData {
  customerId: string;
  priceId: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionData {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

export class StripeService {
  /**
   * Create a new customer (mock implementation for beta)
   */
  async createCustomer(data: CreateCustomerData): Promise<any> {
    try {
      const mockCustomer = {
        id: generateMockId('cus'),
        object: 'customer',
        email: data.email,
        name: data.name || null,
        metadata: data.metadata || {},
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        balance: 0,
      };

      mockCustomers.set(mockCustomer.id, mockCustomer);
      console.log('Mock Stripe customer created:', mockCustomer.id);
      return mockCustomer;
    } catch (error) {
      console.error('Error creating mock customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get a customer by ID (mock implementation for beta)
   */
  async getCustomer(customerId: string): Promise<any> {
    const mockCustomer = mockCustomers.get(customerId);
    return mockCustomer || null;
  }

  /**
   * Update a customer (mock implementation for beta)
   */
  async updateCustomer(customerId: string, data: Partial<CreateCustomerData>): Promise<any> {
    const mockCustomer = mockCustomers.get(customerId);
    if (!mockCustomer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer = {
      ...mockCustomer,
      ...data,
      metadata: { ...mockCustomer.metadata, ...data.metadata },
    };

    mockCustomers.set(customerId, updatedCustomer);
    console.log('Mock Stripe customer updated:', customerId);
    return updatedCustomer;
  }

  /**
   * Create a payment intent (mock implementation for beta)
   */
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<any> {
    const mockPaymentIntent = {
      id: generateMockId('pi'),
      object: 'payment_intent',
      amount: data.amount,
      currency: data.currency,
      customer: data.customerId || null,
      metadata: data.metadata || {},
      status: 'requires_payment_method',
      client_secret: `${generateMockId('pi')}_secret_mock`,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    };

    mockPaymentIntents.set(mockPaymentIntent.id, mockPaymentIntent);
    console.log('Mock PaymentIntent created:', mockPaymentIntent.id);
    return mockPaymentIntent;
  }

  /**
   * Get a payment intent by ID (mock implementation for beta)
   */
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    return mockPaymentIntents.get(paymentIntentId) || null;
  }

  /**
   * Confirm a payment intent (mock implementation for beta)
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<any> {
    const mockPaymentIntent = mockPaymentIntents.get(paymentIntentId);
    if (!mockPaymentIntent) {
      throw new Error('Payment intent not found');
    }

    mockPaymentIntent.status = 'succeeded';
    mockPaymentIntent.payment_method = paymentMethodId || 'pm_mock_card';
    console.log('Mock PaymentIntent confirmed:', paymentIntentId);
    return mockPaymentIntent;
  }

  /**
   * Create a subscription (mock implementation for beta)
   */
  async createSubscription(data: CreateSubscriptionData): Promise<any> {
    const mockSubscription = {
      id: generateMockId('sub'),
      object: 'subscription',
      customer: data.customerId,
      status: 'active',
      metadata: data.metadata || {},
      created: Math.floor(Date.now() / 1000),
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    };

    mockSubscriptions.set(mockSubscription.id, mockSubscription);
    console.log('Mock Subscription created:', mockSubscription.id);
    return mockSubscription;
  }

  /**
   * Update a subscription (mock implementation for beta)
   */
  async updateSubscription(data: UpdateSubscriptionData): Promise<any> {
    const mockSubscription = mockSubscriptions.get(data.subscriptionId);
    if (!mockSubscription) {
      throw new Error('Subscription not found');
    }

    const updatedSubscription = {
      ...mockSubscription,
      metadata: { ...mockSubscription.metadata, ...data.metadata },
    };

    mockSubscriptions.set(data.subscriptionId, updatedSubscription);
    console.log('Mock Subscription updated:', data.subscriptionId);
    return updatedSubscription;
  }

  /**
   * Cancel a subscription (mock implementation for beta)
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    const mockSubscription = mockSubscriptions.get(subscriptionId);
    if (!mockSubscription) {
      throw new Error('Subscription not found');
    }

    mockSubscription.status = 'canceled';
    console.log('Mock Subscription canceled:', subscriptionId);
    return mockSubscription;
  }

  /**
   * Get a subscription by ID (mock implementation for beta)
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    return mockSubscriptions.get(subscriptionId) || null;
  }

  /**
   * List customer subscriptions (mock implementation for beta)
   */
  async listCustomerSubscriptions(customerId: string): Promise<any[]> {
    const customerSubs = Array.from(mockSubscriptions.values()).filter(
      sub => sub.customer === customerId
    );
    return customerSubs;
  }

  /**
   * Create a setup intent for saving payment methods (mock implementation for beta)
   */
  async createSetupIntent(customerId: string): Promise<any> {
    const mockSetupIntent = {
      id: generateMockId('seti'),
      object: 'setup_intent',
      client_secret: `${generateMockId('seti')}_secret_mock`,
      customer: customerId,
      status: 'requires_payment_method',
      usage: 'off_session',
    };

    console.log('Mock SetupIntent created:', mockSetupIntent.id);
    return mockSetupIntent;
  }

  /**
   * List customer payment methods (mock implementation for beta)
   */
  async listCustomerPaymentMethods(customerId: string): Promise<any[]> {
    return [{
      id: 'pm_mock_card',
      object: 'payment_method',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
      customer: customerId,
    }];
  }

  /**
   * Construct webhook event (mock implementation for beta)
   */
  constructEvent(payload: string | Buffer, signature: string, endpointSecret: string): any {
    console.log('Mock webhook event constructed');
    return {
      id: generateMockId('evt'),
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_mock_123',
          status: 'succeeded',
        },
      },
    };
  }

  /**
   * Get all pricing plans (mock implementation for beta)
   */
  async getPrices(): Promise<any[]> {
    return [
      {
        id: 'price_mock_basic',
        object: 'price',
        currency: 'usd',
        unit_amount: 1000, // $10.00
        nickname: 'Basic Plan',
        recurring: { interval: 'month' },
        product: 'prod_mock_basic',
      },
      {
        id: 'price_mock_premium',
        object: 'price',
        currency: 'usd',
        unit_amount: 2000, // $20.00
        nickname: 'Premium Plan',
        recurring: { interval: 'month' },
        product: 'prod_mock_premium',
      },
    ];
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;