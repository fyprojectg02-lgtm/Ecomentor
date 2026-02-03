-- =====================================================
-- PHASE 2: DIFFERENTIATED STUDENT EXPERIENCE SCHEMA
-- =====================================================
-- This file extends the base supabase_schema.sql with tables
-- for personalized learning paths and task recommendations

-- Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. LEARNING PATHS TABLE
-- =====================================================
-- Stores curated and AI-generated learning paths
create table learning_paths (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  education_level text check (education_level in ('school', 'college', 'all')),
  min_grade int check (min_grade >= 1 and min_grade <= 12), -- null for college
  max_grade int check (max_grade >= 1 and max_grade <= 12), -- null for college
  modules jsonb default '[]'::jsonb, -- array of module objects
  estimated_duration text, -- e.g., "4 weeks", "2 months"
  total_points int default 0,
  tags jsonb default '[]'::jsonb, -- e.g., ["climate", "energy"]
  is_active boolean default true,
  created_by uuid references profiles(id) on delete set null, -- admin or AI-generated
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table learning_paths enable row level security;

-- Policies
create policy "Learning paths are viewable by everyone" 
  on learning_paths for select using (is_active = true);

create policy "Admins can insert learning paths" 
  on learning_paths for insert 
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'administrator')
  );

create policy "Admins can update learning paths" 
  on learning_paths for update 
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'administrator')
  );

-- Index for faster queries
create index idx_learning_paths_education_level on learning_paths(education_level);
create index idx_learning_paths_difficulty on learning_paths(difficulty);

-- =====================================================
-- 2. STUDENT LEARNING PROGRESS TABLE
-- =====================================================
-- Tracks individual student progress through learning paths
create table student_learning_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  learning_path_id uuid references learning_paths(id) on delete cascade not null,
  progress_percentage int default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  current_module int default 0,
  completed_modules jsonb default '[]'::jsonb, -- array of completed module indices
  points_earned int default 0,
  started_at timestamp with time zone default now(),
  last_activity timestamp with time zone default now(),
  completed_at timestamp with time zone,
  unique(student_id, learning_path_id)
);

-- Enable RLS
alter table student_learning_progress enable row level security;

-- Policies
create policy "Students can view their own progress" 
  on student_learning_progress for select 
  using (auth.uid() = student_id);

create policy "Students can insert their own progress" 
  on student_learning_progress for insert 
  with check (auth.uid() = student_id);

create policy "Students can update their own progress" 
  on student_learning_progress for update 
  using (auth.uid() = student_id);

create policy "Teachers can view their students' progress" 
  on student_learning_progress for select 
  using (
    exists (
      select 1 from profiles p
      join user_details ud on ud.user_id = student_learning_progress.student_id
      where p.id = auth.uid() 
      and p.role = 'teacher'
      and ud.classroom_id is not null
    )
  );

-- Index for faster queries
create index idx_student_progress_student on student_learning_progress(student_id);
create index idx_student_progress_path on student_learning_progress(learning_path_id);

-- =====================================================
-- 3. RECOMMENDED TASKS TABLE
-- =====================================================
-- Pre-defined eco-action tasks categorized by education level
create table recommended_tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  action_type text not null, -- e.g., 'recycling', 'tree_planting', 'energy_conservation'
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  education_level text check (education_level in ('school', 'college', 'all')),
  min_grade int check (min_grade >= 1 and min_grade <= 12), -- null for college
  max_grade int check (max_grade >= 1 and max_grade <= 12), -- null for college
  estimated_points int default 100,
  estimated_time text, -- e.g., "30 minutes", "2 hours"
  required_resources jsonb default '[]'::jsonb, -- array of resource strings
  tags jsonb default '[]'::jsonb, -- e.g., ["water", "conservation"]
  impact_metrics jsonb default '{}'::jsonb, -- e.g., {"co2_saved": 5, "trees_equivalent": 1}
  instructions text, -- step-by-step guide
  is_active boolean default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table recommended_tasks enable row level security;

-- Policies
create policy "Recommended tasks are viewable by everyone" 
  on recommended_tasks for select using (is_active = true);

create policy "Admins can insert recommended tasks" 
  on recommended_tasks for insert 
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'administrator')
  );

create policy "Admins can update recommended tasks" 
  on recommended_tasks for update 
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'administrator')
  );

-- Index for faster queries
create index idx_recommended_tasks_education on recommended_tasks(education_level);
create index idx_recommended_tasks_difficulty on recommended_tasks(difficulty);
create index idx_recommended_tasks_action_type on recommended_tasks(action_type);

-- =====================================================
-- 4. STUDENT INTERESTS TABLE
-- =====================================================
-- Stores student interests for personalized recommendations
create table student_interests (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  interests jsonb default '[]'::jsonb, -- array of interest strings
  updated_at timestamp with time zone default now(),
  unique(student_id)
);

-- Enable RLS
alter table student_interests enable row level security;

-- Policies
create policy "Students can view their own interests" 
  on student_interests for select 
  using (auth.uid() = student_id);

create policy "Students can insert their own interests" 
  on student_interests for insert 
  with check (auth.uid() = student_id);

create policy "Students can update their own interests" 
  on student_interests for update 
  using (auth.uid() = student_id);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to update last_activity timestamp
create or replace function update_last_activity()
returns trigger as $$
begin
  new.last_activity = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for student_learning_progress
create trigger update_student_progress_activity
  before update on student_learning_progress
  for each row
  execute function update_last_activity();

-- Function to calculate and update progress percentage
create or replace function calculate_progress_percentage()
returns trigger as $$
declare
  total_modules int;
  completed_count int;
