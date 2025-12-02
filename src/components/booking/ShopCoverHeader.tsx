import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShopCoverHeaderProps {
  shop: {
    name: string;
    logo_url?: string | null;
    cover_url?: string | null;
  };
  shopSlug?: string;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export function ShopCoverHeader({
  shop,
  shopSlug,
  title,
  subtitle,
  showBackButton = false,
  backTo,
  onBack,
  children,
}: ShopCoverHeaderProps) {
  const hasValidCover = shop.cover_url && shop.cover_url.trim() !== "";

  return (
    <div className="relative">
      {/* Cover Image or Gradient Fallback */}
      <div 
        className="h-40 md:h-56 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden"
      >
        {hasValidCover && (
          <img
            src={shop.cover_url!}
            alt={`Capa de ${shop.name}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content overlaying the cover */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="container mx-auto px-4 pb-4">
          <div className="flex items-end gap-4">
            {/* Back button */}
            {showBackButton && (
              <div className="absolute top-4 left-4">
                {backTo ? (
                  <Link to={backTo}>
                    <Button variant="secondary" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : onBack ? (
                  <Button variant="secondary" size="icon" onClick={onBack} className="bg-background/80 backdrop-blur-sm hover:bg-background">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                ) : null}
              </div>
            )}

            {/* Logo */}
            {shop.logo_url && (
              <div className="shrink-0">
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover border-4 border-background shadow-lg"
                />
              </div>
            )}

            {/* Shop info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-foreground text-xl md:text-2xl truncate">
                {title || shop.name}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>

            {/* Optional children (e.g., action buttons) */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
