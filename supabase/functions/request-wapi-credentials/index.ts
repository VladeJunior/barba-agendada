import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CredentialRequest {
  ownerName: string;
  ownerEmail: string;
  shopName: string;
  shopPhone: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ownerName, ownerEmail, shopName, shopPhone }: CredentialRequest = await req.json();

    console.log("Received credential request:", { ownerName, ownerEmail, shopName, shopPhone });

    if (!ownerName || !ownerEmail || !shopName) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
          📋 Nova Solicitação de Credenciais W-API
        </h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #333;">Dados do Cliente</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Nome:</strong></td>
              <td style="padding: 8px 0; color: #333;">${ownerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #333;">
                <a href="mailto:${ownerEmail}" style="color: #d4af37;">${ownerEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Barbearia:</strong></td>
              <td style="padding: 8px 0; color: #333;">${shopName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Telefone:</strong></td>
              <td style="padding: 8px 0; color: #333;">${shopPhone || "Não informado"}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37;">
          <p style="margin: 0; color: #856404;">
            <strong>Ação necessária:</strong> Crie uma instância W-API LITE e envie as credenciais 
            (ID da Instância e Token) para o cliente através do email informado acima.
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
          Este email foi enviado automaticamente pelo sistema InfoBarber.
        </p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "InfoBarber <onboarding@resend.dev>",
        to: ["contato@infosage.com.br"],
        subject: "[InfoBarber] Nova Solicitação de Credenciais W-API",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email API response:", emailResult);

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in request-wapi-credentials function:", error);
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
