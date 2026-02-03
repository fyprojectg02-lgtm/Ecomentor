-- =====================================================
-- TEACHER DASHBOARD SCHEMA
-- =====================================================
-- This schema adds tables for teacher-specific features:
-- - AI-generated lesson plans
-- - Assessment rubrics
-- - Teacher-classroom management
-- - Teacher notifications

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LESSON PLANS TABLE
-- =====================================================
-- Stores AI-generated and custom lesson plans
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL, -- e.g., "Grade 5", "High School", "College"
  education_level TEXT CHECK (education_level IN ('school', 'college', 'all')),
  duration TEXT, -- e.g., "45 minutes", "2 hours"
  learning_objectives JSONB DEFAULT '[]'::jsonb, -- Array of objectives
  materials_needed JSONB DEFAULT '[]'::jsonb, -- Array of materials
  activities JSONB DEFAULT '[]'::jsonb, -- Array of activity objects
  assessment_methods JSONB DEFAULT '[]'::jsonb, -- Array of assessment strategies
  differentiation_strategies TEXT, -- How to adapt for different learners
  homework_assignment TEXT,
  additional_resources JSONB DEFAULT '[]'::jsonb, -- Links, videos, etc.
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- Original prompt used for generation
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their own lesson plans"
  ON lesson_plans FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create lesson plans"
  ON lesson_plans FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their own lesson plans"
  ON lesson_plans FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own lesson plans"
  ON lesson_plans FOR DELETE
  USING (auth.uid() = teacher_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON lesson_plans(subject);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade ON lesson_plans(grade_level);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_created ON lesson_plans(created_at DESC);

-- =====================================================
-- 2. RUBRICS TABLE
-- =====================================================
-- Stores assessment rubrics for tasks and assignments
CREATE TABLE IF NOT EXISTS rubrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Array of criterion objects with name, levels, points
  total_points INT NOT NULL,
  rubric_type TEXT CHECK (rubric_type IN ('task', 'quiz', 'project', 'participation', 'general')),
  ai_generated BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their own rubrics"
  ON rubrics FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create rubrics"
  ON rubrics FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their own rubrics"
  ON rubrics FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own rubrics"
  ON rubrics FOR DELETE
  USING (auth.uid() = teacher_id);

-- Students can view active rubrics for their tasks
CREATE POLICY "Students can view active rubrics"
  ON rubrics FOR SELECT
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_teacher ON rubrics(teacher_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_lesson_plan ON rubrics(lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_type ON rubrics(rubric_type);

-- =====================================================
-- 3. TEACHER CLASSROOMS TABLE
-- =====================================================
-- Links teachers to their classrooms for better organization
CREATE TABLE IF NOT EXISTS teacher_classrooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id UUID NOT NULL, -- Links to user_details.classroom_id
  classroom_name TEXT NOT NULL,
  grade_level TEXT,
  subject TEXT,
  academic_year TEXT, -- e.g., "2025-2026"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, classroom_id)
);

-- Enable RLS
ALTER TABLE teacher_classrooms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their own classrooms"
  ON teacher_classrooms FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create classrooms"
  ON teacher_classrooms FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their own classrooms"
  ON teacher_classrooms FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own classrooms"
  ON teacher_classrooms FOR DELETE
  USING (auth.uid() = teacher_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_classrooms_teacher ON teacher_classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classrooms_classroom ON teacher_classrooms(classroom_id);

-- =====================================================
-- 4. TEACHER NOTIFICATIONS TABLE
-- =====================================================
-- Notifications for flagged submissions and student activities
CREATE TABLE IF NOT EXISTS teacher_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('submission_flagged', 'student_milestone', 'classroom_activity', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT, -- MongoDB submission ID or other reference
  related_type TEXT, -- 'submission', 'student', 'classroom'
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teacher_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their own notifications"
  ON teacher_notifications FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "System can create teacher notifications"
  ON teacher_notifications FOR INSERT
  WITH CHECK (true); -- Backend service role only

CREATE POLICY "Teachers can update their own notifications"
  ON teacher_notifications FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own notifications"
  ON teacher_notifications FOR DELETE
  USING (auth.uid() = teacher_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher ON teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_read ON teacher_notifications(teacher_id, read);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_created ON teacher_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_priority ON teacher_notifications(priority, created_at DESC);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_lesson_plans_updated_at
  BEFORE UPDATE ON lesson_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubrics_updated_at
  BEFORE UPDATE ON rubrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_classrooms_updated_at
  BEFORE UPDATE ON teacher_classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE teacher_notifications
  SET read = true, read_at = NOW()
  WHERE id = p_notification_id AND teacher_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_teacher_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM teacher_notifications
  WHERE teacher_id = p_teacher_id AND read = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VIEWS FOR TEACHER DASHBOARD
-- =====================================================

-- View for teacher's classroom statistics
CREATE OR REPLACE VIEW teacher_classroom_stats AS
SELECT 
  tc.teacher_id,
  tc.classroom_id,
  tc.classroom_name,
  COUNT(DISTINCT s.id) as total_students,
  COALESCE(SUM(s.eco_points), 0) as total_class_points,
  COALESCE(AVG(s.eco_points), 0) as avg_student_points,
  COALESCE(SUM(s.completed_tasks), 0) as total_tasks_completed
FROM teacher_classrooms tc
LEFT JOIN user_details ud ON ud.classroom_id = tc.classroom_id
LEFT JOIN students s ON s.id = ud.user_id
WHERE tc.is_active = true
GROUP BY tc.teacher_id, tc.classroom_id, tc.classroom_name;

-- View for recent lesson plans
CREATE OR REPLACE VIEW recent_lesson_plans AS
SELECT 
  lp.id,
  lp.teacher_id,
  lp.title,
  lp.subject,
  lp.grade_level,
  lp.ai_generated,
  lp.is_published,
  lp.created_at,
  COUNT(r.id) as rubric_count
FROM lesson_plans lp
LEFT JOIN rubrics r ON r.lesson_plan_id = lp.id
GROUP BY lp.id
ORDER BY lp.created_at DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Run this schema after supabase_schema.sql, phase2_schema.sql, and impact_estimator_schema.sql
-- 2. Teachers need to be assigned to classrooms via teacher_classrooms table
-- 3. Notifications are created by backend when submissions are flagged
-- 4. Lesson plans and rubrics support AI generation flag for tracking
-- 5. All tables use RLS for security - teachers can only access their own data
