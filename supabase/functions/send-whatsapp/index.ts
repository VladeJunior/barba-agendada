import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  shopId: string;
  phone: string;
  message?: string; // Custom message for test
  clientName?: string;
  serviceName?: string;
  servicePrice?: number;
  barberName?: string;
  dateTime?: string;
  shopName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WhatsAppRequest = await req.json();
    const { shopId, phone, message: customMessage, clientName, serviceName, servicePrice, barberName, dateTime, shopName } = data;

    console.log("Received WhatsApp request:", { shopId, phone, clientName, hasCustomMessage: !!customMessage });

    if (!shopId || !phone) {
      console.log("Missing required fields, skipping WhatsApp");
      return new Response(
        JSON.stringify({ success: false, reason: "Missing required fields" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role to access shop credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch W-API credentials for this shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("wapi_instance_id, wapi_token")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error fetching shop:", shopError);
      return new Response(
        JSON.stringify({ success: false, reason: "Shop not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If W-API credentials not configured, skip silently
    if (!shop.wapi_instance_id || !shop.wapi_token) {
      console.log("W-API credentials not configured for shop:", shopId);
      return new Response(
        JSON.stringify({ success: false, reason: "W-API not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build WhatsApp message (use custom message or build appointment message)
    let message: string;
    
    if (customMessage) {
      message = customMessage;
    } else {
      // Format date/time for appointment message
      const appointmentDate = new Date(dateTime!);
      const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const formattedPrice = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(servicePrice || 0);

      message = `✅ *Agendamento Confirmado!*

Olá, ${clientName}!

Seu agendamento na *${shopName}* foi confirmado:

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
💈 *Serviço:* ${serviceName}
👤 *Profissional:* ${barberName}
💰 *Valor:* ${formattedPrice}

Para ver ou cancelar, acesse:
${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "https://infobarber.lovable.app"}/meus-agendamentos

Até lá! 💈`;
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    // Send message via W-API
    const wapiUrl = `https://api.w-api.app/v1/message/send-text?instanceId=${shop.wapi_instance_id}`;
    
    console.log("Sending WhatsApp via W-API to:", formattedPhone);

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

    if (!wapiResponse.ok) {
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
