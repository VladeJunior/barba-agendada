import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  barber_id: string;
  email: string;
  barber_name: string;
  shop_name: string;
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

    const { barber_id, email, barber_name, shop_name }: InviteRequest = await req.json();

    // Validate input
    if (!barber_id || !email || !barber_name || !shop_name) {
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

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("barber_invitations")
      .insert({
        shop_id: barber.shop_id,
        barber_id: barber_id,
        email: email.toLowerCase().trim(),
      })
      .select()
      .single();

    if (inviteError) {
      throw new Error("Failed to create invitation: " + inviteError.message);
    }

    // Build invitation URL using configured APP_URL
    const appUrl = Deno.env.get("APP_URL") || "https://comb-plan.lovable.app";
    const inviteUrl = `${appUrl}/aceitar-convite/${invitation.token}`;

    // Send email using Resend API directly
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InfoBarber <onboarding@resend.dev>",
        to: [email],
        subject: `Convite para fazer parte da equipe - ${shop_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: #d4af37; margin: 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>InfoBarber</h1>
              </div>
              <div class="content">
                <h2>Olá, ${barber_name}!</h2>
                <p>Você foi convidado para fazer parte da equipe da <strong>${shop_name}</strong> no InfoBarber.</p>
                <p>Com o InfoBarber você poderá:</p>
                <ul>
                  <li>Visualizar sua agenda de atendimentos</li>
                  <li>Acompanhar suas comissões</li>
                  <li>Gerenciar seus horários</li>
                </ul>
                <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
                <p style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Aceitar Convite</a>
                </p>
                <p style="font-size: 14px; color: #666;">
                  Ou copie e cole este link no seu navegador:<br>
                  <a href="${inviteUrl}">${inviteUrl}</a>
                </p>
                <p style="font-size: 12px; color: #999;">
                  Este convite expira em 7 dias.
                </p>
              </div>
              <div class="footer">
                <p>InfoBarber - Sistema de Agendamento para Barbearias</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailResult = await emailResponse.json();

    console.log("Invitation email sent:", emailResult);

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
