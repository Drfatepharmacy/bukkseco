import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subtotal, vendorMultiplier = 1.0 } = await req.json()

    let baseFee = 0;
    if (subtotal < 2000) baseFee = 500;
    else if (subtotal < 5000) baseFee = 800;
    else if (subtotal < 10000) baseFee = 1200;
    else baseFee = 1500;

    const deliveryFee = baseFee * vendorMultiplier;

    return new Response(
      JSON.stringify({
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
