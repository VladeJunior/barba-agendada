import { useState } from "react";
import { useShop } from "@/hooks/useShop";
import {
  useShopRewards,
  useShopCoupons,
  useUpsertReward,
  useDeleteReward,
  useUpsertCoupon,
  useDeleteCoupon,
  LoyaltyReward,
  LoyaltyCoupon,
} from "@/hooks/useLoyalty";
import { useLoyaltyAnalytics } from "@/hooks/useLoyaltyAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Gift, Ticket, Pencil, Trash2, Award, Percent, TrendingUp, Users } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Loyalty() {
  const { data: shop } = useShop();
  const { data: rewards = [] } = useShopRewards(shop?.id);
  const { data: coupons = [] } = useShopCoupons(shop?.id);
  
  const [analyticsStartDate] = useState(startOfMonth(new Date()));
  const [analyticsEndDate] = useState(endOfMonth(new Date()));
  const { data: analytics, isLoading: loadingAnalytics } = useLoyaltyAnalytics(analyticsStartDate, analyticsEndDate);

  const upsertReward = useUpsertReward();
  const deleteReward = useDeleteReward();
  const upsertCoupon = useUpsertCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [rewardDialog, setRewardDialog] = useState(false);
  const [couponDialog, setCouponDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<LoyaltyCoupon | null>(null);

  const [rewardForm, setRewardForm] = useState({
    title: "",
    description: "",
    points_required: 100,
    discount_type: "percentage" as "percentage" | "amount",
    discount_value: 10,
    is_active: true,
  });

  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "amount",
    discount_value: 10,
    max_uses: null as number | null,
    expires_at: "",
    is_active: true,
  });

  const openRewardDialog = (reward?: LoyaltyReward) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm({
        title: reward.title,
        description: reward.description || "",
        points_required: reward.points_required,
        discount_type: reward.discount_percentage ? "percentage" : "amount",
        discount_value: reward.discount_percentage || reward.discount_amount || 0,
        is_active: reward.is_active,
      });
    } else {
      setEditingReward(null);
      setRewardForm({
        title: "",
        description: "",
        points_required: 100,
        discount_type: "percentage",
        discount_value: 10,
        is_active: true,
      });
    }
    setRewardDialog(true);
  };

  const openCouponDialog = (coupon?: LoyaltyCoupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        description: coupon.description || "",
        discount_type: coupon.discount_percentage ? "percentage" : "amount",
        discount_value: coupon.discount_percentage || coupon.discount_amount || 0,
        max_uses: coupon.max_uses,
        expires_at: coupon.expires_at ? format(parseISO(coupon.expires_at), "yyyy-MM-dd") : "",
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 10,
        max_uses: null,
        expires_at: "",
        is_active: true,
      });
    }
    setCouponDialog(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();

    await upsertReward.mutateAsync({
      id: editingReward?.id,
      title: rewardForm.title,
      description: rewardForm.description || null,
      points_required: rewardForm.points_required,
      discount_percentage: rewardForm.discount_type === "percentage" ? rewardForm.discount_value : null,
      discount_amount: rewardForm.discount_type === "amount" ? rewardForm.discount_value : null,
      is_active: rewardForm.is_active,
    });

    setRewardDialog(false);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    await upsertCoupon.mutateAsync({
      id: editingCoupon?.id,
      code: couponForm.code,
      description: couponForm.description || null,
      discount_percentage: couponForm.discount_type === "percentage" ? couponForm.discount_value : null,
      discount_amount: couponForm.discount_type === "amount" ? couponForm.discount_value : null,
      max_uses: couponForm.max_uses,
      expires_at: couponForm.expires_at || null,
      is_active: couponForm.is_active,
    });

    setCouponDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Programa de Fidelidade</h1>
        <p className="text-muted-foreground">
          Configure recompensas e cupons para fidelizar seus clientes
        </p>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">
            <Gift className="w-4 h-4 mr-2" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger value="coupons">
            <Ticket className="w-4 h-4 mr-2" />
            Cupons
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recompensas por Pontos</CardTitle>
                  <CardDescription>
                    Clientes ganham 10 pontos a cada atendimento completado
                  </CardDescription>
                </div>
                <Button onClick={() => openRewardDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Recompensa
                </Button>
              </div>
            </CardHeader>
          </Card>

          {rewards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma recompensa cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <Card key={reward.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{reward.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">
                            {reward.points_required} pontos
                          </Badge>
                          {!reward.is_active && (
                            <Badge variant="outline">Inativa</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRewardDialog(reward)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReward.mutate(reward.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reward.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {reward.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Percent className="w-4 h-4" />
                      {reward.discount_percentage
                        ? `${reward.discount_percentage}% de desconto`
                        : `R$ ${Number(reward.discount_amount).toFixed(2)} de desconto`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cupons de Desconto</CardTitle>
                  <CardDescription>
                    Crie cupons promocionais para seus clientes
                  </CardDescription>
                </div>
                <Button onClick={() => openCouponDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cupom
                </Button>
              </div>
            </CardHeader>
          </Card>

          {coupons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="px-3 py-1 bg-primary/10 text-primary font-mono font-bold rounded">
                            {coupon.code}
                          </code>
                          {!coupon.is_active && (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                          {coupon.expires_at && new Date(coupon.expires_at) < new Date() && (
                            <Badge variant="destructive">Expirado</Badge>
                          )}
                        </div>
                        {coupon.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {coupon.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-primary">
                            {coupon.discount_percentage
                              ? `${coupon.discount_percentage}% OFF`
                              : `R$ ${Number(coupon.discount_amount).toFixed(2)} OFF`}
                          </span>
                          {coupon.max_uses && (
                            <span className="text-muted-foreground">
                              {coupon.current_uses}/{coupon.max_uses} usos
                            </span>
                          )}
                          {coupon.expires_at && (
                            <span className="text-muted-foreground">
                              Expira em {format(parseISO(coupon.expires_at), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCouponDialog(coupon)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCoupon.mutate(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {loadingAnalytics ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Carregando analytics...</p>
              </CardContent>
            </Card>
          ) : analytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Resgates</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalRedemptions}</div>
                    <p className="text-xs text-muted-foreground">No período selecionado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalRedemptions} de {analytics.completedAppointments} atendimentos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pontos Concedidos</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalPointsAwarded}</div>
                    <p className="text-xs text-muted-foreground">Total no período</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pontos Resgatados</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalPointsRedeemed}</div>
                    <p className="text-xs text-muted-foreground">Total no período</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resgates por Dia</CardTitle>
                  <CardDescription>Evolução diária de resgates de recompensas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(analytics.redemptionsByDate).map(([date, count]) => ({ date, count }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cupons Mais Usados</CardTitle>
                    <CardDescription>Top 5 cupons com mais utilizações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topCoupons.map((coupon, index) => (
                        <div key={coupon.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{coupon.code}</p>
                              <p className="text-sm text-muted-foreground">
                                {coupon.discount_percentage ? `${coupon.discount_percentage}%` : `R$ ${coupon.discount_amount}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{coupon.current_uses} usos</Badge>
                        </div>
                      ))}
                      {analytics.topCoupons.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">Nenhum cupom utilizado ainda</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clientes com Mais Pontos</CardTitle>
                    <CardDescription>Top 10 clientes fiéis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topClients.slice(0, 5).map((client, index) => (
                        <div key={client.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{client.client_name || "Cliente Anônimo"}</p>
                              <p className="text-sm text-muted-foreground">{client.client_phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{client.total_points}</p>
                            <p className="text-xs text-muted-foreground">pontos</p>
                          </div>
                        </div>
                      ))}
                      {analytics.topClients.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">Nenhum cliente com pontos ainda</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Reward Dialog */}
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent>
          <form onSubmit={handleSaveReward}>
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Editar Recompensa" : "Nova Recompensa"}
              </DialogTitle>
              <DialogDescription>
                Configure uma recompensa que clientes podem resgatar com pontos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reward-title">Título</Label>
                <Input
                  id="reward-title"
                  value={rewardForm.title}
                  onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                  placeholder="Ex: 10% de desconto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward-description">Descrição (opcional)</Label>
                <Textarea
                  id="reward-description"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Descreva a recompensa..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward-points">Pontos Necessários</Label>
                <Input
                  id="reward-points"
                  type="number"
                  min="1"
                  value={rewardForm.points_required}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, points_required: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <select
                    className="w-full px-3 py-2 rounded-md border bg-background"
                    value={rewardForm.discount_type}
                    onChange={(e) =>
                      setRewardForm({
                        ...rewardForm,
                        discount_type: e.target.value as "percentage" | "amount",
                      })
                    }
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="amount">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward-value">Valor</Label>
                  <Input
                    id="reward-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={rewardForm.discount_value}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, discount_value: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="reward-active"
                  checked={rewardForm.is_active}
                  onCheckedChange={(checked) =>
                    setRewardForm({ ...rewardForm, is_active: checked })
                  }
                />
                <Label htmlFor="reward-active">Recompensa ativa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRewardDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertReward.isPending}>
                {upsertReward.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent>
          <form onSubmit={handleSaveCoupon}>
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
              </DialogTitle>
              <DialogDescription>
                Crie um cupom promocional para seus clientes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Código do Cupom</Label>
                <Input
                  id="coupon-code"
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: PRIMEIRAVISITA"
                  maxLength={20}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-description">Descrição (opcional)</Label>
                <Textarea
                  id="coupon-description"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Descreva o cupom..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <select
                    className="w-full px-3 py-2 rounded-md border bg-background"
                    value={couponForm.discount_type}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discount_type: e.target.value as "percentage" | "amount",
                      })
                    }
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="amount">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-value">Valor</Label>
                  <Input
                    id="coupon-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={couponForm.discount_value}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-max-uses">Usos Máximos (opcional)</Label>
                  <Input
                    id="coupon-max-uses"
                    type="number"
                    min="1"
                    value={couponForm.max_uses || ""}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        max_uses: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-expires">Validade (opcional)</Label>
                  <Input
                    id="coupon-expires"
                    type="date"
                    value={couponForm.expires_at}
                    onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="coupon-active"
                  checked={couponForm.is_active}
                  onCheckedChange={(checked) =>
                    setCouponForm({ ...couponForm, is_active: checked })
                  }
                />
                <Label htmlFor="coupon-active">Cupom ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCouponDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertCoupon.isPending}>
                {upsertCoupon.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
