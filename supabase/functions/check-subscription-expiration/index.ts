import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 3;

// Message templates for WhatsApp notifications
const getMessageTemplate = (type: string, shopName: string, daysRemaining: number, planName: string, price: number) => {
  const appUrl = Deno.env.get("APP_URL") || "https://comb-plan.lovable.app";
  const paymentUrl = `${appUrl}/dashboard/plans`;

  const messages: Record<string, string> = {
    before_5_days: `🔔 *Lembrete InfoBarber*\n\nOlá! Sua assinatura do plano *${planName}* da barbearia *${shopName}* vence em *5 dias*.\n\n💰 Valor: R$ ${price},00/mês\n\nRenove agora para não perder acesso:\n${paymentUrl}`,
    
    before_2_days: `⚠️ *Atenção InfoBarber*\n\nSua assinatura do plano *${planName}* da barbearia *${shopName}* vence em *2 dias*.\n\n💰 Valor: R$ ${price},00/mês\n\nEvite interrupção no serviço, renove agora:\n${paymentUrl}`,
    
    expiration_day: `🚨 *Último dia - InfoBarber*\n\nSua assinatura do plano *${planName}* da barbearia *${shopName}* *vence hoje*!\n\n💰 Valor: R$ ${price},00/mês\n\nRenove agora para manter seu acesso:\n${paymentUrl}`,
    
    grace_1_day: `⚠️ *Assinatura Vencida - InfoBarber*\n\nA assinatura da barbearia *${shopName}* venceu ontem.\n\n⏰ Você tem *2 dias* de carência para regularizar.\n\n💰 Valor: R$ ${price},00/mês\n\nPague agora e evite o bloqueio:\n${paymentUrl}`,
    
    grace_2_day: `🚨 *URGENTE - InfoBarber*\n\nSua assinatura da barbearia *${shopName}* está vencida há 2 dias.\n\n⏰ *Último dia* de carência! Amanhã seu acesso será bloqueado.\n\n💰 Valor: R$ ${price},00/mês\n\nRegularize imediatamente:\n${paymentUrl}`,
    
    grace_3_day: `🔒 *Acesso Bloqueado - InfoBarber*\n\nO período de carência expirou. O acesso da barbearia *${shopName}* foi bloqueado.\n\n✅ Para reativar, efetue o pagamento:\n${paymentUrl}\n\n💰 Valor: R$ ${price},00/mês\n\nApós o pagamento, seu acesso será restaurado automaticamente.`,
  };

  return messages[type] || "";
};

const getPlanPrice = (plan: string): number => {
  const prices: Record<string, number> = {
    essencial: 149,
    profissional: 199,
    elite: 299,
  };
  return prices[plan] || 149;
};

