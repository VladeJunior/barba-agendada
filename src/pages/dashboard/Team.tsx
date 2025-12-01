import { useState } from "react";
import { useBarbers, useCreateBarber, useUpdateBarber, useDeleteBarber, Barber, BarberInput } from "@/hooks/useBarbers";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscription, getPlanDisplayName } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, Phone, Percent, Clock, CalendarX, Link, CheckCircle, AlertTriangle, Crown } from "lucide-react";
import { WorkingHoursDialog } from "@/components/dashboard/WorkingHoursDialog";
import { BlockedTimesDialog } from "@/components/dashboard/BlockedTimesDialog";
import { LinkBarberDialog } from "@/components/dashboard/LinkBarberDialog";
import { Link as RouterLink } from "react-router-dom";

export default function Team() {
  const { data: barbers = [], isLoading } = useBarbers();
  const createBarber = useCreateBarber();
  const updateBarber = useUpdateBarber();
  const deleteBarber = useDeleteBarber();
  const queryClient = useQueryClient();
  const { plan, maxBarbers, barbersUsed, canAddBarber } = useSubscription();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [workingHoursBarber, setWorkingHoursBarber] = useState<Barber | null>(null);
  const [blockedTimesBarber, setBlockedTimesBarber] = useState<Barber | null>(null);
  const [linkBarber, setLinkBarber] = useState<Barber | null>(null);

  const [formData, setFormData] = useState<BarberInput>({
    name: "",
    bio: "",
    phone: "",
    commission_rate: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      bio: "",
      phone: "",
      commission_rate: 0,
      is_active: true,
    });
    setEditingBarber(null);
  };

  const openEditModal = (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name,
      bio: barber.bio || "",
      phone: barber.phone || "",
      commission_rate: barber.commission_rate || 0,
      is_active: barber.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBarber) {
      await updateBarber.mutateAsync({ id: editingBarber.id, ...formData });
    } else {
      await createBarber.mutateAsync(formData);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBarber.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barber Limit Banner */}
      {!canAddBarber && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Limite de barbeiros atingido</p>
                  <p className="text-sm text-muted-foreground">
                    Seu plano {getPlanDisplayName(plan)} permite até {maxBarbers} barbeiro{maxBarbers > 1 ? "s" : ""}.
                    Faça upgrade para adicionar mais.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="border-gold text-gold hover:bg-gold/10">
                <RouterLink to="/dashboard/plans">
                  <Crown className="w-4 h-4 mr-2" />
                  Ver Planos
                </RouterLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-foreground">Equipe</h1>
            <Badge variant="secondary" className="text-xs">
              {barbersUsed} / {maxBarbers === Infinity ? "∞" : maxBarbers}
            </Badge>
          </div>
          <p className="text-muted-foreground">Gerencie os barbeiros da sua barbearia</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gold hover:bg-gold/90 text-primary-foreground"
              disabled={!canAddBarber}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingBarber ? "Editar Barbeiro" : "Novo Barbeiro"}</DialogTitle>
                <DialogDescription>
                  {editingBarber ? "Atualize as informações do barbeiro" : "Adicione um novo barbeiro à sua equipe"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do barbeiro"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Especialidades, experiência..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commission">Comissão (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Barbeiro ativo</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gold hover:bg-gold/90"
                  disabled={createBarber.isPending || updateBarber.isPending}
                >
                  {editingBarber ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {barbers.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
            <p className="text-sm text-muted-foreground">Clique em "Novo Barbeiro" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card key={barber.id} variant="elevated" className={!barber.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={barber.avatar_url || undefined} />
                    <AvatarFallback className="bg-gold/20 text-gold font-medium">
                      {getInitials(barber.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{barber.name}</CardTitle>
                        {!barber.is_active && (
                          <span className="text-xs text-muted-foreground">(Inativo)</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setWorkingHoursBarber(barber)}
                          title="Horários de trabalho"
                        >
                          <Clock className="w-4 h-4 text-gold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBlockedTimesBarber(barber)}
                          title="Bloqueios e folgas"
                        >
                          <CalendarX className="w-4 h-4 text-orange-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLinkBarber(barber)}
                          title={barber.user_id ? "Gerenciar acesso" : "Vincular conta"}
                        >
                          {barber.user_id ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Link className="w-4 h-4 text-blue-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(barber)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(barber.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {barber.bio && (
                  <CardDescription className="line-clamp-2 mt-2">{barber.bio}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  {barber.phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{barber.phone}</span>
                    </div>
                  )}
                  {barber.commission_rate !== null && barber.commission_rate > 0 && (
                    <div className="flex items-center gap-1 text-gold">
                      <Percent className="w-4 h-4" />
                      <span>{barber.commission_rate}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover barbeiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O barbeiro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {workingHoursBarber && (
        <WorkingHoursDialog
          open={!!workingHoursBarber}
          onOpenChange={(open) => !open && setWorkingHoursBarber(null)}
          barberId={workingHoursBarber.id}
          barberName={workingHoursBarber.name}
        />
      )}

      {blockedTimesBarber && (
        <BlockedTimesDialog
          open={!!blockedTimesBarber}
          onOpenChange={(open) => !open && setBlockedTimesBarber(null)}
          barberId={blockedTimesBarber.id}
          barberName={blockedTimesBarber.name}
        />
      )}

      {linkBarber && (
        <LinkBarberDialog
          open={!!linkBarber}
          onOpenChange={(open) => !open && setLinkBarber(null)}
          barber={{
            id: linkBarber.id,
            name: linkBarber.name,
            user_id: linkBarber.user_id,
            shop_id: linkBarber.shop_id,
            bio: linkBarber.bio,
          }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["barbers"] })}
        />
      )}
    </div>
  );
}
