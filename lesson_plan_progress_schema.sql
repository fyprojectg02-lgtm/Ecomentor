-- =====================================================
-- LESSON PLAN PROGRESS TABLE (for students)
-- =====================================================
CREATE TABLE IF NOT EXISTS lesson_plan_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE CASCADE NOT NULL,
  completed_activities INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of completed activity indices
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  points_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_plan_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lesson_plan_progress_student ON lesson_plan_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_progress_plan ON lesson_plan_progress(lesson_plan_id);

-- Enable RLS
ALTER TABLE lesson_plan_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_plan_progress
CREATE POLICY "Students can view their own lesson plan progress"
  ON lesson_plan_progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own lesson plan progress"
  ON lesson_plan_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own lesson plan progress"
  ON lesson_plan_progress FOR UPDATE
  USING (auth.uid() = student_id);

-- Trigger to update updated_at
CREATE TRIGGER update_lesson_plan_progress_updated_at
  BEFORE UPDATE ON lesson_plan_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get student's lesson plan progress summary
CREATE OR REPLACE FUNCTION get_student_lesson_progress(p_student_id UUID)
RETURNS TABLE (
  total_lesson_plans BIGINT,
  completed_lesson_plans BIGINT,
  in_progress_lesson_plans BIGINT,
  total_points_earned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_lesson_plans,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_lesson_plans,
    COUNT(*) FILTER (WHERE completed_at IS NULL AND progress_percentage > 0) as in_progress_lesson_plans,
    COALESCE(SUM(points_earned), 0)::INTEGER as total_points_earned
  FROM lesson_plan_progress
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