const getPlanDisplayName = (plan: string): string => {
  const names: Record<string, string> = {
    essencial: "Essencial",
    profissional: "Profissional",
    elite: "Elite",
  };
  return names[plan] || "Essencial";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("=== SUBSCRIPTION EXPIRATION CHECK STARTED ===");
    const now = new Date();
    console.log("Current time:", now.toISOString());

    // Fetch all active and past_due shops with their owner's phone
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select(`
        id,
        name,
        plan,
        subscription_status,
        current_period_ends_at,
        trial_ends_at,
        owner_id,
        wapi_instance_id,
        wapi_token
      `)
      .in("subscription_status", ["active", "past_due", "trial"]);

    if (shopsError) {
      console.error("Error fetching shops:", shopsError);
      throw shopsError;
    }

    console.log(`Found ${shops?.length || 0} shops to check`);

    const results = {
      checked: 0,
      reminders_sent: 0,
      status_updated: 0,
      errors: 0,
    };

    for (const shop of shops || []) {
      try {
        results.checked++;
        
        // Determine the expiration date based on status
        let expirationDate: Date | null = null;
        
        if (shop.subscription_status === "trial" && shop.trial_ends_at) {
          expirationDate = new Date(shop.trial_ends_at);
        } else if (shop.current_period_ends_at) {
          expirationDate = new Date(shop.current_period_ends_at);
        }

        if (!expirationDate) {
          console.log(`Shop ${shop.id} (${shop.name}): No expiration date, skipping`);
          continue;
        }

        // Calculate days until/since expiration
        const diffMs = expirationDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        console.log(`Shop ${shop.id} (${shop.name}): ${daysDiff} days until expiration, status: ${shop.subscription_status}`);

        // Get owner's phone number
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("user_id", shop.owner_id)
          .single();

        const ownerPhone = profile?.phone;
        const planPrice = getPlanPrice(shop.plan);
        const planName = getPlanDisplayName(shop.plan);

        // Determine what action to take based on days difference
        let reminderType: string | null = null;
        let shouldUpdateStatus = false;
        let newStatus: string | null = null;

        if (daysDiff === 5) {
          reminderType = "before_5_days";
        } else if (daysDiff === 2) {
          reminderType = "before_2_days";
        } else if (daysDiff === 1 || daysDiff === 0) {
          reminderType = "expiration_day";
        } else if (daysDiff === -1) {
          reminderType = "grace_1_day";
          if (shop.subscription_status === "active" || shop.subscription_status === "trial") {
            shouldUpdateStatus = true;
            newStatus = "past_due";
          }
        } else if (daysDiff === -2) {
          reminderType = "grace_2_day";
        } else if (daysDiff <= -GRACE_PERIOD_DAYS) {
          reminderType = "grace_3_day";
          if (shop.subscription_status === "past_due") {
            shouldUpdateStatus = true;
            newStatus = "expired";
          }
        }

        // Update subscription status if needed
        if (shouldUpdateStatus && newStatus) {
          const { error: updateError } = await supabase
            .from("shops")
            .update({ subscription_status: newStatus })
            .eq("id", shop.id);

          if (updateError) {
            console.error(`Error updating status for shop ${shop.id}:`, updateError);
            results.errors++;
          } else {
            console.log(`✅ Updated shop ${shop.id} status to ${newStatus}`);
            results.status_updated++;
          }
        }

        // Send reminder if applicable
        if (reminderType && ownerPhone && shop.wapi_instance_id && shop.wapi_token) {
          // Check if reminder was already sent for this period
          const { data: existingReminder } = await supabase
            .from("billing_reminders")
            .select("id")
            .eq("shop_id", shop.id)
            .eq("reminder_type", reminderType)
            .eq("period_ends_at", expirationDate.toISOString())
            .single();

          if (!existingReminder) {
            // Send WhatsApp message
            const message = getMessageTemplate(reminderType, shop.name, Math.abs(daysDiff), planName, planPrice);
            
            if (message) {
              try {
                const wapiResponse = await fetch(
                  `https://barber-bot-production.up.railway.app/v1/message/send-text?instanceId=${shop.wapi_instance_id}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${shop.wapi_token}`,
                    },
                    body: JSON.stringify({
                      phone: ownerPhone.replace(/\D/g, ""),
                      message: message,
                    }),
                  }
                );

                const wapiResult = await wapiResponse.json();
                console.log(`WhatsApp sent to shop ${shop.id}:`, wapiResult);

                // Record the reminder
                await supabase.from("billing_reminders").insert({
                  shop_id: shop.id,
                  reminder_type: reminderType,
                  period_ends_at: expirationDate.toISOString(),
                });

                results.reminders_sent++;
                console.log(`✅ Reminder ${reminderType} sent for shop ${shop.id}`);
              } catch (wapiError) {
                console.error(`WhatsApp error for shop ${shop.id}:`, wapiError);
                results.errors++;
              }
            }
          } else {
            console.log(`Reminder ${reminderType} already sent for shop ${shop.id}`);
          }
        } else if (reminderType && !ownerPhone) {
          console.log(`Shop ${shop.id}: No owner phone, skipping reminder`);
        } else if (reminderType && (!shop.wapi_instance_id || !shop.wapi_token)) {
          console.log(`Shop ${shop.id}: No W-API configured, skipping reminder`);
        }

      } catch (shopError) {
        console.error(`Error processing shop ${shop.id}:`, shopError);
        results.errors++;
      }
    }

    console.log("=== SUBSCRIPTION EXPIRATION CHECK COMPLETED ===");
    console.log("Results:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
