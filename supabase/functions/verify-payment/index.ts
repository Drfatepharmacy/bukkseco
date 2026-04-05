import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reference, order_id } = await req.json();

    if (!reference || typeof reference !== "string") {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } }
    );
    const verifyData = await verifyRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (verifyData.data?.status === "success") {
      // Update order payment status
      if (order_id) {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", payment_reference: reference })
          .eq("id", order_id);
      }

      // Log success event
      await supabase.from("event_logs").insert({
        event_type: "payment_verified",
        target_type: "order",
        target_id: order_id || null,
        metadata: { reference, amount: verifyData.data.amount, channel: verifyData.data.channel },
      });

      return new Response(JSON.stringify({ status: "success", data: verifyData.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Log failed payment
      await supabase.from("security_events").insert({
        event_type: "payment_verification_failed",
        severity: "high",
        details: { reference, paystack_status: verifyData.data?.status, gateway_response: verifyData.data?.gateway_response },
      });

      if (order_id) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed", payment_reference: reference })
          .eq("id", order_id);
      }

      return new Response(JSON.stringify({ status: "failed", message: verifyData.data?.gateway_response || "Payment failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
