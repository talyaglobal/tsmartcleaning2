-- Messages/Conversations System
-- Idempotent creation for safe re-runs

-- Conversations table (threads between users)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  participant_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count_participant_1 INTEGER DEFAULT 0,
  unread_count_participant_2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_participants UNIQUE (participant_1_id, participant_2_id),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  -- Conversations: users can view conversations they're part of, admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Users can view own conversations'
  ) THEN
    CREATE POLICY "Users can view own conversations"
      ON public.conversations FOR SELECT
      USING (
        participant_1_id = auth.uid() OR 
        participant_2_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin','team'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Service can manage conversations'
  ) THEN
    CREATE POLICY "Service can manage conversations"
      ON public.conversations FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Messages: users can view messages in their conversations, admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can view own messages'
  ) THEN
    CREATE POLICY "Users can view own messages"
      ON public.messages FOR SELECT
      USING (
        sender_id = auth.uid() OR 
        recipient_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.conversations c 
          WHERE c.id = messages.conversation_id 
          AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin','team'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can send messages'
  ) THEN
    CREATE POLICY "Users can send messages"
      ON public.messages FOR INSERT
      WITH CHECK (sender_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Service can manage messages'
  ) THEN
    CREATE POLICY "Service can manage messages"
      ON public.messages FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
    CREATE TRIGGER update_conversations_updated_at
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Function to update conversation when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    unread_count_participant_1 = CASE 
      WHEN NEW.recipient_id = participant_1_id THEN unread_count_participant_1 + 1
      ELSE unread_count_participant_1
    END,
    unread_count_participant_2 = CASE 
      WHEN NEW.recipient_id = participant_2_id THEN unread_count_participant_2 + 1
      ELSE unread_count_participant_2
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_conversation_on_message') THEN
    CREATE TRIGGER trigger_update_conversation_on_message
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();
  END IF;
END$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET is_read = true, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND recipient_id = p_user_id
    AND is_read = false;
  
  -- Reset unread count
  UPDATE public.conversations
  SET 
    unread_count_participant_1 = CASE 
      WHEN participant_1_id = p_user_id THEN 0
      ELSE unread_count_participant_1
    END,
    unread_count_participant_2 = CASE 
      WHEN participant_2_id = p_user_id THEN 0
      ELSE unread_count_participant_2
    END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

