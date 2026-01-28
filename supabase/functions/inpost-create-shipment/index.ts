// Supabase Edge Function: Create InPost Shipment
// This function creates a shipment in InPost ShipX API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  createInPostShipment,
  buyInPostShipment,
  getInPostOffers,
  InPostCredentials,
  InPostShipmentRequest,
  NOVA_STYLE_SENDER,
} from '../_shared/inpost.ts';

interface CreateShipmentRequest {
  orderId: number;
  parcelSize: 'small' | 'medium' | 'large';
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
    const body: CreateShipmentRequest = await req.json();

    // Validate required fields
    if (!body.orderId || !body.parcelSize) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId or parcelSize' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get InPost token from environment
    const inpostToken = Deno.env.get('INPOST_API_TOKEN');
    if (!inpostToken) {
      return new Response(
        JSON.stringify({ error: 'InPost API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if shipment already exists
    if (order.inpost_shipment_id) {
      return new Response(
        JSON.stringify({
          error: 'Shipment already created',
          shipmentId: order.inpost_shipment_id,
          trackingNumber: order.inpost_tracking_number,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const credentials: InPostCredentials = { token: inpostToken };

    // Parse customer name into first_name and last_name
    const nameParts = order.customer_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    // Determine service type based on shipping method
    const isPaczkomat = order.shipping_method === 'paczkomat';
    const isCourier = order.shipping_method === 'courier';

    if (!isPaczkomat && !isCourier) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipping method for InPost: ' + order.shipping_method }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract paczkomat code from shipping_street if paczkomat
    let paczkomatCode = '';
    if (isPaczkomat) {
      // shipping_street format: "Paczkomat: ABC123M"
      const match = order.shipping_street.match(/Paczkomat:\s*(\S+)/i);
      paczkomatCode = match ? match[1] : '';

      if (!paczkomatCode) {
        return new Response(
          JSON.stringify({ error: 'Paczkomat code not found in order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build shipment request
    let shipmentRequest: InPostShipmentRequest;

    if (isPaczkomat) {
      shipmentRequest = {
        receiver: {
          email: order.customer_email,
          phone: order.customer_phone || '000000000',
          first_name: firstName,
          last_name: lastName,
        },
        parcels: {
          template: body.parcelSize,
        },
        service: 'inpost_locker_standard',
        reference: `Nova Style #${order.id}`,
        custom_attributes: {
          target_point: paczkomatCode,
          sending_method: 'dispatch_order', // Courier will pick up from our address
        },
      };
    } else {
      // Courier delivery - parse address
      // Format: "ul. Example 123/4"
      const streetParts = order.shipping_street.split(/\s+/);
      const buildingNumber = streetParts.pop() || '';
      const street = streetParts.join(' ').replace(/^ul\.?\s*/i, '');

      shipmentRequest = {
        receiver: {
          email: order.customer_email,
          phone: order.customer_phone || '000000000',
          first_name: firstName,
          last_name: lastName,
          address: {
            street: street,
            building_number: buildingNumber,
            city: order.shipping_city,
            post_code: order.shipping_postal_code,
            country_code: 'PL',
          },
        },
        parcels: {
          template: body.parcelSize,
        },
        service: 'inpost_courier_c2c',
        reference: `Nova Style #${order.id}`,
        additional_services: ['email', 'sms'],
      };
    }

    console.log('Creating InPost shipment:', JSON.stringify(shipmentRequest, null, 2));

    // Create shipment
    const createResult = await createInPostShipment(credentials, shipmentRequest);

    if (createResult.error || !createResult.data) {
      console.error('Failed to create shipment:', createResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to create shipment: ' + createResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shipment = createResult.data;
    console.log('Shipment created:', shipment.id, 'Status:', shipment.status);

    // Get offers for the shipment
    const offersResult = await getInPostOffers(credentials, shipment.id);

    if (offersResult.error || !offersResult.data) {
      console.error('Failed to get offers:', offersResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to get shipping offers: ' + offersResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const offers = offersResult.data.offers || [];
    console.log('Available offers:', offers.length);

    // Find available offer
    const availableOffer = offers.find(o => o.status === 'available' || o.status === 'in_preparation');

    if (!availableOffer) {
      console.error('No available offer found. Offers:', offers);
      return new Response(
        JSON.stringify({
          error: 'No shipping offer available',
          shipmentId: shipment.id,
          shipmentStatus: shipment.status,
          offers: offers,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buying offer:', availableOffer.id);

    // Buy/confirm the shipment
    const buyResult = await buyInPostShipment(credentials, shipment.id, availableOffer.id);

    if (buyResult.error || !buyResult.data) {
      console.error('Failed to buy shipment:', buyResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to confirm shipment: ' + buyResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const confirmedShipment = buyResult.data;
    const trackingNumber = confirmedShipment.tracking_number ||
      confirmedShipment.parcels?.[0]?.tracking_number || '';

    console.log('Shipment confirmed! Tracking:', trackingNumber);

    // Update order with shipment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        inpost_shipment_id: shipment.id,
        inpost_tracking_number: trackingNumber,
        inpost_status: confirmedShipment.status,
        status: 'shipped',
      })
      .eq('id', body.orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      // Continue anyway - shipment was created
    }

    return new Response(
      JSON.stringify({
        success: true,
        shipmentId: shipment.id,
        trackingNumber: trackingNumber,
        status: confirmedShipment.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
