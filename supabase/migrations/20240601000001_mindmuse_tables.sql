-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    content text NOT NULL,
    feedback text,
    feedback_given boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Create ideas table (Idea Vault)
CREATE TABLE IF NOT EXISTS public.ideas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    title text NOT NULL,
    description text,
    tags text[],
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_text text NOT NULL,
    category text,
    difficulty text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    active boolean DEFAULT true
);

-- Create user_prompts table to track which prompts users have completed
CREATE TABLE IF NOT EXISTS public.user_prompts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    prompt_id uuid REFERENCES public.prompts(id) NOT NULL,
    completed boolean DEFAULT false,
    response text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    UNIQUE(user_id, prompt_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text,
    plan_name text,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Add RLS policies for all tables
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Journal entries policies
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
CREATE POLICY "Users can view own journal entries"
ON public.journal_entries FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
CREATE POLICY "Users can insert own journal entries"
ON public.journal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update own journal entries"
ON public.journal_entries FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;
CREATE POLICY "Users can delete own journal entries"
ON public.journal_entries FOR DELETE
USING (auth.uid() = user_id);

-- Ideas policies
DROP POLICY IF EXISTS "Users can view own ideas" ON public.ideas;
CREATE POLICY "Users can view own ideas"
ON public.ideas FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ideas" ON public.ideas;
CREATE POLICY "Users can insert own ideas"
ON public.ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ideas" ON public.ideas;
CREATE POLICY "Users can update own ideas"
ON public.ideas FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own ideas" ON public.ideas;
CREATE POLICY "Users can delete own ideas"
ON public.ideas FOR DELETE
USING (auth.uid() = user_id);

-- Prompts policies (all users can view prompts)
DROP POLICY IF EXISTS "All users can view prompts" ON public.prompts;
CREATE POLICY "All users can view prompts"
ON public.prompts FOR SELECT
USING (true);

-- User prompts policies
DROP POLICY IF EXISTS "Users can view own prompt responses" ON public.user_prompts;
CREATE POLICY "Users can view own prompt responses"
ON public.user_prompts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prompt responses" ON public.user_prompts;
CREATE POLICY "Users can insert own prompt responses"
ON public.user_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prompt responses" ON public.user_prompts;
CREATE POLICY "Users can update own prompt responses"
ON public.user_prompts FOR UPDATE
USING (auth.uid() = user_id);

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Enable realtime for all tables
alter publication supabase_realtime add table journal_entries;
alter publication supabase_realtime add table ideas;
alter publication supabase_realtime add table prompts;
alter publication supabase_realtime add table user_prompts;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table subscriptions;
