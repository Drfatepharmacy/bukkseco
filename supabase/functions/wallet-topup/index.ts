import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Wallet top-up flow:
 *   action=initialize -> create Paystack transaction, return authorization_url
 *   action=verify     -> verify Paystack ref, credit wallet via immutable ledger
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecret) return json({ error: "Payments not configured" }, 500);

    // Resolve user from JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "initialize") {
      const amountNgn = Number(body.amount);
      if (!amountNgn || amountNgn < 100) {
        return json({ error: "Minimum top-up is ₦100" }, 400);
      }
      const reference = `BKW-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      const init = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(amountNgn * 100),
          reference,
          metadata: { user_id: user.id, purpose: "wallet_topup" },
        }),
      });
      const initData = await init.json();
      if (!initData?.status) {
        return json({ error: initData?.message || "Init failed" }, 400);
      }

      await admin.from("paystack_transactions").insert({
        user_id: user.id,
        reference,
        amount: amountNgn,
        purpose: "wallet_topup",
        status: "pending",
        raw_response: initData.data,
      });

      return json({
        authorization_url: initData.data.authorization_url,
        reference,
      });
    }

    if (action === "verify") {
      const reference = String(body.reference || "");
      if (!reference) return json({ error: "Missing reference" }, 400);

      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${paystackSecret}` } },
      );
      const v = await verifyRes.json();

      if (v?.data?.status !== "success") {
        await admin
          .from("paystack_transactions")
          .update({ status: "failed", raw_response: v, verified_at: new Date().toISOString() })
          .eq("reference", reference);
        return json({ status: "failed", message: v?.data?.gateway_response || "Failed" }, 400);
      }

      // Idempotency: skip if already credited
      const { data: existingTx } = await admin
        .from("wallet_transactions")
        .select("id")
        .eq("related_paystack_ref", reference)
        .maybeSingle();
      if (existingTx) return json({ status: "already_credited" });

      const amountNgn = Number(v.data.amount) / 100;

      // Get wallet
      const { data: wallet } = await admin
        .from("wallets")
        .select("id, balance, tenant_id")
        .eq("user_id", user.id)
        .single();
      if (!wallet) return json({ error: "Wallet missing" }, 500);

      const newBalance = Number(wallet.balance) + amountNgn;

      // Update balance
      await admin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      // Append immutable ledger entry
      await admin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        tenant_id: wallet.tenant_id,
        type: "deposit",
        amount: amountNgn,
        balance_after: newBalance,
        reference: `LDG-${reference}`,
        related_paystack_ref: reference,
        metadata: { description: "Wallet top-up", channel: v.data.channel },
      });

      await admin
        .from("paystack_transactions")
        .update({ status: "success", verified_at: new Date().toISOString(), raw_response: v.data })
        .eq("reference", reference);

      return json({ status: "success", balance: newBalance });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("wallet-topup error:", err);
    return json({ error: String(err?.message || err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
