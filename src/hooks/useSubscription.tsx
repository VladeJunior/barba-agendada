import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";

export type SubscriptionPlan = "essencial" | "profissional" | "elite";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

interface PlanLimits {
  maxBarbers: number;
  hasWhatsAppReminders: boolean;
  hasDailyAgendaToBarber: boolean;
  hasWhatsAppSupport: boolean;
  hasExclusiveFeatures: boolean;
  hasTrial: boolean;
  price: number;
}

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  essencial: {
    maxBarbers: 3,
    hasWhatsAppReminders: true,
    hasDailyAgendaToBarber: false,
    hasWhatsAppSupport: false,
    hasExclusiveFeatures: false,
    hasTrial: false,
    price: 149,
  },
  profissional: {
    maxBarbers: 5,
    hasWhatsAppReminders: true,
    hasDailyAgendaToBarber: true,
    hasWhatsAppSupport: false,
    hasExclusiveFeatures: false,
    hasTrial: true,
    price: 199,
  },
  elite: {
    maxBarbers: Infinity,
    hasWhatsAppReminders: true,
    hasDailyAgendaToBarber: true,
    hasWhatsAppSupport: true,
    hasExclusiveFeatures: true,
    hasTrial: true,
    price: 299,
  },
};

interface SubscriptionData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxBarbers: number;
  barbersUsed: number;
  canAddBarber: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  currentPeriodEndsAt: Date | null;
  planLimits: PlanLimits;
  isLoading: boolean;
  needsPlanSelection: boolean;
  isBlocked: boolean;
  isInGracePeriod: boolean;
  graceDaysRemaining: number | null;
  daysUntilExpiration: number | null;
}

export function useSubscription(): SubscriptionData {
  const { data: shop, isLoading: shopLoading } = useShop();

  const { data: barbersCount = 0, isLoading: barbersLoading } = useQuery({
    queryKey: ["barbers-count", shop?.id],
    queryFn: async () => {
      if (!shop?.id) return 0;
      const { count } = await supabase
        .from("barbers")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .eq("is_active", true);
      return count || 0;
    },
    enabled: !!shop?.id,
  });

  const isLoading = shopLoading || barbersLoading;

  // Type assertion since database returns string
  const plan = (shop?.plan as SubscriptionPlan) || "essencial";
  const status = (shop?.subscription_status as SubscriptionStatus) || "active";
  const hasSelectedPlan = shop?.has_selected_plan ?? true;
  const trialEndsAt = shop?.trial_ends_at ? new Date(shop.trial_ends_at) : null;
  const currentPeriodEndsAt = shop?.current_period_ends_at ? new Date(shop.current_period_ends_at) : null;

  const planLimits = PLAN_LIMITS[plan];
  const maxBarbers = planLimits.maxBarbers;

  const now = new Date();
  const GRACE_PERIOD_DAYS = 3;

  // Calculate trial days remaining
  let trialDaysRemaining: number | null = null;
  let isTrialExpired = false;

  if (status === "trial" && trialEndsAt) {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isTrialExpired = trialDaysRemaining <= 0;
  }

  // Calculate days until expiration (for active subscriptions)
  let daysUntilExpiration: number | null = null;
  if (status === "active" && currentPeriodEndsAt) {
    const diffTime = currentPeriodEndsAt.getTime() - now.getTime();
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate grace period remaining (for past_due subscriptions)
  let graceDaysRemaining: number | null = null;
  let isInGracePeriod = false;
  if (status === "past_due" && currentPeriodEndsAt) {
    const daysSinceExpiration = Math.ceil((now.getTime() - currentPeriodEndsAt.getTime()) / (1000 * 60 * 60 * 24));
    graceDaysRemaining = GRACE_PERIOD_DAYS - daysSinceExpiration;
    isInGracePeriod = graceDaysRemaining > 0;
  }

  // Check if user is blocked (expired status or trial expired)
  const isBlocked = status === "expired" || (status === "trial" && isTrialExpired);

  const canAddBarber = barbersCount < maxBarbers;
  const needsPlanSelection = !hasSelectedPlan;

  return {
    plan,
    status,
    maxBarbers,
    barbersUsed: barbersCount,
    canAddBarber,
    trialEndsAt,
    trialDaysRemaining,
    isTrialExpired,
    currentPeriodEndsAt,
    planLimits,
    isLoading,
    needsPlanSelection,
    isBlocked,
    isInGracePeriod,
    graceDaysRemaining,
    daysUntilExpiration,
  };
}

export function getPlanDisplayName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    essencial: "Essencial",
    profissional: "Profissional",
    elite: "Elite",
  };
  return names[plan];
}

export function getStatusDisplayName(status: SubscriptionStatus): string {
  const names: Record<SubscriptionStatus, string> = {
    trial: "Período de teste",
    active: "Ativo",
    past_due: "Pagamento pendente",
    cancelled: "Cancelado",
    expired: "Expirado",
  };
  return names[status];
}
