export interface CreatePaymentSessionParams {
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export interface VerifyPaymentParams {
  transactionId: string;
  signature?: string;
  gatewayOrderId?: string;
}

export interface RefundPaymentParams {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface PaymentSessionResponse {
  sessionId: string;
  url: string;
}

export interface IPaymentProvider {
  createSession(params: CreatePaymentSessionParams): Promise<PaymentSessionResponse>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  refundPayment(params: RefundPaymentParams): Promise<string>;
}
