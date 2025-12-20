import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_API_URL = "https://barber-bot-production.up.railway.app";

// Timezone de São Paulo (UTC-3)
const SAO_PAULO_OFFSET_HOURS = -3;

// Obter data/hora atual em São Paulo
function getNowInSaoPaulo(): Date {
  const now = new Date();
  // Converter UTC para São Paulo (subtrair 3 horas do UTC = adicionar ao timestamp)
  return new Date(now.getTime() + SAO_PAULO_OFFSET_HOURS * 60 * 60 * 1000);
}

// Converter horário de São Paulo para UTC (para salvar no banco)
function saoPauloToUTC(date: Date): Date {
  // São Paulo é UTC-3, então para converter para UTC adicionamos 3 horas
  return new Date(date.getTime() - SAO_PAULO_OFFSET_HOURS * 60 * 60 * 1000);
}

// Criar data em São Paulo a partir de ano/mês/dia
function createDateInSaoPaulo(year: number, month: number, day: number, hours = 0, mins = 0): Date {
  // Criar data como se fosse em São Paulo
  const date = new Date(Date.UTC(year, month, day, hours - SAO_PAULO_OFFSET_HOURS, mins, 0, 0));
  return date;
}

interface WebhookPayload {
  instanceId: string;
  msgContent: string;
  sender: string;
  senderName?: string;
}

// Timeout de inatividade (30 minutos)
const SESSION_TIMEOUT_MINUTES = 30;

interface Session {
  id: string;
  shop_id: string;
  phone: string;
  step: string;
  temp_data: Record<string, any>;
  updated_at?: string;
}

// Verificar se a sessão expirou por inatividade
function isSessionTimedOut(session: Session): boolean {
  if (!session.updated_at) return false;
  
  const lastUpdate = new Date(session.updated_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  
  return diffMinutes > SESSION_TIMEOUT_MINUTES;
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

// Parse de data (hoje, amanhã, DD/MM) - retorna data em São Paulo
function parseDate(input: string): { year: number; month: number; day: number } | null {
  const lower = input.toLowerCase().trim();
  const nowSP = getNowInSaoPaulo();
  const todayYear = nowSP.getUTCFullYear();
  const todayMonth = nowSP.getUTCMonth();
  const todayDay = nowSP.getUTCDate();

  if (lower === "hoje") {
    return { year: todayYear, month: todayMonth, day: todayDay };
  }

  if (lower === "amanhã" || lower === "amanha") {
    const tomorrow = new Date(Date.UTC(todayYear, todayMonth, todayDay + 1));
    return { 
      year: tomorrow.getUTCFullYear(), 
      month: tomorrow.getUTCMonth(), 
      day: tomorrow.getUTCDate() 
    };
  }

  // Tentar parse DD/MM ou DD/MM/YYYY
  const match = input.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    let year = match[3] ? parseInt(match[3]) : todayYear;
    if (year < 100) year += 2000;

    // Verificar se a data é válida
    const testDate = new Date(Date.UTC(year, month, day));
    const isValidDate = testDate.getUTCDate() === day && testDate.getUTCMonth() === month;
    
    // Verificar se não é passada
    const inputDate = new Date(Date.UTC(year, month, day));
    const todayDate = new Date(Date.UTC(todayYear, todayMonth, todayDay));
    
    if (isValidDate && inputDate >= todayDate) {
      return { year, month, day };
    }
  }

  return null;
}

// Interface para data parseada
interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

// Calcular horários disponíveis (recebe data em São Paulo)
async function getAvailableSlots(
  supabase: any,
  barberId: string,
  parsedDate: ParsedDate,
  serviceDuration: number,
  shopId: string
): Promise<string[]> {
  const { year, month, day } = parsedDate;
  
  // Calcular dia da semana baseado na data
  const dateForDayOfWeek = new Date(Date.UTC(year, month, day));
  const dayOfWeek = dateForDayOfWeek.getUTCDay();

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

  // 2. Buscar blocked_times para esta data (converter para UTC para query)
  const startOfDayUTC = createDateInSaoPaulo(year, month, day, 0, 0);
  const endOfDayUTC = createDateInSaoPaulo(year, month, day, 23, 59);

  const { data: blockedTimes } = await supabase
    .from("blocked_times")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("shop_id", shopId)
    .gte("start_time", startOfDayUTC.toISOString())
    .lte("end_time", endOfDayUTC.toISOString());

  // 3. Buscar agendamentos existentes
  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("shop_id", shopId)
    .not("status", "in", '("cancelled","no_show")')
    .gte("start_time", startOfDayUTC.toISOString())
    .lte("start_time", endOfDayUTC.toISOString());

  // 4. Gerar slots de 30 minutos
  const slots: string[] = [];
  const [startHour, startMin] = workingHours.start_time.split(":").map(Number);
  const [endHour, endMin] = workingHours.end_time.split(":").map(Number);

  // Horário atual em São Paulo
  const nowSP = getNowInSaoPaulo();
  const nowHour = nowSP.getUTCHours();
  const nowMin = nowSP.getUTCMinutes();
  const todaySP = {
    year: nowSP.getUTCFullYear(),
    month: nowSP.getUTCMonth(),
    day: nowSP.getUTCDate()
  };
  
  const isToday = year === todaySP.year && month === todaySP.month && day === todaySP.day;

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const slotEndMin = currentMin + serviceDuration;
    let slotEndHour = currentHour + Math.floor(slotEndMin / 60);
    let slotEndMinNormalized = slotEndMin % 60;

    // Verificar se o slot cabe antes do fim do expediente
    if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMinNormalized > endMin)) {
      break;
    }

    // Verificar se é horário passado (só para hoje)
    if (isToday && (currentHour < nowHour || (currentHour === nowHour && currentMin <= nowMin))) {
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour++;
        currentMin -= 60;
      }
      continue;
    }

    // Criar timestamps UTC para comparação
    const slotStartUTC = createDateInSaoPaulo(year, month, day, currentHour, currentMin);
    const slotEndUTC = createDateInSaoPaulo(year, month, day, slotEndHour, slotEndMinNormalized);

    // Verificar conflito com blocked_times
    const blockedConflict = blockedTimes?.some((bt: any) => {
      const btStart = new Date(bt.start_time);
      const btEnd = new Date(bt.end_time);
      return slotStartUTC < btEnd && slotEndUTC > btStart;
    });

    // Verificar conflito com appointments
    const appointmentConflict = appointments?.some((apt: any) => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      return slotStartUTC < aptEnd && slotEndUTC > aptStart;
    });

    if (!blockedConflict && !appointmentConflict) {
      const hoursStr = currentHour.toString().padStart(2, "0");
      const minsStr = currentMin.toString().padStart(2, "0");
      slots.push(`${hoursStr}:${minsStr}`);
    }

    // Próximo slot (30 min)
    currentMin += 30;
    if (currentMin >= 60) {
      currentHour++;
      currentMin -= 60;
    }
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

