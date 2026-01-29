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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId, couponCode } = await req.json();

    // Valid coupons - can be moved to database later
    const VALID_COUPONS: Record<string, { discountPercent: number; description: string }> = {
      BARBER20: { discountPercent: 20, description: "20% de desconto" },
    };

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

    // Get user profile for name + phone + tax id (CPF/CNPJ)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, tax_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const customerName =
      profile?.full_name || shop.name || user.email?.split("@")[0] || "Cliente";

    const normalizeCellphone = (value: string | null | undefined) => {
      if (!value) return null;
      const digits = value.replace(/\D/g, "");
      if (!digits) return null;

      // Assume Brazilian numbers when country code isn't provided.
      const withCountry = digits.startsWith("55") ? digits : `55${digits}`;

      // BR: 55 + DDD(2) + phone(8-9) => 12-13 digits
      if (withCountry.length < 12 || withCountry.length > 13) return null;

      return `+${withCountry}`;
    };

    const normalizeTaxId = (value: string | null | undefined) => {
      if (!value) return null;
      const digits = value.replace(/\D/g, "");
      if (digits.length === 11 || digits.length === 14) return digits; // CPF or CNPJ
      return null;
    };

    const customerCellphone = normalizeCellphone(profile?.phone ?? shop.phone);
    if (!customerCellphone) {
      return new Response(
        JSON.stringify({
          error: "Telefone obrigatório",
          details:
            "Para gerar a cobrança, adicione um celular no seu perfil (ou telefone da barbearia) com DDD.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tax ID can come from profile or shop
    const customerTaxId = normalizeTaxId(profile?.tax_id) || normalizeTaxId((shop as any).tax_id);
    if (!customerTaxId) {
      return new Response(
        JSON.stringify({
          error: "CPF/CNPJ obrigatório",
          details:
            "Para gerar a cobrança, adicione seu CPF ou CNPJ em Configurações.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Calculate discount if coupon is provided
    let discountPercent = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const coupon = VALID_COUPONS[normalizedCode];
      if (coupon) {
        discountPercent = coupon.discountPercent;
        appliedCouponCode = normalizedCode;
        console.log(`Coupon ${normalizedCode} applied: ${discountPercent}% discount`);
      } else {
        console.log(`Invalid coupon code: ${couponCode}`);
      }
    }

    const discountAmount = (plan.price * discountPercent) / 100;
    const finalPrice = plan.price - discountAmount;

    const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
    if (!ABACATEPAY_API_KEY) {
      console.error("ABACATEPAY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento não encontrada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const origin = req.headers.get("origin") || "https://infobarber.com.br";

    // Build product description with discount info if applicable
    let productDescription = `Assinatura mensal do plano ${plan.name}`;
    if (appliedCouponCode) {
      productDescription += ` (cupom ${appliedCouponCode}: ${discountPercent}% off)`;
    }

    const billingBody = {
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      products: [
        {
          externalId: `plan-${planId}-${shop.id}`,
          name: appliedCouponCode ? `${plan.name} (${discountPercent}% OFF)` : plan.name,
          description: productDescription,
          quantity: 1,
          price: Math.round(finalPrice * 100), // AbacatePay expects price in cents
        },
      ],
      returnUrl: `${origin}/dashboard/plans?payment=pending`,
      completionUrl: `${origin}/dashboard/plans?payment=success`,
      customer: {
        name: customerName,
        email: user.email,
        cellphone: customerCellphone,
        taxId: customerTaxId,
      },
      metadata: {
        shop_id: shop.id,
        plan_id: planId,
        user_id: user.id,
        coupon_code: appliedCouponCode,
        original_price: plan.price,
        discount_percent: discountPercent,
        final_price: finalPrice,
      },
    };

    // Avoid logging sensitive customer data
    console.log("Creating AbacatePay billing", {
      planId,
      shop_id: shop.id,
      user_id: user.id,
      coupon: appliedCouponCode,
      originalPrice: plan.price,
      finalPrice,
    });

    const abacateResponse = await fetch(
      "https://api.abacatepay.com/v1/billing/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        },
        body: JSON.stringify(billingBody),
      }
    );

    const responseText = await abacateResponse.text();
    console.log("AbacatePay response status:", abacateResponse.status);

    if (!abacateResponse.ok) {
      console.error("AbacatePay error:", abacateResponse.status, responseText);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cobrança", details: responseText }),
        {
          status: abacateResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const billing = JSON.parse(responseText);

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
