-- =====================================================
-- NGO OPPORTUNITIES SCHEMA
-- =====================================================
-- This schema adds tables for NGO opportunities that teachers can create
-- and students can view and apply to

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. NGO OPPORTUNITIES TABLE
-- =====================================================
-- Stores NGO opportunities created by teachers
CREATE TABLE IF NOT EXISTS ngo_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  ngo_name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL, -- e.g., "3 months", "2 weeks"
  min_points INT NOT NULL DEFAULT 0, -- Minimum EcoPoints required
  location TEXT NOT NULL, -- e.g., "Remote", "National Parks"
  type TEXT NOT NULL CHECK (type IN ('Internship', 'Volunteer', 'Ambassador', 'Training')),
  spots INT NOT NULL DEFAULT 1, -- Number of available spots
  category TEXT NOT NULL, -- e.g., "Climate Action", "Wildlife"
  perks JSONB DEFAULT '[]'::jsonb, -- Array of perks like ["Certificate", "Mentorship"]
  deadline DATE NOT NULL, -- Application deadline
  is_active BOOLEAN DEFAULT true, -- Whether the opportunity is still available
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ngo_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view active opportunities
CREATE POLICY "Everyone can view active opportunities"
  ON ngo_opportunities FOR SELECT
  USING (is_active = true);

-- Teachers can view all opportunities (including their own inactive ones)
CREATE POLICY "Teachers can view all opportunities"
  ON ngo_opportunities FOR SELECT
  USING (
    is_active = true OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    )
  );

-- Teachers can create opportunities
CREATE POLICY "Teachers can create opportunities"
  ON ngo_opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    )
    AND teacher_id = auth.uid()
  );

-- Teachers can update their own opportunities
CREATE POLICY "Teachers can update their own opportunities"
  ON ngo_opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    )
    AND teacher_id = auth.uid()
  );

-- Teachers can delete their own opportunities
CREATE POLICY "Teachers can delete their own opportunities"
  ON ngo_opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    )
    AND teacher_id = auth.uid()
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ngo_opportunities_teacher ON ngo_opportunities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ngo_opportunities_active ON ngo_opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_ngo_opportunities_type ON ngo_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_ngo_opportunities_category ON ngo_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_ngo_opportunities_deadline ON ngo_opportunities(deadline);

-- =====================================================
-- 2. OPPORTUNITY APPLICATIONS TABLE
-- =====================================================
-- Stores student applications to NGO opportunities
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES ngo_opportunities(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  application_message TEXT, -- Optional message from student
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, opportunity_id) -- Prevent duplicate applications
);

-- Enable RLS
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Students can view their own applications
CREATE POLICY "Students can view their own applications"
  ON opportunity_applications FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can view applications for their opportunities
CREATE POLICY "Teachers can view applications for their opportunities"
  ON opportunity_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ngo_opportunities 
      WHERE id = opportunity_applications.opportunity_id 
      AND teacher_id = auth.uid()
    )
  );

-- Students can create applications
CREATE POLICY "Students can create applications"
  ON opportunity_applications FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'student'
    )
  );

-- Students can update their own applications (e.g., withdraw)
CREATE POLICY "Students can update their own applications"
  ON opportunity_applications FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can update applications for their opportunities
CREATE POLICY "Teachers can update applications for their opportunities"
  ON opportunity_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ngo_opportunities 
      WHERE id = opportunity_applications.opportunity_id 
      AND teacher_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunity_applications_student ON opportunity_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_applications_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_applications_status ON opportunity_applications(status);

