import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_API_URL = "https://barber-bot-production.up.railway.app";

interface WebhookPayload {
  instanceId: string;
  msgContent: string;
  sender: string;
  senderName?: string;
}

interface Session {
  id: string;
  shop_id: string;
  phone: string;
  step: string;
  temp_data: Record<string, any>;
}

interface Shop {
  id: string;
  name: string;
  wapi_instance_id: string;
  wapi_token: string;
}

// Enviar mensagem via API Railway
async function sendWhatsAppMessage(
  instanceId: string,
  token: string,
  phone: string,
  message: string
): Promise<boolean> {
  try {
    // Use phone number exactly as received (already contains country code)
    console.log(`Enviando mensagem para ${phone}:`, message.substring(0, 50) + "...");
    
    const wapiUrl = `${WHATSAPP_API_URL}/v1/message/send-text?instanceId=${instanceId}`;
    
    const response = await fetch(wapiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone: phone,
        message,
      }),
    });

    const result = await response.json();
    console.log("Resposta do WhatsApp API:", result);
    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return false;
  }
}

// Buscar shop pelo instanceId
async function getShopByInstanceId(
  supabase: any,
  instanceId: string
): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, wapi_instance_id, wapi_token")
    .eq("wapi_instance_id", instanceId)
    .single();

  if (error) {
    console.error("Erro ao buscar shop:", error);
    return null;
  }
  return data;
}

// Buscar ou criar sessão
async function getOrCreateSession(
  supabase: any,
  shopId: string,
  phone: string
): Promise<Session> {
  // Tentar buscar sessão existente
  const { data: existing } = await supabase
    .from("bot_sessions")
    .select("*")
    .eq("shop_id", shopId)
    .eq("phone", phone)
    .single();

  if (existing && new Date(existing.expires_at) > new Date()) {
    return existing;
  }

  // Criar nova sessão ou atualizar expirada
  const { data: session, error } = await supabase
    .from("bot_sessions")
    .upsert(
      {
        shop_id: shopId,
        phone,
        step: "welcome",
        temp_data: {},
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "shop_id,phone" }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar sessão:", error);
    throw error;
  }
  return session;
}

// Atualizar sessão
async function updateSession(
  supabase: any,
  sessionId: string,
  step: string,
  tempData: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from("bot_sessions")
    .update({
      step,
      temp_data: tempData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    console.error("Erro ao atualizar sessão:", error);
  }
}

// Resetar sessão
async function resetSession(supabase: any, sessionId: string): Promise<void> {
  await updateSession(supabase, sessionId, "welcome", {});
}

// Buscar serviços ativos da loja
async function getServices(supabase: any, shopId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar serviços:", error);
    return [];
  }
  return data || [];
}

// Buscar barbeiros ativos da loja
async function getBarbers(supabase: any, shopId: string) {
  const { data, error } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar barbeiros:", error);
    return [];
  }
  return data || [];
}

// Parse de data (hoje, amanhã, DD/MM)
function parseDate(input: string): Date | null {
  const lower = input.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lower === "hoje") {
    return today;
  }

  if (lower === "amanhã" || lower === "amanha") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Tentar parse DD/MM ou DD/MM/YYYY
  const match = input.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    let year = match[3] ? parseInt(match[3]) : today.getFullYear();
    if (year < 100) year += 2000;

    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    // Verificar se a data é válida e não é passada
    if (date >= today && date.getDate() === day && date.getMonth() === month) {
      return date;
    }
  }

  return null;
}

