import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { from, message, channel = "sms" } = body;

    // Log the incoming message
    await supabase.from("message_logs").insert({
      direction: "inbound",
      channel,
      phone_number: from,
      content: message,
      status: "received",
    });

    // Try to find user by phone
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("phone", from)
      .single();

    // Parse with AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let parsedData = null;

    if (LOVABLE_API_KEY) {
      const parseResponse = await fetch(`${supabaseUrl}/functions/v1/ai-parse-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ message }),
      });

      if (parseResponse.ok) {
        const result = await parseResponse.json();
        if (result.success) {
          parsedData = result.data;
        }
      }
    }

    // Update message log with parsed data
    if (parsedData) {
      await supabase
        .from("message_logs")
        .update({ parsed_data: parsedData as any, status: "parsed" })
        .eq("phone_number", from)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_found: !!profile,
        parsed: parsedData,
        message: parsedData
          ? `Understood: ${parsedData.items?.map((i: any) => `${i.quantity} ${i.unit || ""} ${i.product_name}`).join(", ")}`
          : "Message received. Our team will process your request.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("SMS webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
