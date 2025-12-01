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
import { Plus, Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

export default function Support() {
  const { data: shop } = useShop();
  const { conversations, loading, createConversation } = useSupportConversations(shop?.id);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newSubject, setNewSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { preferences, toggleSound, toggleBrowser } = useNotificationPreferences();
  const { requestPermission, permission } = useBrowserNotification();

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

  const handleBrowserToggle = async () => {
    if (!preferences.browserEnabled && permission !== "granted") {
      const granted = await requestPermission();
      if (granted) {
        toggleBrowser();
      }
    } else {
      toggleBrowser();
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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                {preferences.soundEnabled || preferences.browserEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium mb-3">Notificações</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {preferences.soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="sound-toggle-owner" className="text-sm cursor-pointer">
                      Som
                    </Label>
                  </div>
                  <Switch
                    id="sound-toggle-owner"
                    checked={preferences.soundEnabled}
                    onCheckedChange={toggleSound}
                  />
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {preferences.browserEnabled ? (
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="browser-toggle-owner" className="text-sm cursor-pointer">
                      Navegador
                    </Label>
                  </div>
                  <Switch
                    id="browser-toggle-owner"
                    checked={preferences.browserEnabled}
                    onCheckedChange={handleBrowserToggle}
                  />
                </div>
                
                {permission === "denied" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Notificações bloqueadas pelo navegador
                  </p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
