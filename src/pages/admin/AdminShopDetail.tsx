import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: shop, isLoading } = useQuery({
    queryKey: ["admin-shop", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shops").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: barbers } = useQuery({
    queryKey: ["admin-shop-barbers", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("barbers").select("*").eq("shop_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["admin-shop-services", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("shop_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const updateShopMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("shops").update(updates).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shop", id] });
      toast.success("Alteração realizada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar barbearia");
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!shop) {
    return <div>Barbearia não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/shops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{shop.name}</h1>
          <p className="text-muted-foreground">Detalhes e configurações</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Nome:</span>
              <p className="font-medium">{shop.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Slug:</span>
              <p className="font-medium">
                <code className="text-xs bg-muted px-2 py-1 rounded">{shop.slug}</code>
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Telefone:</span>
              <p className="font-medium">{shop.phone || "Não informado"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Endereço:</span>
              <p className="font-medium">{shop.address || "Não informado"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cidade/Estado:</span>
              <p className="font-medium">
                {shop.city && shop.state ? `${shop.city}/${shop.state}` : "Não informado"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cadastro:</span>
              <p className="font-medium">
                {format(new Date(shop.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">W-API:</span>
              <Badge variant={shop.wapi_instance_id ? "default" : "outline"}>
                {shop.wapi_instance_id ? "Conectado" : "Não conectado"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">Plano Atual:</span>
              <div className="mt-2">
                <Select
                  value={shop.plan || ""}
                  onValueChange={(value) => updateShopMutation.mutate({ plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essencial">Essencial - R$ 149/mês</SelectItem>
                    <SelectItem value="profissional">Profissional - R$ 199/mês</SelectItem>
                    <SelectItem value="elite">Elite - R$ 299/mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="mt-2">
                <Select
                  value={shop.subscription_status || ""}
                  onValueChange={(value) =>
                    updateShopMutation.mutate({ subscription_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="past_due">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {shop.trial_ends_at && (
              <div>
                <span className="text-sm text-muted-foreground">Trial expira em:</span>
                <p className="font-medium">
                  {format(new Date(shop.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant={shop.is_active ? "destructive" : "default"}
                className="w-full"
                onClick={() =>
                  updateShopMutation.mutate({ is_active: !shop.is_active })
                }
              >
                {shop.is_active ? "Desativar Barbearia" : "Ativar Barbearia"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Barbeiros */}
        <Card>
          <CardHeader>
            <CardTitle>Barbeiros ({barbers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {barbers && barbers.length > 0 ? (
              <ul className="space-y-2">
                {barbers.map((barber) => (
                  <li key={barber.id} className="flex items-center justify-between">
                    <span>{barber.name}</span>
                    <Badge variant={barber.is_active ? "default" : "outline"}>
                      {barber.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços ({services?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {services && services.length > 0 ? (
              <ul className="space-y-2">
                {services.map((service) => (
                  <li key={service.id} className="flex items-center justify-between">
                    <span>{service.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(service.price))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
