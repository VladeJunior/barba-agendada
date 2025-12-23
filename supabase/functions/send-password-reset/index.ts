import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://infobarber.lovable.app";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log("User not found, but returning success for security");
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this email
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("used", false);

    // Save new token
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error saving token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar token de recuperação" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build reset link
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "InfoBarber <noreply@infosage.com.br>",
      to: [email],
      subject: "Recuperação de Senha - InfoBarber",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #0a0a0a; font-size: 28px; font-weight: bold;">InfoBarber</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #D4AF37; font-size: 24px;">Recuperação de Senha</h2>
                      
                      <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        Olá,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        Recebemos uma solicitação para redefinir a senha da sua conta InfoBarber. Clique no botão abaixo para criar uma nova senha:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                              Redefinir Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 20px 0; color: #888888; font-size: 14px; line-height: 1.6;">
                        Este link expira em <strong style="color: #D4AF37;">1 hora</strong>.
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #888888; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou esta recuperação de senha, pode ignorar este email com segurança.
                      </p>
                      
                      <!-- Alternative link -->
                      <div style="background-color: #0a0a0a; border-radius: 8px; padding: 15px; margin-top: 30px;">
                        <p style="margin: 0 0 10px 0; color: #888888; font-size: 12px;">
                          Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                        </p>
                        <p style="margin: 0; color: #D4AF37; font-size: 12px; word-break: break-all;">
                          ${resetLink}
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0a0a0a; padding: 20px 30px; border-top: 1px solid #2a2a2a;">
                      <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} InfoBarber. Todos os direitos reservados.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #666666; font-size: 12px; text-align: center;">
                        Sistema de gestão para barbearias
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