// Calcular horários disponíveis
async function getAvailableSlots(
  supabase: any,
  barberId: string,
  date: Date,
  serviceDuration: number,
  shopId: string
): Promise<string[]> {
  const dayOfWeek = date.getDay();

  // 1. Buscar horário de trabalho do barbeiro
  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("shop_id", shopId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .single();

  if (!workingHours) {
    console.log("Barbeiro não trabalha neste dia");
    return [];
  }

  // 2. Buscar blocked_times para esta data
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: blockedTimes } = await supabase
    .from("blocked_times")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("shop_id", shopId)
    .gte("start_time", startOfDay.toISOString())
    .lte("end_time", endOfDay.toISOString());

  // 3. Buscar agendamentos existentes
  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("shop_id", shopId)
    .not("status", "in", '("cancelled","no_show")')
    .gte("start_time", startOfDay.toISOString())
    .lte("start_time", endOfDay.toISOString());

  // 4. Gerar slots de 30 minutos
  const slots: string[] = [];
  const [startHour, startMin] = workingHours.start_time.split(":").map(Number);
  const [endHour, endMin] = workingHours.end_time.split(":").map(Number);

  const current = new Date(date);
  current.setHours(startHour, startMin, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMin, 0, 0);

  const now = new Date();

  while (current < end) {
    const slotEnd = new Date(current.getTime() + serviceDuration * 60000);

    // Verificar se o slot cabe antes do fim do expediente
    if (slotEnd > end) break;

    // Verificar se é horário passado
    if (current <= now) {
      current.setMinutes(current.getMinutes() + 30);
      continue;
    }

    // Verificar conflito com blocked_times
    const blockedConflict = blockedTimes?.some((bt: any) => {
      const btStart = new Date(bt.start_time);
      const btEnd = new Date(bt.end_time);
      return current < btEnd && slotEnd > btStart;
    });

    // Verificar conflito com appointments
    const appointmentConflict = appointments?.some((apt: any) => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      return current < aptEnd && slotEnd > aptStart;
    });

    if (!blockedConflict && !appointmentConflict) {
      const hours = current.getHours().toString().padStart(2, "0");
      const mins = current.getMinutes().toString().padStart(2, "0");
      slots.push(`${hours}:${mins}`);
    }

    // Próximo slot (30 min)
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}

// Formatar preço em BRL
function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

// Formatar data para exibição
function formatDateDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return date.toLocaleDateString("pt-BR", options);
}

// Atualizar ou criar nome do cliente na tabela loyalty_points
async function updateClientName(
  supabase: any,
  shopId: string,
  phone: string,
  senderName: string | undefined
): Promise<void> {
  if (!senderName || senderName.trim() === "") return;

  const cleanPhone = phone.replace(/\D/g, "");
  const name = senderName.trim();

  try {
    // Buscar cliente existente na loyalty_points
    const { data: existing } = await supabase
      .from("loyalty_points")
      .select("id, client_name")
      .eq("shop_id", shopId)
      .eq("client_phone", cleanPhone)
      .maybeSingle();

    if (existing) {
      // Se nome está vazio ou é genérico, atualiza
      const currentName = existing.client_name || "";
      const isGeneric =
        currentName === "" ||
        currentName.toLowerCase() === "cliente" ||
        currentName.toLowerCase() === "null";

      if (isGeneric) {
        await supabase
          .from("loyalty_points")
          .update({ client_name: name })
          .eq("id", existing.id);
        console.log(`Nome do cliente atualizado: ${cleanPhone} -> ${name}`);
      }
    } else {
      // Criar registro de fidelidade com o nome
      await supabase.from("loyalty_points").insert({
        shop_id: shopId,
        client_phone: cleanPhone,
        client_name: name,
        total_points: 0,
        lifetime_points: 0,
      });
      console.log(`Novo cliente criado: ${cleanPhone} -> ${name}`);
    }
  } catch (error) {
    console.error("Erro ao atualizar nome do cliente:", error);
  }
}

// Handlers para cada step

async function handleWelcome(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  return {
    nextStep: "menu",
    tempData: {},
    response: `Olá! 👋 Bem-vindo à *${shop.name}*!

Como posso te ajudar?

1️⃣ Agendar um horário
2️⃣ Falar com um atendente

_Digite o número da opção desejada_`,
  };
}

async function handleMenu(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const choice = message.trim();

  if (choice === "1") {
    const services = await getServices(supabase, shop.id);

    if (services.length === 0) {
      return {
        nextStep: "menu",
        tempData: {},
        response: `Desculpe, não há serviços disponíveis no momento.

1️⃣ Tentar novamente
2️⃣ Falar com um atendente`,
      };
    }

    const serviceList = services
      .map(
        (s: any, i: number) =>
          `${i + 1}️⃣ ${s.name} - ${formatPrice(s.price)} (${s.duration_minutes} min)`
      )
      .join("\n");

    return {
      nextStep: "select_service",
      tempData: { services },
      response: `💈 *Nossos Serviços*

${serviceList}

_Digite o número do serviço_
_ou 0 para cancelar_`,
    };
  }

  if (choice === "2") {
    return {
      nextStep: "human_support",
      tempData: {},
      response: `Aguarde, um atendente vai te responder em breve! 🙋‍♂️

_Digite 0 para voltar ao menu_`,
    };
  }

  return {
    nextStep: "menu",
    tempData: {},
    response: `Desculpe, não entendi. Por favor, digite *1* ou *2*.

1️⃣ Agendar um horário
2️⃣ Falar com um atendente`,
  };
}

