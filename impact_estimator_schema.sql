-- =====================================================
-- IMPACT ESTIMATOR & ECO-POINTS SYSTEM SCHEMA
-- =====================================================
-- This schema extends the existing database with tables and functions
-- for tracking eco-points, environmental impact, and leaderboards

-- =====================================================
-- 1. ENHANCE STUDENTS TABLE
-- =====================================================
-- Add new columns to existing students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS total_impact_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_points_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;

-- Add index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_students_eco_points ON students(eco_points DESC);
CREATE INDEX IF NOT EXISTS idx_students_weekly_points ON students(weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_students_monthly_points ON students(monthly_points DESC);

-- =====================================================
-- 2. POINTS HISTORY TABLE
-- =====================================================
-- Track all point-earning activities for audit and analytics
CREATE TABLE IF NOT EXISTS points_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points_earned INT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quiz', 'task', 'learning_path', 'action', 'bonus')),
  activity_id TEXT, -- Reference to the specific activity
  activity_metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (quiz score, task difficulty, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their own points history" 
  ON points_history FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "System can insert points history" 
  ON points_history FOR INSERT 
  WITH CHECK (true); -- Will be called by backend with service role

-- Indexes
CREATE INDEX IF NOT EXISTS idx_points_history_student ON points_history(student_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created ON points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_activity ON points_history(activity_type, activity_id);

-- =====================================================
-- 3. IMPACT METRICS TABLE
-- =====================================================
-- Store calculated environmental impact per student
CREATE TABLE IF NOT EXISTS impact_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  co2_saved_kg DECIMAL(10,2) DEFAULT 0,
  trees_equivalent INT DEFAULT 0,
  plastic_reduced_kg DECIMAL(10,2) DEFAULT 0,
  water_saved_liters DECIMAL(10,2) DEFAULT 0,
  energy_saved_kwh DECIMAL(10,2) DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their own impact metrics" 
  ON impact_metrics FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "System can manage impact metrics" 
  ON impact_metrics FOR ALL 
  USING (true); -- Backend service role only

-- Index
CREATE INDEX IF NOT EXISTS idx_impact_metrics_student ON impact_metrics(student_id);

-- =====================================================
-- 4. ACTIVITY COMPLETIONS TABLE
-- =====================================================
-- Track completion status of various activities
CREATE TABLE IF NOT EXISTS activity_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quiz', 'task', 'learning_module', 'action')),
  activity_id TEXT NOT NULL,
  completion_data JSONB DEFAULT '{}'::jsonb, -- Quiz answers, task proof, etc.
  points_awarded INT DEFAULT 0,
  impact_contribution JSONB DEFAULT '{}'::jsonb, -- Environmental impact from this activity
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, activity_type, activity_id)
);

-- Enable RLS
ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their own completions" 
  ON activity_completions FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own completions" 
  ON activity_completions FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_completions_student ON activity_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_completions_type ON activity_completions(activity_type);

-- =====================================================
-- 5. LEADERBOARD MATERIALIZED VIEW
-- =====================================================
-- Pre-calculated rankings for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_global AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY s.eco_points DESC, s.created_at ASC) as rank,
  s.id as student_id,
  p.full_name as name,
  s.eco_points,
  s.completed_tasks,
  s.weekly_points,
  s.monthly_points,
  ud.education_level,
  ud.classroom_id,
  im.co2_saved_kg,
  im.trees_equivalent,
  im.plastic_reduced_kg,
  s.last_points_update
FROM students s
JOIN profiles p ON p.id = s.id
LEFT JOIN user_details ud ON ud.user_id = s.id
LEFT JOIN impact_metrics im ON im.student_id = s.id
WHERE s.eco_points > 0
ORDER BY s.eco_points DESC, s.created_at ASC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_global_student 
  ON leaderboard_global(student_id);

