import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePublicShopBySlug, usePublicServices, usePublicBarbers } from "@/hooks/usePublicShop";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { BarberSelector } from "@/components/booking/BarberSelector";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Serviço" },
  { id: 2, label: "Profissional" },
  { id: 3, label: "Horário" },
  { id: 4, label: "Confirmar" },
];

export default function Booking() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const navigate = useNavigate();
  
  const { data: shop, isLoading: shopLoading } = usePublicShopBySlug(shopSlug);
  const { data: services = [] } = usePublicServices(shop?.id);
  const { data: barbers = [] } = usePublicBarbers(shop?.id);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(() => 
    services.find(s => s.id === selectedServiceId), 
    [services, selectedServiceId]
  );
  
  const selectedBarber = useMemo(() => 
    barbers.find(b => b.id === selectedBarberId), 
    [barbers, selectedBarberId]
  );

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarberId(barberId);
  };

  const handleDateTimeSelect = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = async () => {
    if (!shop || !selectedServiceId || !selectedBarberId || !selectedDateTime || !selectedService) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const endTime = new Date(selectedDateTime.getTime() + selectedService.duration_minutes * 60000);

      const { error } = await supabase
        .from("appointments")
        .insert({
          shop_id: shop.id,
          barber_id: selectedBarberId,
          service_id: selectedServiceId,
          client_name: clientName.trim(),
          client_phone: clientPhone.replace(/\D/g, ""),
          notes: notes.trim() || null,
          start_time: selectedDateTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "scheduled",
          payment_status: "pending",
        });

      if (error) throw error;

      // Send WhatsApp confirmation (silently - don't block on errors)
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            shopId: shop.id,
            phone: clientPhone.replace(/\D/g, ""),
            clientName: clientName.trim(),
            serviceName: selectedService.name,
            servicePrice: selectedService.price,
            barberName: selectedBarber?.name || "",
            dateTime: selectedDateTime.toISOString(),
            shopName: shop.name,
          },
        });
      } catch (whatsappError) {
        console.log("WhatsApp notification skipped:", whatsappError);
      }

      setIsConfirmed(true);
      toast.success("Agendamento confirmado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao confirmar agendamento: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!selectedServiceId;
      case 2: return !!selectedBarberId;
      case 3: return !!selectedDateTime;
      default: return false;
    }
  };

  if (shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Barbearia não encontrada</h1>
        <p className="text-muted-foreground mb-4">A barbearia que você está procurando não existe ou está inativa.</p>
        <Button onClick={() => navigate("/")}>Voltar ao início</Button>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Agendamento Confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
          </p>
          <div className="bg-card border rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{selectedService?.name}</strong> com {selectedBarber?.name}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedDateTime?.toLocaleDateString("pt-BR", { 
                weekday: "long", 
                day: "numeric", 
                month: "long" 
              })} às {selectedDateTime?.toLocaleTimeString("pt-BR", { 
                hour: "2-digit", 
                minute: "2-digit" 
              })}
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao início
            </Button>
            <Link to="/meus-agendamentos" className="block">
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver meus agendamentos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => currentStep > 1 ? handleBack() : navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{shop.name}</h1>
              <p className="text-sm text-muted-foreground">Agendar horário</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-8">
          <BookingStepper steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Escolha o serviço</h2>
              <ServiceSelector
                services={services}
                selectedServiceId={selectedServiceId}
                onSelect={handleServiceSelect}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Escolha o profissional</h2>
              <BarberSelector
                barbers={barbers}
                selectedBarberId={selectedBarberId}
                onSelect={handleBarberSelect}
              />
            </div>
          )}

          {currentStep === 3 && selectedService && selectedBarberId && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Escolha o horário</h2>
              <DateTimePicker
                barberId={selectedBarberId}
                serviceDuration={selectedService.duration_minutes}
                selectedDateTime={selectedDateTime}
                onSelect={handleDateTimeSelect}
              />
            </div>
          )}

          {currentStep === 4 && selectedService && selectedBarber && selectedDateTime && (
            <BookingConfirmation
              shopName={shop.name}
              serviceName={selectedService.name}
              servicePrice={selectedService.price}
              serviceDuration={selectedService.duration_minutes}
              barberName={selectedBarber.name}
              dateTime={selectedDateTime}
              clientName={clientName}
              clientPhone={clientPhone}
              notes={notes}
              onClientNameChange={setClientName}
              onClientPhoneChange={setClientPhone}
              onNotesChange={setNotes}
              onConfirm={handleConfirm}
              isLoading={isSubmitting}
            />
          )}
        </div>

        {currentStep < 4 && (
          <div className="mt-8 flex justify-end">
            <Button onClick={handleNext} disabled={!canProceed()} size="lg">
              Continuar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
