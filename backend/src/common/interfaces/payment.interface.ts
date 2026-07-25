export interface PaymentCustomer {
  id: string;
  email: string;
  name: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  metadata?: Record<string, string>;
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  TRIALING = 'trialing',
}

export interface IPaymentService {
  createCustomer(email: string, name: string): Promise<PaymentCustomer>;
  createPaymentIntent(amount: number, currency: string, customerId: string): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<PaymentIntent>;
  createSubscription(customerId: string, planId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription>;
  listPlans(): Promise<Plan[]>;
  handleWebhook(payload: Buffer, signature: string): Promise<void>;
}
