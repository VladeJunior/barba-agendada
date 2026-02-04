import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "@/hooks/useShop";
import { useDashboardMetrics, PeriodType } from "@/hooks/useDashboardMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, ShoppingBag, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

const PERIOD_LABELS: Record<PeriodType, string> = {
  today: "Hoje",
  week: "Esta Semana",
  month: "Este Mês",
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>("week");
  const { data: shop, isLoading: shopLoading } = useShop();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(period);

  if (shopLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-gold text-primary-foreground hover:bg-gold/90" : ""}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Card - Updated with breakdown */}
        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              {metrics && metrics.revenueGrowth !== 0 && (
                <div className={`flex items-center text-xs ${metrics.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.revenueGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.revenueGrowth).toFixed(0)}%
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Serviços: R$ {(metrics?.serviceRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Produtos: R$ {(metrics?.productSalesRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                R$ {(metrics?.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Faturamento Total</p>
          </CardContent>
        </Card>

        {/* New Product Sales Card */}
        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              {metrics && metrics.productSalesGrowth !== 0 && (
                <div className={`flex items-center text-xs ${metrics.productSalesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.productSalesGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.productSalesGrowth).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              R$ {(metrics?.productSalesRevenue || 0).toFixed(2)}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">Vendas de Produtos</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-gold" />
              {metrics && metrics.appointmentGrowth !== 0 && (
                <div className={`flex items-center text-xs ${metrics.appointmentGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.appointmentGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.appointmentGrowth).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {metrics?.totalAppointments || 0}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">Agendamentos</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              R$ {(metrics?.averageTicket || 0).toFixed(2)}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">Ticket Médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert - Only shows when there are products with low stock */}
      {metrics?.lowStockProducts && metrics.lowStockProducts.length > 0 && (
        <Card variant="elevated" className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Alerta de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.lowStockProducts.map((p, i) => (
                      <span key={p.id}>
                        <span className={p.stock_quantity === 0 ? 'text-red-500' : 'text-amber-500'}>
                          {p.name} ({p.stock_quantity} un)
                        </span>
                        {i < metrics.lowStockProducts.length - 1 && ' · '}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/products')}
                className="shrink-0"
              >
                Ver Produtos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Barbers */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-gold" />
              Barbeiros Mais Requisitados
            </CardTitle>
            <CardDescription>Faturamento por barbeiro ({PERIOD_LABELS[period].toLowerCase()})</CardDescription>
          </CardHeader>
          <CardContent>
            {!metrics?.topBarbers?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sem dados no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.topBarbers} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(45, 93%, 47%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-gold" />
              Status dos Agendamentos
            </CardTitle>
            <CardDescription>Distribuição por status ({PERIOD_LABELS[period].toLowerCase()})</CardDescription>
          </CardHeader>
          <CardContent>
            {!metrics?.statusBreakdown?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sem dados no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={metrics.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {metrics.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services and Products Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-gold" />
              Serviços Mais Populares
            </CardTitle>
            <CardDescription>Por quantidade de atendimentos</CardDescription>
          </CardHeader>
          <CardContent>
            {!metrics?.topServices?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sem dados no período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gold w-6">{index + 1}º</span>
                      <span className="text-sm text-foreground">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{service.count}x</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        R$ {service.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-gold" />
              Produtos Mais Vendidos
            </CardTitle>
            <CardDescription>Por quantidade vendida</CardDescription>
          </CardHeader>
          <CardContent>
            {!metrics?.topProducts?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sem dados no período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gold w-6">{index + 1}º</span>
                      <span className="text-sm text-foreground">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{product.quantity}x</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        R$ {product.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
