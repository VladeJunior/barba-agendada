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
      `https://api.w-api.app/v1/message/send-text?instanceId=${instanceId}`,
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

function formatReminderMessage(
  appointment: Appointment,
  reminderType: "24h" | "1h" | "last-minute"
): string {
  const date = new Date(appointment.start_time);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let timeText: string;
  let emoji: string;
  
  switch (reminderType) {
    case "24h":
      timeText = "amanhã";
      emoji = "⏰";
      break;
    case "1h":
      timeText = "em 1 hora";
      emoji = "⏰";
      break;
    case "last-minute":
      timeText = "em breve";
      emoji = "🚨";
      break;
  }

  return `${emoji} *Lembrete de Agendamento*

Olá ${appointment.client_name || "Cliente"}!

${reminderType === "last-minute" ? "Seu agendamento é " : "Passando para lembrar do seu agendamento "}${timeText}:

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
): "24h" | "1h" | "last-minute" | null {
  const hoursUntilAppointment = minutesUntilAppointment / 60;
  const hoursFromCreationToAppointment = minutesFromCreationToAppointment / 60;

  // 24h reminder: 23-25h before appointment, only if created more than 24h before
  if (hoursUntilAppointment >= 23 && hoursUntilAppointment <= 25) {
    if (hoursFromCreationToAppointment > 24) {
      return "24h";
    }
  }

  // 1h reminder: 30min-2h before appointment (expanded from 1-2h)
  // For appointments created more than 1h but less than 24h in advance
  if (minutesUntilAppointment >= 30 && minutesUntilAppointment <= 120) {
    if (hoursFromCreationToAppointment <= 24 && hoursFromCreationToAppointment > 1) {
      return "1h";
    }
  }

  // Last-minute reminder: 5-30min before appointment
  // For appointments created less than 1h in advance
  if (minutesUntilAppointment >= 5 && minutesUntilAppointment < 30) {
    if (hoursFromCreationToAppointment <= 1) {
      return "last-minute";
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
      sentLastMinute: 0,
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
      const message = formatReminderMessage(appointment, reminderType);
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
        else results.sentLastMinute++;
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
