-- Create enum for conversation status
CREATE TYPE conversation_status AS ENUM ('open', 'pending', 'closed');

-- Create support_conversations table
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status conversation_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('owner', 'admin')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_conversations
CREATE POLICY "Shop owners can view their own conversations"
  ON public.support_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = support_conversations.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can create conversations"
  ON public.support_conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = support_conversations.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admin can view all conversations"
  ON public.support_conversations
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can update all conversations"
  ON public.support_conversations
  FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations sc
      JOIN public.shops s ON s.id = sc.shop_id
      WHERE sc.id = support_messages.conversation_id
      AND (s.owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_conversations sc
      JOIN public.shops s ON s.id = sc.shop_id
      WHERE sc.id = support_messages.conversation_id
      AND (s.owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.support_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations sc
      JOIN public.shops s ON s.id = sc.shop_id
      WHERE sc.id = support_messages.conversation_id
      AND (s.owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_support_conversations_shop_id ON public.support_conversations(shop_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);

-- Create trigger to update updated_at
CREATE TRIGGER update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;