// Formatar data para exibição (aceita ParsedDate)
function formatDateDisplay(parsedDate: ParsedDate): string {
  const { year, month, day } = parsedDate;
  const date = new Date(Date.UTC(year, month, day, 12, 0, 0)); // Usar meio-dia para evitar problemas de timezone
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
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

// Buscar agendamentos futuros do cliente
async function getClientAppointments(
  supabase: any,
  shopId: string,
  phone: string
): Promise<any[]> {
  const cleanPhone = phone.replace(/\D/g, "");
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      start_time,
      status,
      service:services!inner(name),
      barber:barbers!inner(name)
    `)
    .eq("shop_id", shopId)
    .eq("client_phone", cleanPhone)
    .gte("start_time", now)
    .not("status", "in", '("cancelled","no_show")')
    .order("start_time");

  if (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return [];
  }
  return data || [];
}

// Contar agendamentos ativos do cliente (anti-spam)
async function countActiveAppointments(
  supabase: any,
  shopId: string,
  phone: string
): Promise<number> {
  const cleanPhone = phone.replace(/\D/g, "");
  const now = new Date().toISOString();

  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("client_phone", cleanPhone)
    .gte("start_time", now)
    .in("status", ["scheduled", "confirmed"]);

  if (error) {
    console.error("Erro ao contar agendamentos ativos:", error);
    return 0;
  }
  return count || 0;
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
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente

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
    // Verificação anti-spam: máximo 2 agendamentos ativos
    const activeCount = await countActiveAppointments(supabase, shop.id, session.phone);
    
    if (activeCount >= 2) {
      return {
        nextStep: "menu",
        tempData: {},
        response: `🚫 Você já possui ${activeCount} agendamentos ativos.

Para marcar um novo horário, por favor aguarde o seu atendimento ou cancele um agendamento anterior no menu *"Meus Agendamentos"*.

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente`,
      };
    }

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
    // Meus agendamentos
    const appointments = await getClientAppointments(supabase, shop.id, session.phone);

    if (appointments.length === 0) {
      return {
        nextStep: "menu",
        tempData: {},
        response: `📅 Você não tem agendamentos futuros.

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente`,
      };
    }

    // Criar mapeamento ID temporário → ID real
    const appointmentMap: Record<number, string> = {};
    const listItems = appointments.map((apt: any, index: number) => {
      appointmentMap[index + 1] = apt.id;
      const date = new Date(apt.start_time);
      const dateStr = date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      const timeStr = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      return `${index + 1}️⃣ ${dateStr} às ${timeStr} - ${apt.service.name}`;
    });

    return {
      nextStep: "manage_appointment",
      tempData: {
        appointment_map: appointmentMap,
        appointments: appointments,
      },
      response: `📅 *Seus Agendamentos*

${listItems.join("\n")}

_Digite o número do agendamento para gerenciar_
_ou 0 para voltar_`,
    };
  }

  if (choice === "3") {
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
    response: `Desculpe, não entendi. Por favor, digite *1*, *2* ou *3*.

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente`,
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
      selected_date: date, // Salvar o objeto ParsedDate
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

  // Recuperar data selecionada (ParsedDate)
  const selectedDate: ParsedDate = session.temp_data.selected_date;
  
  // Criar agendamento com horário correto de São Paulo convertido para UTC
  const startTimeUTC = createDateInSaoPaulo(
    selectedDate.year, 
    selectedDate.month, 
    selectedDate.day, 
    hours, 
    minutes
  );

  const endTimeUTC = new Date(
    startTimeUTC.getTime() + session.temp_data.service_duration * 60000
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
      start_time: startTimeUTC.toISOString(),
      end_time: endTimeUTC.toISOString(),
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

  const dateDisplay = formatDateDisplay(selectedDate);

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

async function handleManageAppointment(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const choice = parseInt(message.trim());
  const appointmentMap = session.temp_data.appointment_map || {};
  const appointments = session.temp_data.appointments || [];

  // Validar escolha
  if (isNaN(choice) || !appointmentMap[choice]) {
    return {
      nextStep: "manage_appointment",
      tempData: session.temp_data,
      response: `Opção inválida. Digite um número da lista.

_ou 0 para voltar_`,
    };
  }

  // Encontrar o agendamento selecionado
  const selectedApt = appointments.find(
    (apt: any) => apt.id === appointmentMap[choice]
  );

  const date = new Date(selectedApt.start_time);
  const dateStr = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return {
    nextStep: "appointment_action",
    tempData: {
      ...session.temp_data,
      selected_appointment_id: appointmentMap[choice],
      selected_appointment: selectedApt,
    },
    response: `📋 *Agendamento Selecionado*

📅 ${dateStr}
🕐 ${timeStr}
💈 ${selectedApt.service.name}
👤 ${selectedApt.barber.name}

O que deseja fazer?

1️⃣ Cancelar agendamento
2️⃣ Reagendar
3️⃣ Voltar

_Digite o número da opção_`,
  };
}

async function handleAppointmentAction(
  supabase: any,
  session: Session,
  message: string,
  shop: Shop
): Promise<{ nextStep: string; tempData: Record<string, any>; response: string }> {
  const choice = message.trim();
  const appointmentId = session.temp_data.selected_appointment_id;

  // CANCELAR
  if (choice === "1") {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) {
      console.error("Erro ao cancelar:", error);
      return {
        nextStep: "menu",
        tempData: {},
        response: `❌ Erro ao cancelar. Tente novamente.

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente`,
      };
    }

    return {
      nextStep: "menu",
      tempData: {},
      response: `✅ Agendamento cancelado com sucesso!

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente`,
    };
  }

  // REAGENDAR
  if (choice === "2") {
    // Cancelar agendamento atual
    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    // Buscar serviços para iniciar novo agendamento
    const services = await getServices(supabase, shop.id);
    const serviceList = services
      .map(
        (s: any, i: number) =>
          `${i + 1}️⃣ ${s.name} - ${formatPrice(s.price)} (${s.duration_minutes} min)`
      )
      .join("\n");

    return {
      nextStep: "select_service",
      tempData: { services },
      response: `🔄 Agendamento anterior cancelado. Vamos reagendar!

💈 *Nossos Serviços*

${serviceList}

_Digite o número do serviço_
_ou 0 para cancelar_`,
    };
  }

  // VOLTAR
  if (choice === "3") {
    return {
      nextStep: "menu",
      tempData: {},
      response: `Como posso te ajudar?

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente`,
    };
  }

  return {
    nextStep: "appointment_action",
    tempData: session.temp_data,
    response: `Opção inválida. Digite *1*, *2* ou *3*.

1️⃣ Cancelar agendamento
2️⃣ Reagendar
3️⃣ Voltar`,
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
  manage_appointment: handleManageAppointment,
  appointment_action: handleAppointmentAction,
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
    let session = await getOrCreateSession(supabase, shop.id, sender);

    // Verificar timeout de inatividade (30 minutos)
    if (isSessionTimedOut(session) && session.step !== "welcome") {
      console.log(`Sessão expirada por inatividade. Última interação: ${session.updated_at}, Step anterior: ${session.step}`);
      
      // Resetar sessão
      await resetSession(supabase, session.id);
      
      // Enviar mensagem personalizada de retorno
      await sendWhatsAppMessage(
        instanceId,
        shop.wapi_token || "",
        sender,
        `👋 Olá! Parece que faz um tempinho que você não interage conosco.

Vamos recomeçar? Estou aqui para ajudar! 😊

Bem-vindo(a) à *${shop.name}*! Como posso ajudar?

1️⃣ Agendar um horário
2️⃣ Meus agendamentos
3️⃣ Falar com um atendente

_Digite o número da opção desejada._`
      );

      // Atualizar sessão para menu
      await updateSession(supabase, session.id, "menu", {});

      return new Response(
        JSON.stringify({ success: true, action: "session_timeout_reset" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
