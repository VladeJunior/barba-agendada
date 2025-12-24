import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  shopId: string;
  shopSlug?: string;
  phone: string;
  message?: string;
  clientName?: string;
  serviceName?: string;
  servicePrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  barberName?: string;
  dateTime?: string;
  shopName?: string;
}

// Generate instance ID from slug: PRO-{SLUG}
const generateInstanceId = (slug: string): string => {
  return `PRO-${slug.toUpperCase()}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WhatsAppRequest = await req.json();
    const { shopId, shopSlug, phone, message: customMessage, clientName, serviceName, servicePrice, originalPrice, discountAmount, barberName, dateTime, shopName } = data;

    console.log("Received WhatsApp request:", { shopId, shopSlug, phone, clientName, hasCustomMessage: !!customMessage });

    if (!shopId || !phone) {
      console.log("Missing required fields, skipping WhatsApp");
      return new Response(
        JSON.stringify({ success: false, reason: "Missing required fields" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch shop slug and token
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("slug, wapi_token")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error fetching shop:", shopError);
      return new Response(
        JSON.stringify({ success: false, reason: "Shop not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!shop.slug || !shop.wapi_token) {
      console.log("Shop missing slug or token:", shopId);
      return new Response(
        JSON.stringify({ success: false, reason: "W-API not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate instance ID from slug
    const instanceId = generateInstanceId(shop.slug);
    console.log("Using generated instance ID:", instanceId);

    // Build WhatsApp message
    let message: string;
    
    if (customMessage) {
      message = customMessage;
    } else {
      const appointmentDate = new Date(dateTime!);
      const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "America/Sao_Paulo",
      });
      const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      const formattedPrice = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(servicePrice || 0);

      let priceInfo = `💰 *Valor:* ${formattedPrice}`;
      if (discountAmount && discountAmount > 0 && originalPrice) {
        const formattedOriginalPrice = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(originalPrice);
        const formattedDiscount = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(discountAmount);
        priceInfo = `💰 *Valor:* ~${formattedOriginalPrice}~ ${formattedPrice} _(desconto: ${formattedDiscount})_`;
      }

      const appUrl = Deno.env.get("APP_URL") || "https://comb-plan.lovable.app";
      const slug = shopSlug || shop.slug;
      const appointmentsUrl = `${appUrl}/agendar/${slug}/meus-agendamentos`;

      message = `✅ *Agendamento Confirmado!*

Olá, ${clientName}!

Seu agendamento na *${shopName}* foi confirmado:

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
💈 *Serviço:* ${serviceName}
👤 *Profissional:* ${barberName}
${priceInfo}

Para ver ou cancelar, acesse:
${appointmentsUrl}

Até lá! 💈`;
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    // Send message via WhatsApp API
    const wapiUrl = `https://barber-bot-production.up.railway.app/v1/message/send-text?instanceId=${instanceId}`;
    
    console.log("Sending WhatsApp via W-API to:", formattedPhone);
    console.log("Using instance:", instanceId);

    const wapiResponse = await fetch(wapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${shop.wapi_token}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const wapiResult = await wapiResponse.json();
    console.log("W-API response:", wapiResult);

    if (!wapiResponse.ok || wapiResult.error) {
      console.error("W-API error:", wapiResult);
      return new Response(
        JSON.stringify({ success: false, reason: "W-API error", details: wapiResult }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, wapiResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
