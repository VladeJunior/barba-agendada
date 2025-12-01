import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function AdminMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [shopsResult, appointmentsResult, barbersResult, servicesResult] = await Promise.all([
        supabase.from("shops").select("plan, subscription_status"),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("barbers").select("*", { count: "exact", head: true }),
        supabase.from("services").select("*", { count: "exact", head: true }),
      ]);

      // Plan distribution
      const planDistribution = shopsResult.data?.reduce((acc, shop) => {
        const plan = shop.plan || "unknown";
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // MRR calculation
      const planPrices = {
        essencial: 149,
        profissional: 199,
        elite: 299,
      };

      const activeShops = shopsResult.data?.filter((s) => s.subscription_status === "active") || [];
      const mrr = activeShops.reduce((sum, shop) => {
        return sum + (planPrices[shop.plan as keyof typeof planPrices] || 0);
      }, 0);

      // Conversion rate (active / total)
      const totalShops = shopsResult.data?.length || 0;
      const activeCount = activeShops.length;
      const conversionRate = totalShops > 0 ? (activeCount / totalShops) * 100 : 0;

      // Churn rate (cancelled / total)
      const cancelledCount =
        shopsResult.data?.filter((s) => s.subscription_status === "cancelled").length || 0;
      const churnRate = totalShops > 0 ? (cancelledCount / totalShops) * 100 : 0;

      return {
        totalAppointments: appointmentsResult.count || 0,
        totalBarbers: barbersResult.count || 0,
        totalServices: servicesResult.count || 0,
        totalShops,
        planDistribution,
        mrr,
        conversionRate,
        churnRate,
      };
    },
  });

  const planData = metrics?.planDistribution
    ? Object.entries(metrics.planDistribution).map(([name, value]) => ({
        name: name === "essencial" ? "Essencial" : name === "profissional" ? "Profissional" : "Elite",
        value,
      }))
    : [];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"];

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Métricas do Sistema</h1>
        <p className="text-muted-foreground">Indicadores e estatísticas globais</p>
      </div>

      {/* Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(metrics?.mrr || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Trial → Pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Taxa de cancelamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Barbearias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalShops}</div>
            <p className="text-xs text-muted-foreground">Cadastradas no sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Média de {((metrics?.totalAppointments || 0) / (metrics?.totalShops || 1)).toFixed(1)}{" "}
              por barbearia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Barbeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalBarbers}</div>
            <p className="text-xs text-muted-foreground">
              Média de {((metrics?.totalBarbers || 0) / (metrics?.totalShops || 1)).toFixed(1)} por
              barbearia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Média de {((metrics?.totalServices || 0) / (metrics?.totalShops || 1)).toFixed(1)}{" "}
              por barbearia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
