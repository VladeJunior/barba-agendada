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
    console.log("=== WEBHOOK RECEIVED ===");
    console.log("Type:", body.type);
    console.log("Action:", body.action);
    console.log("Data ID:", body.data?.id);
    console.log("Full body:", JSON.stringify(body, null, 2));

    // Handle payment notifications (direct or via action)
    const isPaymentNotification = 
      body.type === "payment" || 
      body.action === "payment.created" || 
      body.action === "payment.updated";

    if (isPaymentNotification) {
      const paymentId = body.data?.id;
      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      console.log(`Fetching payment details for ID: ${paymentId}`);

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error("Failed to fetch payment:", paymentResponse.status, errorText);
        return new Response("OK", { status: 200 });
      }

      const payment = await paymentResponse.json();
      console.log("=== PAYMENT DETAILS ===");
      console.log("Status:", payment.status);
      console.log("Status detail:", payment.status_detail);
      console.log("Payment type:", payment.payment_type_id);
      console.log("External reference:", payment.external_reference);
      console.log("Amount:", payment.transaction_amount);

      // Parse external_reference
      let externalRef;
      try {
        externalRef = JSON.parse(payment.external_reference || "{}");
      } catch (e) {
        console.error("Failed to parse external_reference:", e);
        return new Response("OK", { status: 200 });
      }

      const { shop_id, plan_id, user_id } = externalRef;
      if (!shop_id || !plan_id) {
        console.log("Missing shop_id or plan_id in external_reference");
        return new Response("OK", { status: 200 });
      }

      console.log(`Processing payment for shop: ${shop_id}, plan: ${plan_id}`);

      // Handle payment status
      if (payment.status === "approved") {
        console.log(`✅ Payment APPROVED for shop ${shop_id}, plan ${plan_id}`);

        // Fetch current shop data to implement intelligent renewal
        const { data: currentShop, error: fetchError } = await supabase
          .from("shops")
          .select("subscription_status, current_period_ends_at")
          .eq("id", shop_id)
          .single();

        if (fetchError) {
          console.error("Error fetching shop data:", fetchError);
        }

        // Calculate next billing period intelligently
        let newPeriodEndsAt: Date;
        
        if (currentShop?.subscription_status === "expired") {
          // If expired: new period = today + 30 days
          newPeriodEndsAt = new Date();
          newPeriodEndsAt.setDate(newPeriodEndsAt.getDate() + 30);
          console.log("Shop was expired, setting new period from today + 30 days");
        } else if (currentShop?.current_period_ends_at) {
          // If active or past_due: new period = old_period_ends_at + 30 days
          // This ensures the client doesn't lose days if they pay early
          newPeriodEndsAt = new Date(currentShop.current_period_ends_at);
          newPeriodEndsAt.setDate(newPeriodEndsAt.getDate() + 30);
          console.log(`Shop was ${currentShop.subscription_status}, extending from previous end date + 30 days`);
        } else {
          // Fallback: today + 30 days
          newPeriodEndsAt = new Date();
          newPeriodEndsAt.setDate(newPeriodEndsAt.getDate() + 30);
          console.log("No previous period, setting new period from today + 30 days");
        }

        const { error: updateError } = await supabase
          .from("shops")
          .update({
            plan: plan_id,
            subscription_status: "active",
            has_selected_plan: true,
            payment_provider: "mercadopago",
            payment_customer_id: payment.payer?.id?.toString() || null,
            payment_subscription_id: payment.id?.toString() || null,
            current_period_ends_at: newPeriodEndsAt.toISOString(),
            trial_ends_at: null,
          })
          .eq("id", shop_id);

        if (updateError) {
          console.error("❌ Error updating shop:", updateError);
        } else {
          console.log(`✅ Shop ${shop_id} updated to plan ${plan_id} with active status, expires: ${newPeriodEndsAt.toISOString()}`);
        }
      } else if (payment.status === "pending" || payment.status === "in_process") {
        console.log(`⏳ Payment PENDING for shop ${shop_id} - status: ${payment.status}, detail: ${payment.status_detail}`);
        
        // For PIX payments, status will be pending until user pays
        // Don't change subscription status yet, just log
        if (payment.payment_type_id === "bank_transfer" || payment.payment_type_id === "pix") {
          console.log("PIX payment awaiting user action");
        } else {
          // For other pending payments, mark as past_due
          const { error: updateError } = await supabase
            .from("shops")
            .update({
              subscription_status: "past_due",
            })
            .eq("id", shop_id);

          if (updateError) {
            console.error("Error updating shop status:", updateError);
          }
        }
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        console.log(`❌ Payment ${payment.status} for shop ${shop_id} - detail: ${payment.status_detail}`);
        // Don't change plan, just log the rejection reason
      } else {
        console.log(`Unknown payment status: ${payment.status}`);
      }
    }

    // Handle merchant_order notifications (some integrations use this)
    if (body.type === "merchant_order") {
      const orderId = body.data?.id;
      console.log(`Merchant order notification received: ${orderId}`);
      
      // Fetch merchant order details
      const orderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (orderResponse.ok) {
        const order = await orderResponse.json();
        console.log("Merchant order details:", JSON.stringify(order, null, 2));
        
        // Check if all payments are approved
        const payments = order.payments || [];
        const approvedPayments = payments.filter((p: any) => p.status === "approved");
        
        if (approvedPayments.length > 0 && order.order_status === "paid") {
          console.log("Merchant order fully paid, processing...");
          // The payment webhook should have already handled this
        }
      }
    }

    console.log("=== WEBHOOK PROCESSED ===");
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent Mercado Pago from retrying
    return new Response("OK", { status: 200 });
  }
});
