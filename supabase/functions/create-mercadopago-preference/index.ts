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

    const { planId } = await req.json();

    // Get shop data
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (shopError || !shop) {
      return new Response(JSON.stringify({ error: "Barbearia não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Plan prices
    const planPrices: Record<string, { name: string; price: number }> = {
      essencial: { name: "InfoBarber Essencial", price: 149 },
      profissional: { name: "InfoBarber Profissional", price: 199 },
      elite: { name: "InfoBarber Elite", price: 299 },
    };

    const plan = planPrices[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Configuração de pagamento não encontrada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    // Create Mercado Pago preference
    const preferenceBody = {
      items: [
        {
          title: plan.name,
          description: `Assinatura mensal do plano ${plan.name}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan.price,
        },
      ],
      payer: {
        email: user.email,
      },
      external_reference: JSON.stringify({
        shop_id: shop.id,
        plan_id: planId,
        user_id: user.id,
      }),
      back_urls: {
        success: `${req.headers.get("origin")}/dashboard/plans?payment=success`,
        failure: `${req.headers.get("origin")}/dashboard/plans?payment=failure`,
        pending: `${req.headers.get("origin")}/dashboard/plans?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "INFOBARBER",
    };

    console.log("Creating Mercado Pago preference:", JSON.stringify(preferenceBody, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago error:", mpResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao criar preferência de pagamento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const preference = await mpResponse.json();
    console.log("Preference created:", preference.id);

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating preference:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
