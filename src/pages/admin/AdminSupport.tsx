import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupportConversations } from "@/hooks/useSupportConversations";
import { ConversationList } from "@/components/support/ConversationList";
import { ChatWindow } from "@/components/support/ChatWindow";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSupport() {
  const { conversations, loading, updateStatus } = useSupportConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "closed">("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "all") return true;
    return conv.status === filter;
  });

  const handleStatusChange = async (status: "open" | "pending" | "closed") => {
    if (selectedConversationId) {
      await updateStatus(selectedConversationId, status);
    }
  };

  const getStatusCounts = () => {
    return {
      open: conversations.filter((c) => c.status === "open").length,
      pending: conversations.filter((c) => c.status === "pending").length,
      closed: conversations.filter((c) => c.status === "closed").length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">
          Gerencie conversas de suporte com proprietários de barbearias
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.open}</p>
              <p className="text-sm text-muted-foreground">Abertas</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.pending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-500/10">
              <XCircle className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.closed}</p>
              <p className="text-sm text-muted-foreground">Fechadas</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="h-[600px] overflow-hidden">
        <div className="grid md:grid-cols-[350px,1fr] h-full">
          <div className="border-r flex flex-col">
            <div className="p-4 border-b">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="open">Abertas</TabsTrigger>
                  <TabsTrigger value="pending">Pendentes</TabsTrigger>
                  <TabsTrigger value="closed">Fechadas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedId={selectedConversationId}
                  onSelect={setSelectedConversationId}
                  showShopName
                />
              )}
            </div>
          </div>

          <div className="flex flex-col h-full">
            {selectedConversation && (
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedConversation.subject}</h3>
                  {selectedConversation.shops && (
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.shops.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedConversation.status === "open" ? "default" : "outline"}
                    onClick={() => handleStatusChange("open")}
                  >
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedConversation.status === "pending" ? "default" : "outline"}
                    onClick={() => handleStatusChange("pending")}
                  >
                    Pendente
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedConversation.status === "closed" ? "default" : "outline"}
                    onClick={() => handleStatusChange("closed")}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversationId={selectedConversationId}
                senderRole="admin"
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
