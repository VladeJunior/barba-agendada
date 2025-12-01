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

    // Verify the user making the request
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { barber_id, barber_name, barber_phone, shop_name, shop_id }: InviteRequest = await req.json();

    // Validate input
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

    // Get shop W-API credentials
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("wapi_instance_id, wapi_token")
      .eq("id", shop_id)
      .single();

    if (shopError || !shop) {
      throw new Error("Shop not found");
    }

    if (!shop.wapi_instance_id || !shop.wapi_token) {
      throw new Error("W-API not configured for this shop");
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("barber_invitations")
      .insert({
        shop_id: barber.shop_id,
        barber_id: barber_id,
        email: `${barber_phone}@temp.local`, // Temporary email, will be replaced when barber registers
      })
      .select()
      .single();

    if (inviteError) {
      throw new Error("Failed to create invitation: " + inviteError.message);
    }

    // Build invitation URL using configured APP_URL
    const appUrl = Deno.env.get("APP_URL") || "https://comb-plan.lovable.app";
    const inviteUrl = `${appUrl}/aceitar-convite/${invitation.token}`;
    
    console.log("Using APP_URL:", appUrl);
    console.log("Generated invite URL:", inviteUrl);

    // Format phone number for WhatsApp (remove non-digits)
    const cleanPhone = barber_phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    // Send WhatsApp message via W-API
    const wapiUrl = `https://api.w-api.online/${shop.wapi_instance_id}/messages/text`;
    
    const message = `🎉 *Convite para InfoBarber*

Olá, ${barber_name}!

Você foi convidado para fazer parte da equipe da *${shop_name}*.

Clique no link abaixo para criar sua conta e acessar sua agenda e comissões:

👉 ${inviteUrl}

_Este convite expira em 7 dias._`;

    const whatsappResponse = await fetch(wapiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${shop.wapi_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      throw new Error(`Failed to send WhatsApp: ${errorData}`);
    }

    const whatsappResult = await whatsappResponse.json();
    console.log("WhatsApp invitation sent:", whatsappResult);

    return new Response(
      JSON.stringify({ success: true, invitation_id: invitation.id }),
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
