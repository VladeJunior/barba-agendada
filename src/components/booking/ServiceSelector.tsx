import { Check, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
}

export function ServiceSelector({ services, selectedServiceId, onSelect }: ServiceSelectorProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum serviço disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {services.map((service) => {
        const isSelected = selectedServiceId === service.id;
        return (
          <button
            key={service.id}
            onClick={() => onSelect(service.id)}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all",
              "hover:border-primary/50 hover:bg-accent/50",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <DollarSign className="h-4 w-4" />
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
              </div>
              {isSelected && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
