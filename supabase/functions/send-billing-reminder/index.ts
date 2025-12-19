import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop_id } = await req.json();

    if (!shop_id) {
      return new Response(
        JSON.stringify({ error: "shop_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get shop and owner information
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*, profiles!inner(phone, full_name)')
      .eq('id', shop_id)
      .single();

    if (shopError || !shop) {
      console.error("Error fetching shop:", shopError);
      return new Response(
        JSON.stringify({ error: "Barbearia não encontrada" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if W-API is configured
    if (!shop.wapi_instance_id || !shop.wapi_token) {
      console.log("W-API not configured for shop:", shop_id);
      return new Response(
        JSON.stringify({ error: "W-API não configurado para esta barbearia" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ownerPhone = shop.profiles?.phone;
    if (!ownerPhone) {
      console.log("Owner phone not found for shop:", shop_id);
      return new Response(
        JSON.stringify({ error: "Telefone do proprietário não encontrado" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare reminder message based on subscription status
    let message = "";
    const planNames = {
      essencial: "Essencial (R$ 149/mês)",
      profissional: "Profissional (R$ 199/mês)",
      elite: "Elite (R$ 299/mês)",
    };

    const planName = planNames[shop.plan as keyof typeof planNames] || shop.plan;

    if (shop.subscription_status === 'trial' && shop.trial_ends_at) {
      const daysRemaining = Math.ceil(
        (new Date(shop.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      message = `🔔 *Lembrete InfoBarber*\n\n` +
        `Olá ${shop.profiles.full_name}!\n\n` +
        `Seu período de teste do plano *${planName}* expira em *${daysRemaining} dia(s)*.\n\n` +
        `Para continuar aproveitando todos os recursos, efetue o pagamento da sua assinatura.\n\n` +
        `Qualquer dúvida, estamos à disposição!`;
    } else if (shop.subscription_status === 'past_due') {
      message = `⚠️ *Atenção - Pagamento Pendente*\n\n` +
        `Olá ${shop.profiles.full_name}!\n\n` +
        `Identificamos que há um pagamento pendente da sua assinatura do plano *${planName}*.\n\n` +
        `Para evitar a interrupção dos serviços, por favor, regularize sua situação o quanto antes.\n\n` +
        `Estamos à disposição para ajudar!`;
    } else {
      message = `🔔 *Lembrete InfoBarber*\n\n` +
        `Olá ${shop.profiles.full_name}!\n\n` +
        `Este é um lembrete sobre sua assinatura do plano *${planName}*.\n\n` +
        `Para mais informações, entre em contato conosco.`;
    }

    // Send WhatsApp message via API
    const wapiUrl = `https://barber-bot-production.up.railway.app/v1/message/send-text?instanceId=${shop.wapi_instance_id}`;
    
    const wapiResponse = await fetch(wapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shop.wapi_token}`,
      },
      body: JSON.stringify({
        phone: ownerPhone.replace(/\D/g, ''),
        message: message,
      }),
    });

    if (!wapiResponse.ok) {
      const errorText = await wapiResponse.text();
      console.error("W-API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar mensagem via WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Billing reminder sent successfully to shop:", shop_id);

    return new Response(
      JSON.stringify({ success: true, message: "Lembrete enviado com sucesso" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in send-billing-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
