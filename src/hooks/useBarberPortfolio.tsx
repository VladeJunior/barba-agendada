import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BarberPortfolioImage {
  id: string;
  barber_id: string;
  image_url: string;
  description: string | null;
  created_at: string;
}

export function useBarberPortfolio(barberId: string | undefined) {
  return useQuery({
    queryKey: ["barber-portfolio", barberId],
    queryFn: async () => {
      if (!barberId) return [];

      const { data, error } = await supabase
        .from("barber_portfolio")
        .select("*")
        .eq("barber_id", barberId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BarberPortfolioImage[];
    },
    enabled: !!barberId,
  });
}

export function useUploadPortfolioImage(barberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, description }: { file: File; description?: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${barberId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("barber-portfolio")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("barber-portfolio")
        .getPublicUrl(fileName);

      const { data, error: insertError } = await supabase
        .from("barber_portfolio")
        .insert({
          barber_id: barberId,
          image_url: publicUrl,
          description,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-portfolio", barberId] });
      toast.success("Imagem adicionada ao portfólio!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar imagem: " + error.message);
    },
  });
}

export function useDeletePortfolioImage(barberId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("barber_portfolio")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-portfolio", barberId] });
      toast.success("Imagem removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover imagem: " + error.message);
    },
  });
}
