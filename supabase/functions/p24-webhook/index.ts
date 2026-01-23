// Supabase Edge Function: P24 Webhook
// This function receives payment notifications from Przelewy24 and verifies transactions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  verifyP24Transaction,
  generateP24Sign,
  P24Credentials,
} from '../_shared/p24.ts';

interface P24WebhookPayload {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
}

Deno.serve(async (req) => {
  // P24 webhook always uses POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Parse webhook payload
    // P24 sends data as application/x-www-form-urlencoded
    const contentType = req.headers.get('content-type') || '';
    let payload: P24WebhookPayload;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      payload = {
        merchantId: parseInt(formData.get('merchantId') as string || '0'),
        posId: parseInt(formData.get('posId') as string || '0'),
        sessionId: formData.get('sessionId') as string || '',
        amount: parseInt(formData.get('amount') as string || '0'),
        originAmount: parseInt(formData.get('originAmount') as string || '0'),
        currency: formData.get('currency') as string || 'PLN',
        orderId: parseInt(formData.get('orderId') as string || '0'),
        methodId: parseInt(formData.get('methodId') as string || '0'),
        statement: formData.get('statement') as string || '',
        sign: formData.get('sign') as string || '',
      };
    } else {
      // Fallback to JSON parsing
      payload = await req.json();
    }

    console.log('P24 Webhook received:', JSON.stringify(payload));

    // Validate required fields
    if (!payload.sessionId || !payload.orderId || !payload.amount) {
      console.error('Missing required webhook fields');
      return new Response('Bad Request', { status: 400 });
    }

    // Get P24 credentials from environment
    const p24MerchantId = parseInt(Deno.env.get('P24_MERCHANT_ID') || '0');
    const p24CrcKey = Deno.env.get('P24_CRC_KEY') || '';
    const p24ApiKey = Deno.env.get('P24_API_KEY') || '';
    const p24PosId = parseInt(Deno.env.get('P24_POS_ID') || Deno.env.get('P24_MERCHANT_ID') || '0');
    const p24Sandbox = Deno.env.get('P24_SANDBOX') === 'true';

    // Verify the webhook signature
    const expectedSign = await generateP24Sign(
      {
        merchantId: payload.merchantId,
        posId: payload.posId,
        sessionId: payload.sessionId,
        amount: payload.amount,
        originAmount: payload.originAmount,
        currency: payload.currency,
        orderId: payload.orderId,
        methodId: payload.methodId,
        statement: payload.statement,
      },
      p24CrcKey
    );

    if (payload.sign !== expectedSign) {
      console.error('Invalid webhook signature');
      console.error('Received:', payload.sign);
      console.error('Expected:', expectedSign);
      // In sandbox mode, we might want to continue for testing
      if (!p24Sandbox) {
        return new Response('Invalid signature', { status: 400 });
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the order by session ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('session_id', payload.sessionId)
      .single();

    if (findError || !order) {
      console.error('Order not found:', payload.sessionId);
      return new Response('Order not found', { status: 404 });
    }

    // Update order with P24 order ID
    await supabase
      .from('orders')
      .update({
        p24_order_id: payload.orderId,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // Verify the transaction with P24
    const credentials: P24Credentials = {
      merchantId: p24MerchantId,
      posId: p24PosId,
      crcKey: p24CrcKey,
      apiKey: p24ApiKey,
      sandbox: p24Sandbox,
    };

    const verifyResult = await verifyP24Transaction(credentials, {
      sessionId: payload.sessionId,
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
    });

    if (verifyResult.success) {
      // Update order status to verified
      await supabase
        .from('orders')
        .update({ status: 'verified' })
        .eq('id', order.id);

      console.log(`Order ${order.id} verified successfully`);
    } else {
      console.error('Transaction verification failed:', verifyResult.error);
      // Keep status as 'paid' - manual verification may be needed
    }

    // Return OK to P24
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
