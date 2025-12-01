import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { SupportConversation } from "@/hooks/useSupportConversations";

interface ConversationListProps {
  conversations: SupportConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showShopName?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  showShopName = false,
}: ConversationListProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      open: "default",
      pending: "secondary",
      closed: "outline",
    } as const;

    const labels = {
      open: "Aberta",
      pending: "Pendente",
      closed: "Fechada",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {conversations.map((conversation) => (
          <Button
            key={conversation.id}
            variant="ghost"
            className={cn(
              "w-full justify-start text-left h-auto p-4",
              selectedId === conversation.id && "bg-muted"
            )}
            onClick={() => onSelect(conversation.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium truncate">{conversation.subject}</p>
                {getStatusBadge(conversation.status)}
              </div>
              {showShopName && conversation.shops && (
                <p className="text-sm text-muted-foreground truncate mb-1">
                  {conversation.shops.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {format(new Date(conversation.last_message_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
