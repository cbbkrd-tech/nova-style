// Supabase Edge Function: Create P24 Transaction
// This function creates a new order and registers it with Przelewy24

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  registerP24Transaction,
  getP24RedirectUrl,
  P24Credentials,
  P24TransactionRequest,
} from '../_shared/p24.ts';

interface CheckoutRequest {
  // Customer info
  email: string;
  name: string;
  phone?: string;

  // Shipping address
  street: string;
  city: string;
  postalCode: string;

  // Shipping method
  shippingMethod?: 'inpost' | 'pickup';

  // Cart items
  items: Array<{
    id: number;
    name: string;
    price: number; // in PLN
    quantity: number;
    selectedSize: string;
    image: string;
  }>;

  subtotal: number; // in PLN
  shippingCost: number; // in PLN
  totalAmount: number; // in PLN
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.name || !body.street || !body.city || !body.postalCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required customer information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get P24 credentials from environment
    const p24MerchantIdRaw = Deno.env.get('P24_MERCHANT_ID') || '';
    const p24PosIdRaw = Deno.env.get('P24_POS_ID') || p24MerchantIdRaw;
    const p24CrcKey = Deno.env.get('P24_CRC_KEY') || '';
    const p24ApiKey = Deno.env.get('P24_API_KEY') || '';
    const p24Sandbox = Deno.env.get('P24_SANDBOX') === 'true';
    const storeUrl = Deno.env.get('STORE_URL') || 'http://localhost:5173';

    // Parse merchant ID - can be numeric or will be converted from string
    const p24MerchantId = parseInt(p24MerchantIdRaw, 10) || 0;
    const p24PosId = parseInt(p24PosIdRaw, 10) || p24MerchantId;

    console.log('P24 Config:', {
      merchantId: p24MerchantId,
      posId: p24PosId,
      sandbox: p24Sandbox,
      storeUrl,
      hasCrcKey: !!p24CrcKey,
      hasApiKey: !!p24ApiKey,
    });

    if (!p24MerchantId || !p24CrcKey || !p24ApiKey) {
      console.error('Missing P24 credentials. MerchantID:', p24MerchantId, 'CRC:', !!p24CrcKey, 'API:', !!p24ApiKey);
      return new Response(
        JSON.stringify({ error: 'Payment configuration error - check P24 credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique session ID
    const sessionId = `nova_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Convert amounts to grosze (1/100 PLN)
    const amountInGrosze = Math.round(body.totalAmount * 100);
    const subtotalInGrosze = Math.round(body.subtotal * 100);
    const shippingInGrosze = Math.round(body.shippingCost * 100);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        session_id: sessionId,
        customer_email: body.email,
        customer_name: body.name,
        customer_phone: body.phone || null,
        shipping_street: body.street,
        shipping_city: body.city,
        shipping_postal_code: body.postalCode,
        shipping_method: body.shippingMethod || 'inpost',
        items: body.items,
        subtotal: subtotalInGrosze,
        shipping_cost: shippingInGrosze,
        total_amount: amountInGrosze,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare P24 credentials
    const credentials: P24Credentials = {
      merchantId: p24MerchantId,
      posId: p24PosId,
      crcKey: p24CrcKey,
      apiKey: p24ApiKey,
      sandbox: p24Sandbox,
    };

    // Prepare transaction request
    const transactionRequest: P24TransactionRequest = {
      sessionId: sessionId,
      amount: amountInGrosze,
      currency: 'PLN',
      description: `Zamówienie Nova Style #${sessionId.substring(0, 12)}`,
      email: body.email,
      country: 'PL',
      language: 'pl',
      urlReturn: `${storeUrl}/#payment-success?session=${sessionId}`,
      urlStatus: `${supabaseUrl}/functions/v1/p24-webhook`,
      client: body.name,
      address: body.street,
      zip: body.postalCode,
      city: body.city,
      phone: body.phone,
    };

    // Register transaction with P24
    const p24Response = await registerP24Transaction(credentials, transactionRequest);

    if (p24Response.error || !p24Response.data?.token) {
      console.error('P24 registration failed:', p24Response);

      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'payment_failed' })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({
          error: 'Payment registration failed',
          details: p24Response.error,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with P24 token
    await supabase
      .from('orders')
      .update({
        p24_token: p24Response.data.token,
        status: 'payment_started',
      })
      .eq('id', order.id);

    // Generate redirect URL
    const redirectUrl = getP24RedirectUrl(p24Response.data.token, p24Sandbox);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        sessionId: sessionId,
        redirectUrl: redirectUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
