import React from 'react';
import { Button } from '@/components/ui/Button';
import { paymentsApi } from '@/services/api/apiClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Props = {
  planId: string;
  onSuccess?: (data: any) => void;
  onError?: (err: any) => void;
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });
}

export const RazorpayCheckout: React.FC<Props> = ({ planId, onSuccess, onError }) => {
  const handleClick = async () => {
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      // Create session on backend (trusted pricing)
      const successUrl = window.location.href;
      const cancelUrl = window.location.href;

      const session = await paymentsApi.createSession({
        planId,
        provider: 'RAZORPAY',
        successUrl,
        cancelUrl,
      });

      // session contains paymentId and sessionId (Razorpay order id)
      const orderId = session.sessionId;
      const amount = session.meta?.order?.amount ?? session.amount; // paise
      const currency = session.meta?.order?.currency ?? session.currency ?? 'INR';

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const v = await paymentsApi.verifyRazorpay(response);
            if (!v || !v.success) throw new Error('Verification failed');
            onSuccess?.(v);
          } catch (err) {
            onError?.(err);
          }
        },
        modal: {
          ondismiss: () => onError?.({ message: 'Payment modal closed by user' }),
        },
        theme: { color: '#2f6bff' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <Button
      variant="gradient"
      size="md"
      className="w-full h-12 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
      onClick={handleClick}
    >
      Buy / Unlock
    </Button>
  );
};

export default RazorpayCheckout;
