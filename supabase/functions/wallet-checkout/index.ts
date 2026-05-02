import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Pays an order from the buyer's wallet and atomically settles
 * vendor + rider + platform shares via the immutable ledger.
 * Body: { order_id: uuid }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id || typeof order_id !== "string") {
      return json({ error: "Missing order_id" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data, error } = await admin.rpc("settle_order_payment", {
      _order_id: order_id,
      _buyer_id: user.id,
    });

    if (error) {
      // Surface a clean message for known cases
      const msg = String(error.message || "");
      const known =
        msg.includes("Insufficient wallet balance") ||
        msg.includes("Buyer mismatch") ||
        msg.includes("not found");
      return json({ error: msg }, known ? 400 : 500);
    }

    return json(data);
  } catch (err) {
    console.error("wallet-checkout error:", err);
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
