import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessageProps {
  content: string;
  senderRole: "owner" | "admin";
  createdAt: string;
  isCurrentUser: boolean;
}

export function ChatMessage({
  content,
  senderRole,
  createdAt,
  isCurrentUser,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex mb-4",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div
          className={cn(
            "text-xs mt-1 flex items-center gap-2",
            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span className="capitalize">
            {senderRole === "admin" ? "Suporte" : "Você"}
          </span>
          <span>•</span>
          <span>
            {format(new Date(createdAt), "HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}
