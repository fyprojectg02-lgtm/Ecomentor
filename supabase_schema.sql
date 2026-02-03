-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Base user info)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text, -- 'student', 'teacher', 'administrator'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
-- Policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. USER_DETAILS TABLE (Extended info: institution, education, classroom)
create table user_details (
  user_id uuid references profiles(id) on delete cascade primary key,
  institution text,
  education_level text,
  classroom_id uuid, -- Used in verification logic
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table user_details enable row level security;
-- Policies
create policy "User details are viewable by everyone." on user_details for select using (true);
create policy "Users can insert their own details." on user_details for insert with check (auth.uid() = user_id);
create policy "Users can update own details." on user_details for update using (auth.uid() = user_id);

-- 3. STUDENTS TABLE (Gamification stats)
-- Note: The code expects this table to exist and be updateable for points.
create table students (
  id uuid references profiles(id) on delete cascade primary key,
  name text,
  email text,
  eco_points int default 0,
  completed_tasks int default 0,
  classroom_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table students enable row level security;
-- Policies
create policy "Students data viewable by everyone." on students for select using (true);
create policy "Students can update their own data." on students for update using (auth.uid() = id);

-- 4. AUTOMATION TRIGGER (Crucial fix for missing signup logic)
-- When a user signs up and adds details, automatically create a student record
create or replace function public.handle_new_student()
returns trigger as $$
begin
  -- Check if the user is a student (you might need to fetch role from profiles if not available here, 
  -- but simplifying: if inserted into user_details, we assume they are a user)
  
  if exists (select 1 from profiles where id = new.user_id and role = 'student') then
    insert into public.students (id, name, eco_points, completed_tasks, classroom_id)
    values (
      new.user_id,
      (select full_name from profiles where id = new.user_id),
      0,
      0,
      new.classroom_id
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger after insert on user_details
create trigger on_user_details_created
  after insert on public.user_details
  for each row execute procedure public.handle_new_student();
