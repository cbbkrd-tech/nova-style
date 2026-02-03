// Admin Products Edge Function
// Handles product CRUD operations with service_role access

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();

    switch (action) {
      // ============ PRODUCTS ============
      case 'insert_product': {
        const { error, data: product } = await supabase
          .from('products')
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: product }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_product': {
        const { id, ...updateData } = data;
        const { error, data: product } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: product }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_product': {
        const { id } = data;
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ============ PRODUCT VARIANTS ============
      case 'insert_variants': {
        const { error, data: variants } = await supabase
          .from('product_variants')
          .insert(data.variants)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: variants }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_variant': {
        const { id, ...updateData } = data;
        const { error, data: variant } = await supabase
          .from('product_variants')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: variant }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_variant': {
        const { id } = data;
        const { error } = await supabase
          .from('product_variants')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Admin products error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
