-- Quest System Tables Migration

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    xp_reward integer NOT NULL DEFAULT 10,
    type text CHECK (type IN ('creative', 'journal', 'mindset', 'reflection', 'challenge', 'penalty')) NOT NULL,
    status text CHECK (status IN ('active', 'completed', 'expired')) DEFAULT 'active',
    progress integer DEFAULT 0,
    deadline timestamp with time zone NOT NULL,
    penalty_for_quest_id uuid REFERENCES public.quests(id),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    quest_set_id uuid REFERENCES public.quest_sets(id),
    for_date date
);

-- Create user_quest_progress table
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    quest_id uuid REFERENCES public.quests(id) NOT NULL,
    progress integer DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    UNIQUE(user_id, quest_id)
);

-- Enable RLS on quest tables
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- Quest policies
DROP POLICY IF EXISTS "Users can view own quests" ON public.quests;
CREATE POLICY "Users can view own quests"
ON public.quests FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quests" ON public.quests;
CREATE POLICY "Users can insert own quests"
ON public.quests FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quests" ON public.quests;
CREATE POLICY "Users can update own quests"
ON public.quests FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own quests" ON public.quests;
CREATE POLICY "Users can delete own quests"
ON public.quests FOR DELETE
USING (auth.uid() = user_id);

-- User quest progress policies
DROP POLICY IF EXISTS "Users can view own quest progress" ON public.user_quest_progress;
CREATE POLICY "Users can view own quest progress"
ON public.user_quest_progress FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quest progress" ON public.user_quest_progress;
CREATE POLICY "Users can insert own quest progress"
ON public.user_quest_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quest progress" ON public.user_quest_progress;
CREATE POLICY "Users can update own quest progress"
ON public.user_quest_progress FOR UPDATE
USING (auth.uid() = user_id);


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON public.quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_type ON public.quests(type);
CREATE INDEX IF NOT EXISTS idx_quests_deadline ON public.quests(deadline);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_id ON public.user_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_quest_id ON public.user_quest_progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_quests_quest_set_id ON public.quests(quest_set_id);

-- Add user_xp to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_xp integer NOT NULL DEFAULT 0;

-- Create user_levels table for XP requirements
CREATE TABLE IF NOT EXISTS public.user_levels (
    level integer PRIMARY KEY,
    xp_required integer NOT NULL
);

-- Prepopulate user_levels for levels 1-50 (example: XP curve, can be adjusted)
INSERT INTO public.user_levels (level, xp_required) VALUES
    (1, 0),
    (2, 100),
    (3, 250),
    (4, 450),
    (5, 700),
    (6, 1000),
    (7, 1350),
    (8, 1750),
    (9, 2200),
    (10, 2700),
    (11, 3250),
    (12, 3850),
    (13, 4500),
    (14, 5200),
    (15, 5950),
    (16, 6750),
    (17, 7600),
    (18, 8500),
    (19, 9450),
    (20, 10450),
    (21, 11500),
    (22, 12600),
    (23, 13750),
    (24, 14950),
    (25, 16200),
    (26, 17500),
    (27, 18850),
    (28, 20250),
    (29, 21700),
    (30, 23200),
    (31, 24750),
    (32, 26350),
    (33, 28000),
    (34, 29700),
    (35, 31450),
    (36, 33250),
    (37, 35100),
    (38, 37000),
    (39, 38950),
    (40, 40950),
    (41, 43000),
    (42, 45100),
    (43, 47250),
    (44, 49450),
    (45, 51700),
    (46, 54000),
    (47, 56350),
    (48, 58750),
    (49, 61200),
    (50, 63700)
ON CONFLICT (level) DO NOTHING;

-- Function to increment user_xp for a user
CREATE OR REPLACE FUNCTION increment_user_xp(user_id uuid, xp_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET user_xp = user_xp + xp_amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create quest_sets table for rolling quest sets
CREATE TABLE IF NOT EXISTS public.quest_sets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add for_date column to quests table
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS for_date date; 