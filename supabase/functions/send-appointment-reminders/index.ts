import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Appointment {
  id: string;
  shop_id: string;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  created_at: string;
  barber: { name: string } | null;
  service: { name: string } | null;
  shop: {
    name: string;
    wapi_instance_id: string | null;
    wapi_token: string | null;
  } | null;
}

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  instanceId: string,
  token: string
): Promise<boolean> {
  try {
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

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

    if (!response.ok) {
      console.error("W-API error:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return false;
  }
}

function formatTimeRemaining(minutesUntil: number): string {
  if (minutesUntil >= 1380) { // ~23h
    return "amanhã";
  } else if (minutesUntil >= 90) {
    const hours = Math.round(minutesUntil / 60);
    return `em aproximadamente ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (minutesUntil >= 45) {
    return "em aproximadamente 1 hora";
  } else if (minutesUntil >= 35) {
    return "em aproximadamente 40 minutos";
  } else if (minutesUntil >= 25) {
    return "em aproximadamente 30 minutos";
  } else if (minutesUntil >= 15) {
    return "em aproximadamente 20 minutos";
  } else if (minutesUntil >= 10) {
    return "em aproximadamente 15 minutos";
  } else {
    return "em breve";
  }
}

function formatReminderMessage(
  appointment: Appointment,
  reminderType: "24h" | "1h" | "30min",
  minutesUntilAppointment: number
): string {
  const date = new Date(appointment.start_time);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const timeText = formatTimeRemaining(minutesUntilAppointment);
  const emoji = reminderType === "30min" ? "🚨" : "⏰";
  const intro = reminderType === "30min" 
    ? `Seu agendamento é ${timeText}:`
    : `Passando para lembrar do seu agendamento ${timeText}:`;

  return `${emoji} *Lembrete de Agendamento*

Olá ${appointment.client_name || "Cliente"}!

${intro}

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${formattedTime}
✂️ *Serviço:* ${appointment.service?.name || "Serviço"}
💈 *Profissional:* ${appointment.barber?.name || "Profissional"}
🏪 *Local:* ${appointment.shop?.name || "Barbearia"}

Esperamos você! 😊`;
}

function determineReminderType(
  minutesUntilAppointment: number,
  minutesFromCreationToAppointment: number
): "24h" | "1h" | "30min" | null {
  const hoursFromCreationToAppointment = minutesFromCreationToAppointment / 60;

  // 24h reminder: 23h-25h before appointment (janela de 2h)
  // Only if created more than 24h before
  if (minutesUntilAppointment >= 1380 && minutesUntilAppointment <= 1500) {
    if (hoursFromCreationToAppointment > 24) {
      return "24h";
    }
  }

  // 1h reminder: 55-65min before appointment (janela de 10min)
  // For appointments created 1h-24h in advance
  if (minutesUntilAppointment >= 55 && minutesUntilAppointment <= 65) {
    if (hoursFromCreationToAppointment <= 24 && hoursFromCreationToAppointment > 1) {
      return "1h";
    }
  }

  // 30min reminder: 25-35min before appointment (janela de 10min)
  // For appointments created less than 1h in advance
  if (minutesUntilAppointment >= 25 && minutesUntilAppointment <= 35) {
    if (hoursFromCreationToAppointment <= 1) {
      return "30min";
    }
  }

  return null;
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
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log(`Checking for reminders at ${now.toISOString()}`);

    // Fetch appointments that need reminders (from 5 min to 25h ahead)
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        shop_id,
        client_name,
        client_phone,
        start_time,
        created_at,
        barber:barbers(name),
        service:services(name),
        shop:shops(name, wapi_instance_id, wapi_token)
      `)
      .in("status", ["scheduled", "confirmed"])
      .gte("start_time", now.toISOString())
      .lte("start_time", in25h.toISOString())
      .not("client_phone", "is", null);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} upcoming appointments`);

    const results = {
      processed: 0,
      sent24h: 0,
      sent1h: 0,
      sent30min: 0,
      skipped: 0,
      errors: 0,
    };

    for (const apt of appointments || []) {
      const appointment = apt as unknown as Appointment;
      results.processed++;

      // Skip if shop doesn't have WhatsApp configured
      if (!appointment.shop?.wapi_instance_id || !appointment.shop?.wapi_token) {
        console.log(`Skipping ${appointment.id}: No WhatsApp configured`);
        results.skipped++;
        continue;
      }

      if (!appointment.client_phone) {
        console.log(`Skipping ${appointment.id}: No client phone`);
        results.skipped++;
        continue;
      }

      const appointmentTime = new Date(appointment.start_time);
      const createdAt = new Date(appointment.created_at);
      const minutesUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
      const minutesFromCreationToAppointment = (appointmentTime.getTime() - createdAt.getTime()) / (1000 * 60);

      // Determine which reminder to send
      const reminderType = determineReminderType(
        minutesUntilAppointment,
        minutesFromCreationToAppointment
      );

      if (!reminderType) {
        continue;
      }

      // Check if reminder was already sent
      const { data: existingReminder } = await supabase
        .from("appointment_reminders")
        .select("id")
        .eq("appointment_id", appointment.id)
        .eq("reminder_type", reminderType)
        .single();

      if (existingReminder) {
        console.log(`Skipping ${appointment.id}: ${reminderType} reminder already sent`);
        continue;
      }

      // Send the reminder
      const message = formatReminderMessage(appointment, reminderType, minutesUntilAppointment);
      const sent = await sendWhatsAppMessage(
        appointment.client_phone,
        message,
        appointment.shop.wapi_instance_id,
        appointment.shop.wapi_token
      );

      // Record the reminder
      const { error: insertError } = await supabase
        .from("appointment_reminders")
        .insert({
          appointment_id: appointment.id,
          reminder_type: reminderType,
          status: sent ? "sent" : "failed",
        });

      if (insertError) {
        console.error(`Error recording reminder for ${appointment.id}:`, insertError);
      }

      if (sent) {
        console.log(`Sent ${reminderType} reminder for appointment ${appointment.id}`);
        if (reminderType === "24h") results.sent24h++;
        else if (reminderType === "1h") results.sent1h++;
        else results.sent30min++;
      } else {
        console.error(`Failed to send ${reminderType} reminder for ${appointment.id}`);
        results.errors++;
      }
    }

    console.log("Reminder job completed:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in reminder job:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
