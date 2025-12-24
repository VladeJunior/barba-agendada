import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  barber_id: string;
  barber_name: string;
  barber_phone: string;
  shop_name: string;
  shop_id: string;
}

// Generate instance ID from slug: PRO-{SLUG}
const generateInstanceId = (slug: string): string => {
  return `PRO-${slug.toUpperCase()}`;
};

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  instanceId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    console.log("Sending WhatsApp to:", formattedPhone);
    console.log("Using instance:", instanceId);

    const response = await fetch(
      `https://barber-bot-production.up.railway.app/v1/message/send-text?instanceId=${instanceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      }
    );

    console.log("W-API response status:", response.status);
    
    const result = await response.json();
    console.log("W-API response:", result);

    if (!response.ok || result.error) {
      console.error("W-API error:", result);
      return { 
        success: false, 
        error: `Erro W-API (${response.status}): O WhatsApp pode estar desconectado` 
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    return { success: false, error: "Erro ao conectar com serviço WhatsApp" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { barber_id, barber_name, barber_phone, shop_name, shop_id }: InviteRequest = await req.json();

    if (!barber_id || !barber_name || !barber_phone || !shop_name || !shop_id) {
      throw new Error("Missing required fields");
    }

    // Get barber and verify ownership
    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .select("id, shop_id, shops!inner(owner_id, name)")
      .eq("id", barber_id)
      .single();

    if (barberError || !barber) {
      throw new Error("Barber not found");
    }

    if ((barber.shops as any).owner_id !== user.id) {
      throw new Error("Not authorized to invite for this barber");
    }

    // Get shop slug and token
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("slug, wapi_token")
      .eq("id", shop_id)
      .single();

    if (shopError || !shop) {
      throw new Error("Shop not found");
    }

    if (!shop.slug || !shop.wapi_token) {
      throw new Error("WhatsApp não está configurado para esta barbearia");
    }

    // Generate instance ID from slug
    const instanceId = generateInstanceId(shop.slug);
    console.log("Using generated instance ID:", instanceId);

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("barber_invitations")
      .insert({
        shop_id: barber.shop_id,
        barber_id: barber_id,
        email: `${barber_phone.replace(/\D/g, "")}@temp.local`,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Failed to create invitation:", inviteError);
      throw new Error("Erro ao criar convite: " + inviteError.message);
    }

    // Build invitation URL
    const appUrl = Deno.env.get("APP_URL") || "https://comb-plan.lovable.app";
    const inviteUrl = `${appUrl}/aceitar-convite/${invitation.token}`;
    
    console.log("Generated invite URL:", inviteUrl);

    // Build WhatsApp message
    const message = `🎉 *Convite para ${shop_name}*

Olá, ${barber_name}!

Você foi convidado para fazer parte da equipe da *${shop_name}*.

Clique no link abaixo para criar sua conta e acessar sua agenda e comissões:

👉 ${inviteUrl}

_Este convite expira em 7 dias._`;

    // Send WhatsApp message
    const whatsappResult = await sendWhatsAppMessage(
      barber_phone,
      message,
      instanceId,
      shop.wapi_token
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation_id: invitation.id,
        invite_url: inviteUrl,
        whatsapp_sent: whatsappResult.success,
        whatsapp_error: whatsappResult.error || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-barber-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
