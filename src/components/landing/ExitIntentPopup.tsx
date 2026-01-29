import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "exit-intent-shown";
const COUPON_CODE = "BARBER20";

export const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return;

    const handleMouseOut = (event: MouseEvent) => {
      // Only trigger when mouse leaves through the top of the viewport
      if (event.clientY <= 0 && window.innerWidth > 768) {
        setIsOpen(true);
        localStorage.setItem(STORAGE_KEY, "true");
      }
    };

    document.addEventListener("mouseout", handleMouseOut);
    return () => document.removeEventListener("mouseout", handleMouseOut);
  }, []);

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy coupon:", err);
    }
  };

  const handleRedeemCoupon = () => {
    setIsOpen(false);
    navigate("/register");
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-gold/30 bg-gradient-card">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-display text-foreground">
            Um presente para você começar hoje. 🎁
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            Vi que você está interessado em profissionalizar sua barbearia. Para te ajudar a dar o primeiro passo, liberei um cupom exclusivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Coupon Display */}
          <div className="bg-secondary/50 border border-gold/20 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Use o cupom e ganhe <span className="text-gold font-semibold">20% de desconto</span> na sua primeira mensalidade
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-gradient-gold tracking-wider font-display">
                {COUPON_CODE}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCoupon}
                className="h-8 w-8 text-muted-foreground hover:text-gold"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleRedeemCoupon}
          >
            Resgatar Cupom e Começar
          </Button>

          {/* Dismiss Link */}
          <button
            onClick={handleDismiss}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dispensar presente e fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
