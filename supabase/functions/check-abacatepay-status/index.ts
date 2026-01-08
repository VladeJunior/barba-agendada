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
      .select("id, plan, subscription_status, payment_subscription_id, payment_provider, current_period_ends_at")
      .eq("owner_id", user.id)
      .single();

    if (shopError || !shop) {
      return new Response(JSON.stringify({ error: "Barbearia não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If there's a payment_subscription_id from AbacatePay, check the billing status
    if (shop.payment_subscription_id && shop.payment_provider === "abacatepay") {
      const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");

      if (ABACATEPAY_API_KEY) {
        try {
          const billingResponse = await fetch(
            `https://api.abacatepay.com/v1/billing/get?id=${shop.payment_subscription_id}`,
            {
              headers: {
                Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
              },
            }
          );

          if (billingResponse.ok) {
            const billingData = await billingResponse.json();
            const billing = billingData.data;
            console.log("AbacatePay billing status:", billing?.status);

            // If billing is PAID but shop status is not active, update it
            if (billing?.status === "PAID" && shop.subscription_status !== "active") {
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
                  billing_status: billing.status,
                  updated: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({
                status: shop.subscription_status,
                plan: shop.plan,
                billing_status: billing?.status,
                updated: false,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (e) {
          console.error("Error checking billing with AbacatePay:", e);
        }
      }
    }

    // Return current shop status
    return new Response(
      JSON.stringify({
        status: shop.subscription_status,
        plan: shop.plan,
        billing_status: null,
        updated: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking billing status:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
