import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

interface WhatsAppTourProps {
  connectionStatus: "disconnected" | "connected" | "loading";
  isWapiConfigured: boolean;
}

const TOUR_STORAGE_KEY = "has_seen_whatsapp_tour";

export function WhatsAppTour({ connectionStatus, isWapiConfigured }: WhatsAppTourProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tourInstance, setTourInstance] = useState<ReturnType<typeof driver> | null>(null);
  
  useEffect(() => {
    // Only run on dashboard or settings page
    const isOnDashboard = location.pathname === "/dashboard";
    const isOnSettings = location.pathname === "/dashboard/settings";
    
    // Check if tour was already seen
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY) === "true";
    
    // Tour should only start if:
    // 1. User hasn't seen the tour
    // 2. WhatsApp is disconnected
    // 3. User is on dashboard or settings
    const shouldStartTour = !hasSeenTour && 
      connectionStatus === "disconnected" && 
      (isOnDashboard || isOnSettings);
    
    if (!shouldStartTour) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "rgba(0, 0, 0, 0.85)",
        stagePadding: 10,
        stageRadius: 8,
        popoverClass: "infobarber-tour-popover",
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Próximo",
        prevBtnText: "Anterior",
        doneBtnText: "Concluir",
        onDestroyStarted: () => {
          // Mark tour as seen when user closes it
          localStorage.setItem(TOUR_STORAGE_KEY, "true");
          driverObj.destroy();
        },
        steps: getSteps(isOnSettings, navigate),
      });

      setTourInstance(driverObj);
      driverObj.drive();
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (tourInstance) {
        tourInstance.destroy();
      }
    };
  }, [connectionStatus, location.pathname]);

  return (
    <style>{`
      .infobarber-tour-popover {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
        border: 1px solid hsl(45, 93%, 47%) !important;
        border-radius: 12px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(234, 179, 8, 0.1) !important;
      }
      
      .infobarber-tour-popover .driver-popover-title {
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 1.1rem !important;
      }
      
      .infobarber-tour-popover .driver-popover-description {
        color: #e5e5e5 !important;
        font-size: 0.95rem !important;
        line-height: 1.6 !important;
      }
      
      .infobarber-tour-popover .driver-popover-progress-text {
        color: #a3a3a3 !important;
      }
      
      .infobarber-tour-popover .driver-popover-prev-btn {
        background: transparent !important;
        border: 1px solid hsl(45, 93%, 47%) !important;
        color: hsl(45, 93%, 47%) !important;
        border-radius: 8px !important;
        padding: 8px 16px !important;
        font-weight: 500 !important;
        transition: all 0.2s !important;
      }
      
      .infobarber-tour-popover .driver-popover-prev-btn:hover {
        background: hsl(45, 93%, 47%, 0.1) !important;
      }
      
      .infobarber-tour-popover .driver-popover-next-btn,
      .infobarber-tour-popover .driver-popover-close-btn-inside {
        background: linear-gradient(135deg, hsl(45, 93%, 47%) 0%, hsl(45, 93%, 37%) 100%) !important;
        color: #000000 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 8px 16px !important;
        font-weight: 600 !important;
        transition: all 0.2s !important;
        box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3) !important;
      }
      
      .infobarber-tour-popover .driver-popover-next-btn:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 16px rgba(234, 179, 8, 0.4) !important;
      }
      
      .infobarber-tour-popover .driver-popover-arrow-side-left.driver-popover-arrow,
      .infobarber-tour-popover .driver-popover-arrow-side-right.driver-popover-arrow,
      .infobarber-tour-popover .driver-popover-arrow-side-top.driver-popover-arrow,
      .infobarber-tour-popover .driver-popover-arrow-side-bottom.driver-popover-arrow {
        border-color: #2d2d2d !important;
      }
      
      .infobarber-tour-popover .driver-popover-close-btn {
        color: #a3a3a3 !important;
      }
      
      .infobarber-tour-popover .driver-popover-close-btn:hover {
        color: #ffffff !important;
      }
      
      @media (max-width: 640px) {
        .infobarber-tour-popover {
          margin: 8px !important;
          max-width: calc(100vw - 16px) !important;
        }
        
        .infobarber-tour-popover .driver-popover-title {
          font-size: 1rem !important;
        }
        
        .infobarber-tour-popover .driver-popover-description {
          font-size: 0.875rem !important;
        }
        
        .infobarber-tour-popover .driver-popover-footer {
          flex-direction: column !important;
          gap: 8px !important;
        }
        
        .infobarber-tour-popover .driver-popover-prev-btn,
        .infobarber-tour-popover .driver-popover-next-btn {
          width: 100% !important;
          justify-content: center !important;
        }
      }
    `}</style>
  );
}

function getSteps(isOnSettings: boolean, navigate: (path: string) => void): DriveStep[] {
  const steps: DriveStep[] = [
    {
      popover: {
        title: "Bem-vindo ao InfoBarber! 💈",
        description: "Vamos ativar sua <strong>Secretária Virtual</strong> para agendar cortes e enviar lembretes automaticamente via WhatsApp?<br/><br/>Ela funciona <strong>24 horas por dia</strong>, 7 dias por semana! 🤖",
        side: "over",
        align: "center",
      },
    },
  ];

  if (!isOnSettings) {
    steps.push({
      element: "#sidebar-settings-link",
      popover: {
        title: "Acesse as Configurações ⚙️",
        description: "Clique aqui para acessar o painel de conexões e configurar sua <strong>Secretária Virtual</strong>.",
        side: "right",
        align: "start",
      },
      onHighlightStarted: () => {
        // If the sidebar is collapsed on mobile, we need to handle that
        const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
        if (sidebarElement) {
          sidebarElement.setAttribute('data-state', 'expanded');
        }
      },
    });
  } else {
    steps.push({
      element: "#whatsapp-connect-section",
      popover: {
        title: "Conecte seu WhatsApp 📱",
        description: "Role até esta seção para ver as opções de conexão do WhatsApp.",
        side: "top",
        align: "center",
      },
    });

    steps.push({
      element: "#whatsapp-connect-btn",
      popover: {
        title: "Hora de Conectar! 🚀",
        description: "Clique aqui, <strong>escaneie o QR Code</strong> com seu celular e deixe o robô trabalhar por você!<br/><br/>Sua Secretária Virtual estará pronta para atender seus clientes.",
        side: "top",
        align: "center",
      },
    });
  }

  return steps;
}

export function resetWhatsAppTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
