import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { useCreateReview } from "@/hooks/useBarberReviews";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  barberId: string;
  barberName: string;
  clientPhone?: string;
}

export function ReviewDialog({
  open,
  onOpenChange,
  appointmentId,
  barberId,
  barberName,
  clientPhone,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  const handleSubmit = async () => {
    if (rating === 0) return;

    await createReview.mutateAsync({
      appointment_id: appointmentId,
      barber_id: barberId,
      rating,
      comment: comment.trim() || undefined,
      client_phone: clientPhone,
    });

    onOpenChange(false);
    setRating(0);
    setComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar Atendimento</DialogTitle>
          <DialogDescription>
            Como foi seu atendimento com {barberName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium">Sua nota:</p>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size={32}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || createReview.isPending}
          >
            {createReview.isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
