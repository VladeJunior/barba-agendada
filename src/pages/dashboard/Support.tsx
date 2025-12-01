import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSupportConversations } from "@/hooks/useSupportConversations";
import { ConversationList } from "@/components/support/ConversationList";
import { ChatWindow } from "@/components/support/ChatWindow";
import { useShop } from "@/hooks/useShop";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

export default function Support() {
  const { data: shop } = useShop();
  const { conversations, loading, createConversation } = useSupportConversations(shop?.id);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newSubject, setNewSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleCreateConversation = async () => {
    if (!shop?.id || !newSubject.trim()) return;

    const conversation = await createConversation(shop.id, newSubject.trim());
    if (conversation) {
      setNewSubject("");
      setDialogOpen(false);
      setSelectedConversationId(conversation.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suporte</h1>
          <p className="text-muted-foreground">
            Entre em contato com nossa equipe de suporte
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Nova Conversa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Descreva o assunto da sua dúvida"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateConversation} className="w-full">
                Iniciar Conversa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="h-[600px] overflow-hidden">
        <div className="grid md:grid-cols-[350px,1fr] h-full">
          <div className="border-r flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Suas Conversas</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversationId}
                  onSelect={setSelectedConversationId}
                />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatWindow
              conversationId={selectedConversationId}
              senderRole="owner"
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