async function handleSelectService(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const choice = parseInt(message.trim());
  const services = session.temp_data.services || [];

  if (isNaN(choice) || choice < 1 || choice > services.length) {
    return {
      nextStep: "select_service",
      tempData: session.temp_data,
      response: `Opção inválida. Por favor, digite um número de *1* a *${services.length}*.

_ou 0 para cancelar_`,
    };
  }

  const selectedService = services[choice - 1];
  const barbers = await getBarbers(supabase, shop.id);

  if (barbers.length === 0) {
    return {
      nextStep: "menu",
      tempData: {},
      response: `Desculpe, não há profissionais disponíveis no momento.

1️⃣ Tentar novamente
2️⃣ Falar com um atendente`,
    };
  }

  const barberList = barbers
    .map((b: any, i: number) => `${i + 1}️⃣ ${b.name}`)
    .join("\n");

  return {
    nextStep: "select_barber",
    tempData: {
      service_id: selectedService.id,
      service_name: selectedService.name,
      service_price: selectedService.price,
      service_duration: selectedService.duration_minutes,
      barbers,
    },
    response: `Você escolheu: *${selectedService.name}* 💈

👤 *Nossos Profissionais*

${barberList}

_Digite o número do profissional_
_ou 0 para cancelar_`,
  };
}

async function handleSelectBarber(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const choice = parseInt(message.trim());
  const barbers = session.temp_data.barbers || [];

  if (isNaN(choice) || choice < 1 || choice > barbers.length) {
    return {
      nextStep: "select_barber",
      tempData: session.temp_data,
      response: `Opção inválida. Por favor, digite um número de *1* a *${barbers.length}*.

_ou 0 para cancelar_`,
    };
  }

  const selectedBarber = barbers[choice - 1];

  return {
    nextStep: "select_date",
    tempData: {
      ...session.temp_data,
      barber_id: selectedBarber.id,
      barber_name: selectedBarber.name,
    },
    response: `Você escolheu: *${selectedBarber.name}* 👤

📅 *Qual dia você prefere?*

Exemplos:
• Digite *hoje* para hoje
• Digite *amanhã* para amanhã
• Digite *25/12* para uma data específica

_ou 0 para cancelar_`,
  };
}

async function handleSelectDate(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const date = parseDate(message);

  if (!date) {
    return {
      nextStep: "select_date",
      tempData: session.temp_data,
      response: `Data inválida. Use o formato *DD/MM* ou digite *hoje* ou *amanhã*.

_ou 0 para cancelar_`,
    };
  }

  const slots = await getAvailableSlots(
    supabase,
    session.temp_data.barber_id,
    date,
    session.temp_data.service_duration,
    shop.id
  );

  if (slots.length === 0) {
    return {
      nextStep: "select_date",
      tempData: session.temp_data,
      response: `Infelizmente não há horários disponíveis para *${formatDateDisplay(date)}* com *${session.temp_data.barber_name}*.

Por favor, escolha outra data ou digite *0* para cancelar.`,
    };
  }

  const slotList = slots
    .map((s: string, i: number) => `${i + 1}️⃣ ${s}`)
    .join("\n");

  return {
    nextStep: "select_time",
    tempData: {
      ...session.temp_data,
      selected_date: date.toISOString().split("T")[0],
      available_slots: slots,
    },
    response: `🕐 *Horários disponíveis para ${formatDateDisplay(date)} com ${session.temp_data.barber_name}*

${slotList}

_Digite o número do horário_
_ou 0 para cancelar_`,
  };
}

