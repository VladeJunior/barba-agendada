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

    // Plan prices (in BRL)
    const planPrices: Record<string, { name: string; price: number }> = {
      essencial: { name: "InfoBarber Essencial", price: 99 },
      profissional: { name: "InfoBarber Profissional", price: 149 },
      elite: { name: "InfoBarber Elite", price: 199 },
    };

    const plan = planPrices[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
    if (!ABACATEPAY_API_KEY) {
      console.error("ABACATEPAY_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Configuração de pagamento não encontrada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://infobarber.com.br";

    // Create AbacatePay billing
    const billingBody = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: `plan-${planId}-${shop.id}`,
          name: plan.name,
          description: `Assinatura mensal do plano ${plan.name}`,
          quantity: 1,
          price: plan.price * 100, // AbacatePay expects price in cents
        },
      ],
      returnUrl: `${origin}/dashboard/plans?payment=pending`,
      completionUrl: `${origin}/dashboard/plans?payment=success`,
      customer: {
        email: user.email,
      },
      metadata: {
        shop_id: shop.id,
        plan_id: planId,
        user_id: user.id,
      },
    };

    console.log("Creating AbacatePay billing:", JSON.stringify(billingBody, null, 2));

    const abacateResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
      },
      body: JSON.stringify(billingBody),
    });

    const responseText = await abacateResponse.text();
    console.log("AbacatePay response status:", abacateResponse.status);
    console.log("AbacatePay response:", responseText);

    if (!abacateResponse.ok) {
      console.error("AbacatePay error:", abacateResponse.status, responseText);
      return new Response(JSON.stringify({ error: "Erro ao criar cobrança", details: responseText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const billing = JSON.parse(responseText);
    console.log("Billing created:", billing.data?.id);

    return new Response(
      JSON.stringify({
        billing_id: billing.data?.id,
        url: billing.data?.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating billing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
