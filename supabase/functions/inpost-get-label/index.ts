// Supabase Edge Function: Get InPost Label
// This function returns the shipping label PDF

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getInPostLabel, InPostCredentials } from '../_shared/inpost.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get shipment ID from query params
    const url = new URL(req.url);
    const shipmentId = url.searchParams.get('shipmentId');
    const format = (url.searchParams.get('format') || 'pdf') as 'pdf' | 'zpl' | 'epl';

    if (!shipmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing shipmentId parameter' }),
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

    const credentials: InPostCredentials = { token: inpostToken };

    // Get label
    const labelResult = await getInPostLabel(credentials, parseInt(shipmentId, 10), format);

    if (labelResult.error || !labelResult.data) {
      return new Response(
        JSON.stringify({ error: 'Failed to get label: ' + labelResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return PDF
    const contentType = format === 'pdf' ? 'application/pdf' : 'text/plain';
    const extension = format === 'pdf' ? 'pdf' : format;

    return new Response(labelResult.data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="label-${shipmentId}.${extension}"`,
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
