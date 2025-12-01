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

    const { planId, paymentMethod, cardToken, payer } = await req.json();

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

    const externalReference = JSON.stringify({
      shop_id: shop.id,
      plan_id: planId,
      user_id: user.id,
    });

    let paymentBody: Record<string, unknown>;

    if (paymentMethod === "pix") {
      // PIX payment
      paymentBody = {
        transaction_amount: plan.price,
        payment_method_id: "pix",
        payer: {
          email: user.email,
          first_name: payer.firstName,
          last_name: payer.lastName,
          identification: {
            type: "CPF",
            number: payer.cpf,
          },
        },
        description: `Assinatura ${plan.name}`,
        external_reference: externalReference,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      };
    } else if (paymentMethod === "credit_card") {
      // Credit card payment - ALWAYS installments = 1 (no installments)
      paymentBody = {
        transaction_amount: plan.price,
        token: cardToken,
        installments: 1, // Force single payment
        payer: {
          email: user.email,
          identification: {
            type: "CPF",
            number: payer.cpf,
          },
        },
        description: `Assinatura ${plan.name}`,
        external_reference: externalReference,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      };
    } else {
      return new Response(JSON.stringify({ error: "Método de pagamento inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating payment:", JSON.stringify({ ...paymentBody, token: cardToken ? "[REDACTED]" : undefined }, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `${shop.id}-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();
    console.log("Mercado Pago response:", JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpResponse.status, JSON.stringify(mpData));
      const errorMessage = mpData.message || mpData.cause?.[0]?.description || "Erro ao processar pagamento";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle response based on payment method
    if (paymentMethod === "pix") {
      // PIX returns pending status with QR code
      const pixInfo = mpData.point_of_interaction?.transaction_data;
      
      return new Response(
        JSON.stringify({
          status: mpData.status,
          paymentId: mpData.id,
          pix: {
            qrCode: pixInfo?.qr_code_base64,
            qrCodeText: pixInfo?.qr_code,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Credit card - update shop immediately if approved
      if (mpData.status === "approved") {
        const periodEndsAt = new Date();
        periodEndsAt.setDate(periodEndsAt.getDate() + 30);

        await supabase
          .from("shops")
          .update({
            plan: planId,
            subscription_status: "active",
            has_selected_plan: true,
            payment_provider: "mercadopago",
            payment_subscription_id: String(mpData.id),
            current_period_ends_at: periodEndsAt.toISOString(),
          })
          .eq("id", shop.id);
      }

      return new Response(
        JSON.stringify({
          status: mpData.status,
          statusDetail: mpData.status_detail,
          paymentId: mpData.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
