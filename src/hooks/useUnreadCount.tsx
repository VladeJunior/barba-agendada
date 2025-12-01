import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadCount(shopId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  const fetchUnreadCount = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let query = supabase
        .from("support_messages")
        .select("id, conversation_id", { count: "exact", head: false })
        .eq("is_read", false);

      // For shop owners, only count messages in their conversations
      if (shopId) {
        const { data: conversations } = await supabase
          .from("support_conversations")
          .select("id")
          .eq("shop_id", shopId);

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map((c) => c.id);
          query = query.in("conversation_id", conversationIds);
        }
      }

      // Exclude messages sent by the current user
      query = query.neq("sender_id", userData.user.id);

      const { count, error } = await query;

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    }
  };

  return { unreadCount, refetch: fetchUnreadCount };
}
