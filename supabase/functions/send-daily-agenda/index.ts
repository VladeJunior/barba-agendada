import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  client_name: string | null;
  client_phone: string | null;
  status: string;
  services: { name: string; price: number } | null;
}

interface Barber {
  id: string;
  name: string;
  phone: string | null;
  shop_id: string;
}

interface Shop {
  id: string;
  name: string;
  plan: string;
  wapi_instance_id: string | null;
  wapi_token: string | null;
}

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  wapiInstanceId: string,
  wapiToken: string
): Promise<boolean> {
  try {
    // Format phone number (add 55 if needed)
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    const response = await fetch(
      `https://barber-bot-production.up.railway.app/v1/message/send-text?instanceId=${wapiInstanceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${wapiToken}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send WhatsApp to ${phone}:`, errorText);
      return false;
    }

    console.log(`Successfully sent daily agenda to ${phone}`);
    return true;
  } catch (error) {
    console.error(`Error sending WhatsApp to ${phone}:`, error);
    return false;
  }
}

function formatAgendaMessage(
  barberName: string,
  shopName: string,
  appointments: Appointment[],
  date: Date
): string {
  const dateStr = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  let message = `📋 *Agenda do Dia*\n\n`;
  message += `Olá, ${barberName}! 👋\n\n`;
  message += `Aqui está sua agenda para *${dateStr}* na *${shopName}*:\n\n`;

  if (appointments.length === 0) {
    message += `📭 Você não tem agendamentos para hoje.\n\n`;
    message += `Aproveite para descansar ou divulgar seus serviços! 💈`;
  } else {
    message += `📌 *${appointments.length} agendamento${appointments.length > 1 ? "s" : ""}*\n\n`;

    appointments.forEach((apt, index) => {
      const startTime = new Date(apt.start_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      const endTime = new Date(apt.end_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

      message += `${index + 1}. ⏰ *${startTime} - ${endTime}*\n`;
      message += `   👤 ${apt.client_name || "Cliente não informado"}\n`;
      if (apt.services?.name) {
        message += `   ✂️ ${apt.services.name}\n`;
      }
      if (apt.client_phone) {
        message += `   📱 ${apt.client_phone}\n`;
      }
      message += `\n`;
    });

    message += `Tenha um ótimo dia de trabalho! 💈✨`;
  }

  return message;
}

// Helper: Calculate today's date boundaries in São Paulo timezone
// São Paulo is UTC-3 (no DST since 2019)
function getTodayInSaoPaulo(): { dateStr: string; startISO: string; endISO: string; displayDate: Date } {
  const SAO_PAULO_OFFSET_HOURS = -3;
  const now = new Date();
  
  // Calculate current time in São Paulo by applying offset to UTC
  const utcMs = now.getTime();
  const saoPauloMs = utcMs + (SAO_PAULO_OFFSET_HOURS * 60 * 60 * 1000);
  const saoPauloDate = new Date(saoPauloMs);
  
  // Extract year, month, day from the São Paulo "view" of time
  const year = saoPauloDate.getUTCFullYear();
  const month = saoPauloDate.getUTCMonth();
  const day = saoPauloDate.getUTCDate();
  
  // Format as YYYY-MM-DD for logging
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // Calculate UTC boundaries for this São Paulo day
  // 00:00 São Paulo = 03:00 UTC same day
  // 23:59:59 São Paulo = 02:59:59 UTC next day
  const startUTC = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
  const endUTC = new Date(Date.UTC(year, month, day + 1, 2, 59, 59, 999));
  
  // Create a display date that represents the São Paulo day for formatting
  const displayDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  
  return {
    dateStr,
    startISO: startUTC.toISOString(),
    endISO: endUTC.toISOString(),
    displayDate
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const { dateStr, startISO, endISO, displayDate } = getTodayInSaoPaulo();
    
    console.log(`Starting daily agenda send:`);
    console.log(`  UTC now: ${now.toISOString()}`);
    console.log(`  São Paulo date: ${dateStr}`);
    console.log(`  Query range: ${startISO} to ${endISO}`);

    // Fetch shops with Profissional or Elite plans that have W-API configured
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id, name, plan, wapi_instance_id, wapi_token")
      .in("plan", ["profissional", "elite"])
      .eq("is_active", true)
      .not("wapi_instance_id", "is", null)
      .not("wapi_token", "is", null);

    if (shopsError) {
      console.error("Error fetching shops:", shopsError);
      throw shopsError;
    }

    console.log(`Found ${shops?.length || 0} shops with Profissional/Elite plans and W-API configured`);

    const results = {
      shopsProcessed: 0,
      barbersSent: 0,
      barbersSkipped: 0,
      errors: 0,
    };

    for (const shop of shops || []) {
      results.shopsProcessed++;
      console.log(`Processing shop: ${shop.name} (${shop.id})`);

      // Fetch barbers with phone numbers for this shop
      const { data: barbers, error: barbersError } = await supabase
        .from("barbers")
        .select("id, name, phone, shop_id")
        .eq("shop_id", shop.id)
        .eq("is_active", true)
        .not("phone", "is", null);

      if (barbersError) {
        console.error(`Error fetching barbers for shop ${shop.id}:`, barbersError);
        results.errors++;
        continue;
      }

      console.log(`Found ${barbers?.length || 0} barbers with phone numbers for shop ${shop.name}`);

      for (const barber of barbers || []) {
        if (!barber.phone) {
          results.barbersSkipped++;
          continue;
        }

        // Fetch today's appointments for this barber
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            id,
            start_time,
            end_time,
            client_name,
            client_phone,
            status,
            services:service_id (name, price)
          `)
          .eq("barber_id", barber.id)
          .eq("shop_id", shop.id)
          .gte("start_time", startISO)
          .lte("start_time", endISO)
          .in("status", ["scheduled", "confirmed"])
          .order("start_time", { ascending: true });

        if (appointmentsError) {
          console.error(`Error fetching appointments for barber ${barber.id}:`, appointmentsError);
          results.errors++;
          continue;
        }

        // Format appointments with proper typing
        const formattedAppointments: Appointment[] = (appointments || []).map((apt: any) => ({
          id: apt.id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          client_name: apt.client_name,
          client_phone: apt.client_phone,
          status: apt.status,
          services: apt.services ? { name: apt.services.name, price: apt.services.price } : null,
        }));

        // Format and send the agenda message
        const message = formatAgendaMessage(
          barber.name,
          shop.name,
          formattedAppointments,
          displayDate
        );

        const sent = await sendWhatsAppMessage(
          barber.phone,
          message,
          shop.wapi_instance_id!,
          shop.wapi_token!
        );

        if (sent) {
          results.barbersSent++;
        } else {
          results.errors++;
        }
      }
    }

    console.log("Daily agenda job completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Daily agenda sent",
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-daily-agenda function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
