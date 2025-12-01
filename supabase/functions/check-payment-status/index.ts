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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get shop data
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, plan, subscription_status, payment_subscription_id, current_period_ends_at")
      .eq("owner_id", user.id)
      .single();

    if (shopError || !shop) {
      return new Response(JSON.stringify({ error: "Barbearia não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If there's a payment_subscription_id, check with Mercado Pago
    if (shop.payment_subscription_id) {
      const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      
      if (MERCADOPAGO_ACCESS_TOKEN) {
        try {
          const paymentResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${shop.payment_subscription_id}`,
            {
              headers: {
                Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
              },
            }
          );

          if (paymentResponse.ok) {
            const payment = await paymentResponse.json();
            console.log("Payment status check:", payment.status);

            // If payment is approved but shop status is not active, update it
            if (payment.status === "approved" && shop.subscription_status !== "active") {
              const supabaseAdmin = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
              );

              const currentPeriodEndsAt = new Date();
              currentPeriodEndsAt.setDate(currentPeriodEndsAt.getDate() + 30);

              await supabaseAdmin
                .from("shops")
                .update({
                  subscription_status: "active",
                  current_period_ends_at: currentPeriodEndsAt.toISOString(),
                  trial_ends_at: null,
                })
                .eq("id", shop.id);

              return new Response(
                JSON.stringify({
                  status: "active",
                  plan: shop.plan,
                  payment_status: payment.status,
                  updated: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({
                status: shop.subscription_status,
                plan: shop.plan,
                payment_status: payment.status,
                updated: false,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (e) {
          console.error("Error checking payment with MP:", e);
        }
      }
    }

    // Return current shop status
    return new Response(
      JSON.stringify({
        status: shop.subscription_status,
        plan: shop.plan,
        payment_status: null,
        updated: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
