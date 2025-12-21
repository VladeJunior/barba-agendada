import { useState, useEffect } from "react";
import { useServices } from "@/hooks/useServices";
import { useBarberServices, useUpdateBarberServices } from "@/hooks/useBarberServices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Scissors, Clock, Loader2 } from "lucide-react";

interface BarberServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
}

export function BarberServicesDialog({
  open,
  onOpenChange,
  barberId,
  barberName,
}: BarberServicesDialogProps) {
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: barberServiceIds = [], isLoading: barberServicesLoading } = useBarberServices(barberId);
  const updateBarberServices = useUpdateBarberServices();

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Inicializar com os serviços já vinculados
  useEffect(() => {
    if (barberServiceIds) {
      setSelectedServiceIds(barberServiceIds);
    }
  }, [barberServiceIds]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    setSelectedServiceIds(services.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedServiceIds([]);
  };

  const handleSave = async () => {
    await updateBarberServices.mutateAsync({
      barberId,
      serviceIds: selectedServiceIds,
    });
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const isLoading = servicesLoading || barberServicesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gold" />
            Serviços de {barberName}
          </DialogTitle>
          <DialogDescription>
            Selecione quais serviços este barbeiro pode realizar
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : services.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum serviço cadastrado. Adicione serviços primeiro.
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Selecionar Todos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
              >
                Desmarcar Todos
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedServiceIds.includes(service.id)
                      ? "border-gold bg-gold/5"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggleService(service.id)}
                >
                  <Checkbox
                    id={service.id}
                    checked={selectedServiceIds.includes(service.id)}
                    onCheckedChange={() => handleToggleService(service.id)}
                    className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={service.id}
                      className="font-medium cursor-pointer"
                    >
                      {service.name}
                    </Label>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="text-gold font-medium">
                        {formatPrice(service.price)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
              <strong>Dica:</strong> Se nenhum serviço for selecionado, o barbeiro poderá realizar todos os serviços (comportamento padrão).
            </div>
          </>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateBarberServices.isPending || isLoading}
            className="bg-gold hover:bg-gold/90"
          >
            {updateBarberServices.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
