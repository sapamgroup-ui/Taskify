-- ============================================================
-- AllTasker Marketplace Schema (Supabase/PostgreSQL)
-- Replaces MongoDB/Mongoose with PostgreSQL via Supabase
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location JSONB DEFAULT '{}',
  role TEXT DEFAULT 'both' CHECK (role IN ('poster','tasker','both','admin')),
  skills TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  earning NUMERIC(12,2) DEFAULT 0,
  spent NUMERIC(12,2) DEFAULT 0,
  upi_id TEXT DEFAULT '',
  bank_details JSONB DEFAULT '{}',
  is_business BOOLEAN DEFAULT false,
  business_name TEXT DEFAULT '',
  business_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID REFERENCES profiles(id) NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min NUMERIC(10,2) NOT NULL,
  budget_max NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  location_address TEXT DEFAULT '',
  location_city TEXT DEFAULT '',
  location_state TEXT DEFAULT '',
  location_pincode TEXT DEFAULT '',
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  scheduled_date TIMESTAMPTZ,
  scheduled_time TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','cancelled','disputed')),
  tags TEXT[] DEFAULT '{}',
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal','urgent','very_urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- OFFERS TABLE
-- ============================================================
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tasker_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  message TEXT DEFAULT '',
  estimated_time TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  response TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  reported_user_id UUID REFERENCES profiles(id),
  task_id UUID REFERENCES tasks(id),
  reason TEXT NOT NULL CHECK (reason IN ('spam','fraud','inappropriate','harassment','fake_profile','payment_issue','other')),
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  payer_id UUID REFERENCES profiles(id) NOT NULL,
  payee_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT DEFAULT '',
  razorpay_payment_id TEXT DEFAULT '',
  razorpay_signature TEXT DEFAULT '',
  upi_id TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'upi' CHECK (payment_method IN ('upi','gpay','card','netbanking')),
  status TEXT DEFAULT 'created' CHECK (status IN ('created','captured','refunded','failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tasks_poster_id ON tasks(poster_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_category_status ON tasks(category, status);
CREATE INDEX idx_tasks_location_city ON tasks(location_city);

CREATE INDEX idx_offers_task_id ON offers(task_id);
CREATE INDEX idx_offers_tasker_id ON offers(tasker_id);

CREATE INDEX idx_questions_task_id ON questions(task_id);

CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);

CREATE INDEX idx_reports_status ON reports(status);

CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_payee_id ON payments(payee_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to tasks
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Update profile rating from reviews
-- ============================================================
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  review_count INT;
BEGIN
  -- Calculate new average rating and review count for the reviewee
  SELECT
    COALESCE(AVG(rating), 0)::NUMERIC(3,2),
    COUNT(*)::INT
  INTO avg_rating, review_count
  FROM reviews
  WHERE reviewee_id = NEW.reviewee_id;

  -- Update the profile
  UPDATE profiles
  SET rating = avg_rating,
      total_reviews = review_count
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update rating on new review
CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- Trigger to auto-update rating on review update
CREATE TRIGGER on_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- Trigger to auto-update rating on review delete
CREATE TRIGGER on_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (auth.uid() = poster_id);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (auth.uid() = poster_id);

-- Offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select" ON offers
  FOR SELECT USING (true);

CREATE POLICY "offers_insert" ON offers
  FOR INSERT WITH CHECK (auth.uid() = tasker_id);

CREATE POLICY "offers_update" ON offers
  FOR UPDATE USING (auth.uid() = tasker_id);

-- Questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select" ON questions
  FOR SELECT USING (true);

CREATE POLICY "questions_insert" ON questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "questions_update" ON questions
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "reviews_delete" ON reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select" ON reports
  FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_update" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