begin
  -- Get total modules from learning path
  select jsonb_array_length(modules) into total_modules
  from learning_paths
  where id = new.learning_path_id;
  
  -- Get completed modules count
  completed_count := jsonb_array_length(new.completed_modules);
  
  -- Calculate percentage
  if total_modules > 0 then
    new.progress_percentage := (completed_count * 100) / total_modules;
  else
    new.progress_percentage := 0;
  end if;
  
  -- Mark as completed if 100%
  if new.progress_percentage >= 100 and new.completed_at is null then
    new.completed_at := now();
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-calculate progress
create trigger auto_calculate_progress
  before insert or update on student_learning_progress
  for each row
  execute function calculate_progress_percentage();

-- =====================================================
-- 6. SEED DATA - Sample Learning Paths
-- =====================================================

-- School-level learning path
insert into learning_paths (title, description, difficulty, education_level, min_grade, max_grade, modules, estimated_duration, total_points, tags) values
(
  'Water Conservation Basics',
  'Learn simple ways to save water at home and school',
  'beginner',
  'school',
  3,
  8,
  '[
    {
      "title": "Understanding Water Cycle",
      "description": "Learn how water moves through our environment",
      "activities": ["Watch educational video", "Draw water cycle diagram"],
      "duration": "30 minutes",
      "points": 50
    },
    {
      "title": "Water Saving Tips",
      "description": "Practical ways to reduce water waste",
      "activities": ["Create a checklist", "Track daily water usage"],
      "duration": "1 hour",
      "points": 75
    },
    {
      "title": "School Water Audit",
      "description": "Identify water waste in your school",
      "activities": ["Survey water fixtures", "Report findings"],
      "duration": "2 hours",
      "points": 100
    }
  ]'::jsonb,
  '2 weeks',
  225,
  '["water", "conservation", "school"]'::jsonb
);

-- College-level learning path
insert into learning_paths (title, description, difficulty, education_level, min_grade, max_grade, modules, estimated_duration, total_points, tags) values
(
  'Advanced Climate Science',
  'Deep dive into climate change mechanisms and solutions',
  'advanced',
  'college',
  null,
  null,
  '[
    {
      "title": "Climate System Dynamics",
      "description": "Understanding atmospheric physics and feedback loops",
      "activities": ["Read research papers", "Analyze climate data"],
      "duration": "1 week",
      "points": 150
    },
    {
      "title": "Carbon Accounting",
      "description": "Methods for measuring and reducing carbon footprints",
      "activities": ["Calculate personal carbon footprint", "Design reduction strategy"],
      "duration": "1 week",
      "points": 200
    },
    {
      "title": "Renewable Energy Systems",
      "description": "Technical analysis of solar, wind, and other renewables",
      "activities": ["Design a renewable energy system", "Cost-benefit analysis"],
      "duration": "2 weeks",
      "points": 250
    }
  ]'::jsonb,
  '1 month',
  600,
  '["climate", "energy", "advanced"]'::jsonb
);

-- =====================================================
-- 7. SEED DATA - Sample Recommended Tasks
-- =====================================================

-- School-level tasks
insert into recommended_tasks (title, description, action_type, difficulty, education_level, min_grade, max_grade, estimated_points, estimated_time, required_resources, tags, impact_metrics, instructions) values
(
  'Classroom Recycling Program',
  'Set up a recycling system in your classroom',
  'recycling',
  'easy',
  'school',
  1,
  12,
  100,
  '1 hour',
  '["bins", "labels", "poster materials"]'::jsonb,
  '["recycling", "waste", "classroom"]'::jsonb,
  '{"plastic_reduced": 2, "awareness_raised": 30}'::jsonb,
  '1. Get permission from teacher\n2. Create labeled bins for paper, plastic, metal\n3. Make informative posters\n4. Educate classmates\n5. Monitor and maintain for 1 week'
),
(
  'Plant a School Garden',
  'Create a small garden area at your school',
  'tree_planting',
  'medium',
  'school',
  3,
  12,
  150,
  '3 hours',
  '["seeds", "soil", "tools", "water"]'::jsonb,
  '["gardening", "plants", "food"]'::jsonb,
  '{"co2_saved": 10, "food_grown": 5}'::jsonb,
  '1. Get school approval\n2. Choose location\n3. Prepare soil\n4. Plant seeds/seedlings\n5. Create watering schedule\n6. Document growth weekly'
);

-- College-level tasks
insert into recommended_tasks (title, description, action_type, difficulty, education_level, min_grade, max_grade, estimated_points, estimated_time, required_resources, tags, impact_metrics, instructions) values
(
  'Campus Energy Audit',
  'Conduct comprehensive energy assessment of campus buildings',
  'energy_conservation',
  'hard',
  'college',
  null,
  null,
  300,
  '8 hours',
  '["energy meter", "spreadsheet", "camera", "building access"]'::jsonb,
  '["energy", "audit", "campus"]'::jsonb,
  '{"co2_saved": 50, "energy_kwh": 200}'::jsonb,
  '1. Get permission from facilities management\n2. Identify buildings to audit\n3. Measure energy consumption\n4. Identify inefficiencies\n5. Calculate potential savings\n6. Present findings to administration'
),
(
  'Sustainable Transportation Campaign',
  'Promote and implement sustainable commuting options',
  'transportation',
  'medium',
  'college',
  null,
  null,
  250,
  '6 hours',
  '["survey tools", "social media", "bike rack plans"]'::jsonb,
  '["transportation", "campaign", "carbon"]'::jsonb,
  '{"co2_saved": 100, "participants": 50}'::jsonb,
  '1. Survey current commuting patterns\n2. Research sustainable alternatives\n3. Create awareness campaign\n4. Organize carpooling system\n5. Advocate for bike infrastructure\n6. Track participation and impact'
);