async function handleSelectTime(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const choice = parseInt(message.trim());
  const slots = session.temp_data.available_slots || [];

  if (isNaN(choice) || choice < 1 || choice > slots.length) {
    return {
      nextStep: "select_time",
      tempData: session.temp_data,
      response: `Opção inválida. Por favor, digite um número de *1* a *${slots.length}*.

_ou 0 para cancelar_`,
    };
  }

  const selectedTime = slots[choice - 1];
  const [hours, minutes] = selectedTime.split(":").map(Number);

  // Criar agendamento
  const startTime = new Date(session.temp_data.selected_date);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(
    startTime.getTime() + session.temp_data.service_duration * 60000
  );

  // Formatar telefone para salvar
  const clientPhone = session.phone.replace(/\D/g, "");

  // Buscar nome do cliente no loyalty_points
  const { data: clientData } = await supabase
    .from("loyalty_points")
    .select("client_name")
    .eq("shop_id", shop.id)
    .eq("client_phone", clientPhone)
    .maybeSingle();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      shop_id: shop.id,
      barber_id: session.temp_data.barber_id,
      service_id: session.temp_data.service_id,
      client_phone: clientPhone,
      client_name: clientData?.client_name || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      original_price: session.temp_data.service_price,
      final_price: session.temp_data.service_price,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar agendamento:", error);
    return {
      nextStep: "menu",
      tempData: {},
      response: `Desculpe, ocorreu um erro ao criar seu agendamento. Por favor, tente novamente.

1️⃣ Tentar novamente
2️⃣ Falar com um atendente`,
    };
  }

  const dateDisplay = formatDateDisplay(startTime);

  return {
    nextStep: "confirmed",
    tempData: {},
    response: `✅ *Agendamento Confirmado!*

📅 *Data:* ${dateDisplay}
🕐 *Horário:* ${selectedTime}
💈 *Serviço:* ${session.temp_data.service_name}
👤 *Profissional:* ${session.temp_data.barber_name}
💰 *Valor:* ${formatPrice(session.temp_data.service_price)}

Até lá! 💈

_Digite qualquer coisa para fazer novo agendamento_`,
  };
}

async function handleConfirmed(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  return handleWelcome(supabase, session, message, shop);
}

async function handleHumanSupport(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  // Apenas retorna mensagem de espera, não processa
  // Um atendente humano pode assumir a conversa
  return {
    nextStep: "human_support",
    tempData: {},
    response: `Sua mensagem foi registrada. Um atendente vai te responder em breve! 🙋‍♂️

_Digite 0 para voltar ao menu_`,
  };
}

// Handler principal
const stepHandlers: Record<
  string,
  (
    supabase: any,
    session: Session,
    message: string,
    shop: Shop
  ) => Promise<{ nextStep: string; tempData: Record<string, any>; response: string }>
> = {
  welcome: handleWelcome,
  menu: handleMenu,
  select_service: handleSelectService,
  select_barber: handleSelectBarber,
  select_date: handleSelectDate,
  select_time: handleSelectTime,
  confirmed: handleConfirmed,
  human_support: handleHumanSupport,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { instanceId, msgContent, sender, senderName } = payload;

    console.log("Webhook recebido:", { instanceId, msgContent, sender, senderName });

    if (!instanceId || !msgContent || !sender) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: instanceId, msgContent, sender" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializar Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar shop pelo instanceId
    const shop = await getShopByInstanceId(supabase, instanceId);

    if (!shop) {
      console.error("Shop não encontrado para instanceId:", instanceId);
      return new Response(
        JSON.stringify({ error: "Shop não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar ou criar sessão
    const session = await getOrCreateSession(supabase, shop.id, sender);

    // Atualizar nome do cliente se disponível
    await updateClientName(supabase, shop.id, sender, senderName);

    // Verificar comando de cancelamento
    const lowerMsg = msgContent.toLowerCase().trim();
    if (lowerMsg === "cancelar" || lowerMsg === "0") {
      await resetSession(supabase, session.id);
      
      await sendWhatsAppMessage(
        instanceId,
        shop.wapi_token || "",
        sender,
        `❌ Operação cancelada.

Digite qualquer coisa para recomeçar.`
      );

      return new Response(
        JSON.stringify({ success: true, action: "cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Executar handler do step atual
    const handler = stepHandlers[session.step] || stepHandlers.welcome;
    const result = await handler(supabase, session, msgContent, shop);

    // Atualizar sessão
    await updateSession(supabase, session.id, result.nextStep, result.tempData);

    // Enviar resposta via WhatsApp
    await sendWhatsAppMessage(
      instanceId,
      shop.wapi_token || "",
      sender,
      result.response
    );

    return new Response(
      JSON.stringify({
        success: true,
        step: result.nextStep,
        message: "Mensagem processada",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Erro no webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