-- Create additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_rank ON leaderboard_global(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_classroom ON leaderboard_global(classroom_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_education ON leaderboard_global(education_level);

-- =====================================================
-- 6. DATABASE FUNCTIONS
-- =====================================================

-- Function to award points to a student
CREATE OR REPLACE FUNCTION award_points(
  p_student_id UUID,
  p_points INT,
  p_activity_type TEXT,
  p_activity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  new_total_points INT,
  new_rank BIGINT,
  points_awarded INT
) AS $$
DECLARE
  v_new_total INT;
  v_rank BIGINT;
BEGIN
  -- Update student's eco_points
  UPDATE students 
  SET 
    eco_points = eco_points + p_points,
    weekly_points = weekly_points + p_points,
    monthly_points = monthly_points + p_points,
    completed_tasks = CASE WHEN p_activity_type IN ('task', 'action') THEN completed_tasks + 1 ELSE completed_tasks END,
    last_points_update = NOW()
  WHERE id = p_student_id
  RETURNING eco_points INTO v_new_total;

  -- Insert into points history
  INSERT INTO points_history (student_id, points_earned, activity_type, activity_id, activity_metadata)
  VALUES (p_student_id, p_points, p_activity_type, p_activity_id, p_metadata);

  -- Get current rank
  SELECT COUNT(*) + 1 INTO v_rank
  FROM students
  WHERE eco_points > v_new_total;

  -- Return results
  RETURN QUERY SELECT v_new_total, v_rank, p_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update impact metrics
CREATE OR REPLACE FUNCTION calculate_impact_metrics(p_student_id UUID)
RETURNS TABLE(
  co2_saved DECIMAL,
  trees_equiv INT,
  plastic_reduced DECIMAL,
  water_saved DECIMAL
) AS $$
DECLARE
  v_co2 DECIMAL := 0;
  v_trees INT := 0;
  v_plastic DECIMAL := 0;
  v_water DECIMAL := 0;
BEGIN
  -- Aggregate impact from all completed activities
  SELECT 
    COALESCE(SUM((impact_contribution->>'co2_saved_kg')::DECIMAL), 0),
    COALESCE(SUM((impact_contribution->>'plastic_reduced_kg')::DECIMAL), 0),
    COALESCE(SUM((impact_contribution->>'water_saved_liters')::DECIMAL), 0)
  INTO v_co2, v_plastic, v_water
  FROM activity_completions
  WHERE student_id = p_student_id;

  -- Calculate trees equivalent (1 tree absorbs ~21 kg CO2 per year)
  v_trees := FLOOR(v_co2 / 21)::INT;

  -- Upsert impact metrics
  INSERT INTO impact_metrics (student_id, co2_saved_kg, trees_equivalent, plastic_reduced_kg, water_saved_liters, last_calculated)
  VALUES (p_student_id, v_co2, v_trees, v_plastic, v_water, NOW())
  ON CONFLICT (student_id) 
  DO UPDATE SET
    co2_saved_kg = v_co2,
    trees_equivalent = v_trees,
    plastic_reduced_kg = v_plastic,
    water_saved_liters = v_water,
    last_calculated = NOW(),
    updated_at = NOW();

  -- Return calculated metrics
  RETURN QUERY SELECT v_co2, v_trees, v_plastic, v_water;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard with filters
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_classroom_id UUID DEFAULT NULL,
  p_education_level TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  rank BIGINT,
  student_id UUID,
  name TEXT,
  eco_points INT,
  completed_tasks INT,
  education_level TEXT,
  co2_saved_kg DECIMAL,
  trees_equivalent INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.rank,
    l.student_id,
    l.name,
    l.eco_points,
    l.completed_tasks,
    l.education_level,
    l.co2_saved_kg,
    l.trees_equivalent
  FROM leaderboard_global l
  WHERE 
    (p_classroom_id IS NULL OR l.classroom_id = p_classroom_id)
    AND (p_education_level IS NULL OR l.education_level = p_education_level)
  ORDER BY l.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's rank
CREATE OR REPLACE FUNCTION get_student_rank(p_student_id UUID)
RETURNS TABLE(
  rank BIGINT,
  total_students BIGINT,
  percentile DECIMAL
) AS $$
DECLARE
  v_rank BIGINT;
  v_total BIGINT;
  v_percentile DECIMAL;
BEGIN
  -- Get rank from materialized view
  SELECT l.rank INTO v_rank
  FROM leaderboard_global l
  WHERE l.student_id = p_student_id;

  -- Get total students
  SELECT COUNT(*) INTO v_total FROM students WHERE eco_points > 0;

  -- Calculate percentile
  v_percentile := CASE 
    WHEN v_total > 0 THEN ROUND((1 - (v_rank::DECIMAL / v_total)) * 100, 2)
    ELSE 0
  END;

  RETURN QUERY SELECT v_rank, v_total, v_percentile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to refresh leaderboard after points update
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh materialized view concurrently (non-blocking)
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_global;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (fires after points update)
DROP TRIGGER IF EXISTS trigger_refresh_leaderboard ON students;
CREATE TRIGGER trigger_refresh_leaderboard
  AFTER UPDATE OF eco_points ON students
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_leaderboard();

-- Trigger to reset weekly/monthly points
CREATE OR REPLACE FUNCTION reset_periodic_points()
RETURNS void AS $$
BEGIN
  -- Reset weekly points (run this via cron every Monday)
  UPDATE students SET weekly_points = 0;
  
  -- Reset monthly points (run this via cron on 1st of month)
  -- UPDATE students SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. INITIAL DATA SETUP
-- =====================================================

-- Create impact metrics entries for existing students
INSERT INTO impact_metrics (student_id, co2_saved_kg, trees_equivalent, plastic_reduced_kg, water_saved_liters)
SELECT id, 0, 0, 0, 0
FROM students
ON CONFLICT (student_id) DO NOTHING;

-- Initial refresh of leaderboard
REFRESH MATERIALIZED VIEW leaderboard_global;

-- =====================================================
-- 9. HELPER VIEWS
-- =====================================================

-- View for recent point activities
CREATE OR REPLACE VIEW recent_point_activities AS
SELECT 
  ph.id,
  ph.student_id,
  p.full_name as student_name,
  ph.points_earned,
  ph.activity_type,
  ph.activity_metadata,
  ph.created_at
FROM points_history ph
JOIN profiles p ON p.id = ph.student_id
ORDER BY ph.created_at DESC
LIMIT 100;

-- View for top performers this week
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY s.weekly_points DESC) as rank,
  s.id as student_id,
  p.full_name as name,
  s.weekly_points as points,
  ud.education_level
FROM students s
JOIN profiles p ON p.id = s.id
LEFT JOIN user_details ud ON ud.user_id = s.id
WHERE s.weekly_points > 0
ORDER BY s.weekly_points DESC
LIMIT 50;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Run this schema after the base supabase_schema.sql and phase2_schema.sql
-- 2. The leaderboard materialized view refreshes automatically on points update
-- 3. Set up cron jobs to reset weekly/monthly points:
--    - Weekly: SELECT reset_periodic_points(); (every Monday)
--    - Monthly: UPDATE students SET monthly_points = 0; (1st of month)
-- 4. For better performance with large datasets, consider partitioning points_history by date
