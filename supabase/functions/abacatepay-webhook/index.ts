import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate webhook secret from query parameter
    const url = new URL(req.url);
    const secretParam = url.searchParams.get("secret");
    
    if (webhookSecret && secretParam !== webhookSecret) {
      console.error("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("AbacatePay webhook received:", JSON.stringify(body, null, 2));

    const event = body.event;
    const data = body.data;

    if (event === "billing.paid") {
      const billing = data?.billing;
      const payment = data?.payment;
      const metadata = billing?.metadata;

      if (!metadata?.shop_id || !metadata?.plan_id) {
        console.error("Missing metadata in billing:", billing);
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const shopId = metadata.shop_id;
      const planId = metadata.plan_id;

      console.log(`Processing payment for shop ${shopId}, plan ${planId}`);

      // Calculate subscription end date (30 days from now)
      const currentPeriodEndsAt = new Date();
      currentPeriodEndsAt.setDate(currentPeriodEndsAt.getDate() + 30);

      // Update shop subscription
      const { error: updateError } = await supabase
        .from("shops")
        .update({
          plan: planId,
          subscription_status: "active",
          payment_provider: "abacatepay",
          payment_subscription_id: billing.id,
          current_period_ends_at: currentPeriodEndsAt.toISOString(),
          trial_ends_at: null,
        })
        .eq("id", shopId);

      if (updateError) {
        console.error("Error updating shop:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Shop ${shopId} subscription updated successfully to plan ${planId}`);

      return new Response(JSON.stringify({ success: true, message: "Subscription updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle other events (billing.created, billing.expired, etc.)
    console.log(`Received event ${event}, no action taken`);

    return new Response(JSON.stringify({ success: true, message: "Event received" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent retries
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
