import { Check, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { useBarberAverageRating } from "@/hooks/useBarberReviews";

interface Barber {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarberId: string | null;
  onSelect: (barberId: string) => void;
}

export function BarberSelector({ barbers, selectedBarberId, onSelect }: BarberSelectorProps) {
  if (barbers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum profissional disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {barbers.map((barber) => {
        const isSelected = selectedBarberId === barber.id;
        return (
          <BarberCard
            key={barber.id}
            barber={barber}
            isSelected={isSelected}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

function BarberCard({
  barber,
  isSelected,
  onSelect,
}: {
  barber: Barber;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { data: ratingData } = useBarberAverageRating(barber.id);

  return (
    <button
      onClick={() => onSelect(barber.id)}
      className={cn(
        "p-4 rounded-lg border-2 text-left transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
          <AvatarFallback>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{barber.name}</h3>
          {ratingData && ratingData.count > 0 ? (
            <div className="flex items-center gap-1 mt-1">
              <StarRating
                rating={ratingData.average}
                size={14}
                showCount
                count={ratingData.count}
              />
            </div>
          ) : (
            barber.bio && (
              <p className="text-sm text-muted-foreground truncate">
                {barber.bio}
              </p>
            )
          )}
        </div>
        {isSelected && (
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}
