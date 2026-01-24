-- Create enum types for roles and statuses
CREATE TYPE public.app_role AS ENUM ('admin', 'team_leader', 'user');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'submitted', 'reviewed');
CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'reviewed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  team_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID,
  leader_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status task_status DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id) NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  start_date DATE,
  due_date DATE NOT NULL,
  allows_text_submission BOOLEAN DEFAULT TRUE,
  allows_file_upload BOOLEAN DEFAULT TRUE,
  max_files INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_submissions table
CREATE TABLE public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  text_content TEXT,
  status submission_status DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submission_files table for file metadata
CREATE TABLE public.submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.task_submissions(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for team_id in profiles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);
ALTER TABLE public.teams ADD CONSTRAINT teams_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Create security definer functions for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_team_leader(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'team_leader')
$$;

CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = _user_id
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Team leaders can view team profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_team_leader(auth.uid()) AND 
    team_id = public.get_user_team_id(auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Team leaders can insert profiles for their team"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.is_team_leader(auth.uid()) AND 
    team_id = public.get_user_team_id(auth.uid())
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for teams
CREATE POLICY "Anyone authenticated can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teams"
  ON public.teams FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for departments
CREATE POLICY "Anyone authenticated can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can view assigned tasks"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can view all tasks"
  ON public.tasks FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Team leaders can view team tasks"
  ON public.tasks FOR SELECT
  USING (
    public.is_team_leader(auth.uid()) AND 
    team_id = public.get_user_team_id(auth.uid())
  );

CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Team leaders can manage team tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.is_team_leader(auth.uid()) AND 
    team_id = public.get_user_team_id(auth.uid())
  );

CREATE POLICY "Team leaders can update team tasks"
  ON public.tasks FOR UPDATE
  USING (
    public.is_team_leader(auth.uid()) AND 
    team_id = public.get_user_team_id(auth.uid())
  );

CREATE POLICY "Users can update own task status"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- RLS Policies for task_submissions
CREATE POLICY "Users can view own submissions"
  ON public.task_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON public.task_submissions FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Team leaders can view team submissions"
  ON public.task_submissions FOR SELECT
  USING (
    public.is_team_leader(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_submissions.task_id 
      AND tasks.team_id = public.get_user_team_id(auth.uid())
    )
  );

CREATE POLICY "Users can create own submissions"
  ON public.task_submissions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_id AND tasks.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can update own draft submissions"
  ON public.task_submissions FOR UPDATE
  USING (user_id = auth.uid() AND status = 'draft')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team leaders can update submissions status"
  ON public.task_submissions FOR UPDATE
  USING (
    public.is_team_leader(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_submissions.task_id 
      AND tasks.team_id = public.get_user_team_id(auth.uid())
    )
  );

-- RLS Policies for submission_files
CREATE POLICY "Users can view own files"
  ON public.submission_files FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can view all files"
  ON public.submission_files FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Team leaders can view team files"
  ON public.submission_files FOR SELECT
  USING (
    public.is_team_leader(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM public.task_submissions ts
      JOIN public.tasks t ON t.id = ts.task_id
      WHERE ts.id = submission_files.submission_id 
      AND t.team_id = public.get_user_team_id(auth.uid())
    )
  );

CREATE POLICY "Users can upload files to own submissions"
  ON public.submission_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.task_submissions 
      WHERE task_submissions.id = submission_id 
      AND task_submissions.user_id = auth.uid()
      AND task_submissions.status = 'draft'
    )
  );

-- Create storage bucket for task submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-submissions',
  'task-submissions',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'text/plain'
  ]
);

-- Storage policies
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'task-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all storage files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-submissions' AND
    public.is_admin(auth.uid())
  );

CREATE POLICY "Team leaders can view team storage files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-submissions' AND
    public.is_team_leader(auth.uid())
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_submissions_updated_at
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();