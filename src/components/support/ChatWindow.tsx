import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useSupportMessages } from "@/hooks/useSupportMessages";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface ChatWindowProps {
  conversationId: string | null;
  senderRole: "owner" | "admin";
  currentUserId: string;
}

export function ChatWindow({
  conversationId,
  senderRole,
  currentUserId,
}: ChatWindowProps) {
  const { messages, loading, sendMessage } = useSupportMessages(conversationId, currentUserId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;
    await sendMessage(conversationId, content, senderRole);
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Selecione uma conversa</p>
        <p className="text-sm text-muted-foreground">
          Escolha uma conversa ao lado para começar
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full p-6 space-y-4">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-16 w-2/3 ml-auto" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                senderRole={message.sender_role}
                createdAt={message.created_at}
                isCurrentUser={message.sender_id === currentUserId}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="border-t p-4">
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
