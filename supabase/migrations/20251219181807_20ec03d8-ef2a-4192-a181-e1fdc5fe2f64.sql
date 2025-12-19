-- Criar tabela bot_sessions para gerenciar estado da conversa
CREATE TABLE public.bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'welcome',
  temp_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  UNIQUE(shop_id, phone)
);

-- Índice para busca rápida
CREATE INDEX idx_bot_sessions_shop_phone ON bot_sessions(shop_id, phone);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_bot_sessions_updated_at
  BEFORE UPDATE ON bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Apenas service role pode acessar (edge function usa service role)
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON bot_sessions
  FOR ALL
  USING (false);