import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePublicShopBySlug, usePublicBarbers } from "@/hooks/usePublicShop";
import { useBarberReviews } from "@/hooks/useBarberReviews";
import { useBarberStats } from "@/hooks/useBarberStats";
import { useBarberPortfolio } from "@/hooks/useBarberPortfolio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, TrendingUp, Calendar, Star, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BarberProfile() {
  const { shopSlug, barberId } = useParams();
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: shop } = usePublicShopBySlug(shopSlug);
  const { data: barbers } = usePublicBarbers(shop?.id);
  const barber = barbers?.find(b => b.id === barberId);
  
  const { data: reviews } = useBarberReviews(barberId);
  const { data: stats } = useBarberStats(barberId);
  const { data: portfolio } = useBarberPortfolio(barberId);

  const filteredReviews = reviews?.filter(review => {
    if (ratingFilter === "all") return true;
    return review.rating === parseInt(ratingFilter);
  });

  if (!barber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Barbeiro não encontrado</p>
          <Link to={`/agendar/${shopSlug}`}>
            <Button className="mt-4">Voltar para agendamento</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Link 
          to={`/agendar/${shopSlug}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para agendamento
        </Link>

        {/* Header Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-32 w-32">
                <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
                <AvatarFallback className="text-4xl">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{barber.name}</h1>
                {barber.bio && (
                  <p className="text-muted-foreground mb-4">{barber.bio}</p>
                )}
                
                {stats && stats.totalReviews > 0 && (
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                    <StarRating rating={stats.averageRating} size={20} />
                    <span className="text-lg font-semibold">{stats.averageRating}</span>
                    <span className="text-muted-foreground">
                      ({stats.totalReviews} {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </div>
                )}

                <Link to={`/agendar/${shopSlug}`}>
                  <Button size="lg">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar com {barber.name}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Atendimentos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{stats.averageRating}</p>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{portfolio?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Trabalhos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews">
              Avaliações ({reviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="portfolio">
              Galeria ({portfolio?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4 mt-6">
            {reviews && reviews.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {filteredReviews?.length} {filteredReviews?.length === 1 ? 'Avaliação' : 'Avaliações'}
                </h3>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por nota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as notas</SelectItem>
                    <SelectItem value="5">⭐ 5 estrelas</SelectItem>
                    <SelectItem value="4">⭐ 4 estrelas</SelectItem>
                    <SelectItem value="3">⭐ 3 estrelas</SelectItem>
                    <SelectItem value="2">⭐ 2 estrelas</SelectItem>
                    <SelectItem value="1">⭐ 1 estrela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {filteredReviews && filteredReviews.length > 0 ? (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <StarRating rating={review.rating} size={18} />
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(review.created_at), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{review.rating}.0</Badge>
                      </div>
                      {review.comment && (
                        <p className="text-foreground">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {ratingFilter === "all" 
                      ? "Nenhuma avaliação ainda"
                      : "Nenhuma avaliação com esta nota"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="mt-6">
            {portfolio && portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {portfolio.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={image.image_url}
                        alt={image.description || "Trabalho do barbeiro"}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                    {image.description && (
                      <CardContent className="pt-3 pb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {image.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum trabalho adicionado ainda</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
