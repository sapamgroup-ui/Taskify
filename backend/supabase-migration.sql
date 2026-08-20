-- New columns for profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_photos TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_video_url TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_video_file TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_categories TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0;

-- COMMENTS TABLE (Facebook Marketplace style, replaces questions)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PREMIUM SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','per_reply','basic','premium')),
  replies_used INT DEFAULT 0,
  replies_limit INT DEFAULT 1,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Task type column (need_help or offering_help)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'need_help' CHECK (task_type IN ('need_help','offering_help'));

-- Post limit for subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS posts_used INT DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS posts_limit INT DEFAULT 2;

-- Verification system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none','pending','approved','rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_doc1 TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_doc2 TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT DEFAULT '';

-- VERIFICATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  doc1_url TEXT NOT NULL,
  doc2_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT DEFAULT '',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vr_select_own" ON verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vr_insert_own" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vr_admin_all" ON verification_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
