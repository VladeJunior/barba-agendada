import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Star, TrendingUp } from "lucide-react";
import { useClientPoints, useShopRewards, useRedeemReward } from "@/hooks/useLoyalty";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoyaltyCardProps {
  shopId: string;
  clientPhone: string;
}

export function LoyaltyCard({ shopId, clientPhone }: LoyaltyCardProps) {
  const { data: points } = useClientPoints(shopId, clientPhone);
  const { data: rewards = [] } = useShopRewards(shopId);
  const redeemReward = useRedeemReward();
  const [redeemDialog, setRedeemDialog] = useState(false);

  const activeRewards = rewards.filter(r => r.is_active);
  const nextReward = activeRewards.find(
    r => r.points_required > (points?.total_points || 0)
  );

  const progress = nextReward
    ? ((points?.total_points || 0) / nextReward.points_required) * 100
    : 100;

  const handleRedeem = async (rewardId: string, pointsRequired: number) => {
    await redeemReward.mutateAsync({
      shopId,
      clientPhone,
      rewardId,
      pointsRequired,
    });
    setRedeemDialog(false);
  };

  if (!points || points.total_points === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Programa de Fidelidade
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRedeemDialog(true)}
              disabled={activeRewards.length === 0}
            >
              <Star className="w-4 h-4 mr-2" />
              Resgatar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Seus pontos</p>
              <p className="text-3xl font-bold text-primary">{points.total_points}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total acumulado</p>
              <p className="text-lg font-semibold">{points.lifetime_points}</p>
            </div>
          </div>

          {nextReward && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próxima recompensa</span>
                <span className="font-medium">
                  {nextReward.points_required - points.total_points} pontos restantes
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{nextReward.title}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={redeemDialog} onOpenChange={setRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Recompensa</DialogTitle>
            <DialogDescription>
              Você tem {points.total_points} pontos disponíveis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {activeRewards.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhuma recompensa disponível no momento
              </p>
            ) : (
              activeRewards.map((reward) => {
                const canRedeem = points.total_points >= reward.points_required;
                return (
                  <Card key={reward.id} className={!canRedeem ? "opacity-50" : ""}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{reward.title}</h4>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reward.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{reward.points_required} pontos</Badge>
                            <span className="text-sm font-semibold text-primary">
                              {reward.discount_percentage
                                ? `${reward.discount_percentage}% OFF`
                                : `R$ ${Number(reward.discount_amount).toFixed(2)} OFF`}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRedeem(reward.id, reward.points_required)}
                          disabled={!canRedeem || redeemReward.isPending}
                        >
                          Resgatar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
