import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [shopsResult, activeResult, trialResult, recentResult] = await Promise.all([
        supabase.from("shops").select("*", { count: "exact", head: true }),
        supabase.from("shops").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
        supabase.from("shops").select("*", { count: "exact", head: true }).eq("subscription_status", "trial"),
        supabase.from("shops").select("*").gte("created_at", subDays(new Date(), 7).toISOString()),
      ]);

      // Calculate MRR
      const { data: activeShops } = await supabase
        .from("shops")
        .select("plan")
        .eq("subscription_status", "active");

      const planPrices = {
        essencial: 149,
        profissional: 199,
        elite: 299,
      };

      const mrr = activeShops?.reduce((sum, shop) => {
        return sum + (planPrices[shop.plan as keyof typeof planPrices] || 0);
      }, 0) || 0;

      // Expiring trials
      const { data: expiringTrials } = await supabase
        .from("shops")
        .select("*")
        .eq("subscription_status", "trial")
        .lte("trial_ends_at", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());

      // Past due
      const pastDueResult = await supabase
        .from("shops")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "past_due");

      return {
        totalShops: shopsResult.count || 0,
        activeShops: activeResult.count || 0,
        trialShops: trialResult.count || 0,
        recentShops: recentResult.data?.length || 0,
        mrr,
        expiringTrials: expiringTrials || [],
        pastDueCount: pastDueResult.count || 0,
      };
    },
  });

  const { data: growthData } = useQuery({
    queryKey: ["admin-growth"],
    queryFn: async () => {
      const days = 30;
      const data = [];

      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const { count } = await supabase
          .from("shops")
          .select("*", { count: "exact", head: true })
          .lte("created_at", date.toISOString());

        data.push({
          date: format(date, "dd/MM", { locale: ptBR }),
          total: count || 0,
        });
      }

      return data;
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">Visão geral do sistema InfoBarber</p>
      </div>

      {/* Alertas */}
      {(stats?.expiringTrials.length || 0) > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats?.expiringTrials.length} barbearia(s) com trial expirando nos próximos 3 dias
          </AlertDescription>
        </Alert>
      )}

      {(stats?.pastDueCount || 0) > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats?.pastDueCount} barbearia(s) com pagamento pendente
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Barbearias</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalShops}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentShops} novas nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeShops}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{stats?.trialShops} em trial</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats?.mrr || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.recentShops}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Crescimento de Cadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
