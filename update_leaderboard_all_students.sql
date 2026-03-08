-- =====================================================
-- LEADERBOARD UPDATE: SHOW ALL STUDENTS
-- =====================================================
-- This script updates the leaderboard views and functions 
-- to include students with 0 points.

-- 1. DROP AND RECREATE GLOBAL LEADERBOARD MATERIALIZED VIEW
DROP MATERIALIZED VIEW IF EXISTS leaderboard_global CASCADE;

CREATE MATERIALIZED VIEW leaderboard_global AS
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
ORDER BY s.eco_points DESC, s.created_at ASC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_global_student 
  ON leaderboard_global(student_id);

-- Create additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_rank ON leaderboard_global(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_classroom ON leaderboard_global(classroom_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_education ON leaderboard_global(education_level);

-- 2. RECREATE STUDENT RANK FUNCTION
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

  -- Get total students (including those with 0 points)
  SELECT COUNT(*) INTO v_total FROM students;

  -- Calculate percentile
  v_percentile := CASE 
    WHEN v_total > 0 THEN ROUND((1 - (v_rank::DECIMAL / v_total)) * 100, 2)
    ELSE 0
  END;

  RETURN QUERY SELECT v_rank, v_total, v_percentile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DROP AND RECREATE WEEKLY LEADERBOARD VIEW
DROP VIEW IF EXISTS weekly_leaderboard;

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
ORDER BY s.weekly_points DESC
LIMIT 50;

-- 4. FINAL REFRESH
REFRESH MATERIALIZED VIEW leaderboard_global;
