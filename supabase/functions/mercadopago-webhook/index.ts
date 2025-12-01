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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response("Configuration error", { status: 500 });
    }

    // Parse webhook data
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Mercado Pago sends different types of notifications
    if (body.type === "payment") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error("Failed to fetch payment:", paymentResponse.status);
        return new Response("OK", { status: 200 });
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify(payment, null, 2));

      // Parse external_reference
      let externalRef;
      try {
        externalRef = JSON.parse(payment.external_reference || "{}");
      } catch {
        console.error("Failed to parse external_reference");
        return new Response("OK", { status: 200 });
      }

      const { shop_id, plan_id } = externalRef;
      if (!shop_id || !plan_id) {
        console.log("Missing shop_id or plan_id in external_reference");
        return new Response("OK", { status: 200 });
      }

      // Handle payment status
      if (payment.status === "approved") {
        console.log(`Payment approved for shop ${shop_id}, plan ${plan_id}`);

        // Calculate next billing period (30 days from now)
        const currentPeriodEndsAt = new Date();
        currentPeriodEndsAt.setDate(currentPeriodEndsAt.getDate() + 30);

        const { error: updateError } = await supabase
          .from("shops")
          .update({
            plan: plan_id,
            subscription_status: "active",
            payment_provider: "mercadopago",
            payment_customer_id: payment.payer?.id?.toString() || null,
            payment_subscription_id: payment.id?.toString() || null,
            current_period_ends_at: currentPeriodEndsAt.toISOString(),
            trial_ends_at: null,
          })
          .eq("id", shop_id);

        if (updateError) {
          console.error("Error updating shop:", updateError);
        } else {
          console.log(`Shop ${shop_id} updated to plan ${plan_id} with active status`);
        }
      } else if (payment.status === "pending" || payment.status === "in_process") {
        console.log(`Payment pending for shop ${shop_id}`);
        
        const { error: updateError } = await supabase
          .from("shops")
          .update({
            subscription_status: "past_due",
          })
          .eq("id", shop_id);

        if (updateError) {
          console.error("Error updating shop status:", updateError);
        }
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        console.log(`Payment ${payment.status} for shop ${shop_id}`);
        // Don't change plan, just log
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});
