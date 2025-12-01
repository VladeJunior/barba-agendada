import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface SupportConversation {
  id: string;
  shop_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
  updated_at: string;
  last_message_at: string;
  shops?: {
    name: string;
  };
}

export function useSupportConversations(shopId?: string) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("support-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_conversations",
          ...(shopId && { filter: `shop_id=eq.${shopId}` }),
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  const fetchConversations = async () => {
    try {
      let query = supabase
        .from("support_conversations")
        .select("*, shops(name)")
        .order("last_message_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar conversas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (shopId: string, subject: string) => {
    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .insert({ shop_id: shopId, subject })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conversa criada",
        description: "Sua conversa de suporte foi iniciada.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao criar conversa",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStatus = async (conversationId: string, status: "open" | "pending" | "closed") => {
    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status })
        .eq("id", conversationId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Conversa marcada como ${status === "open" ? "aberta" : status === "pending" ? "pendente" : "fechada"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    conversations,
    loading,
    createConversation,
    updateStatus,
    refetch: fetchConversations,
  };
}
