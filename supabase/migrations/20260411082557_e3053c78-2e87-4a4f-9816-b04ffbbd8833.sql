
-- Create role enum for team members
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(8), 'hex'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team shared analyses
CREATE TABLE public.team_shared_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.saved_analyses(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, analysis_id)
);

ALTER TABLE public.team_shared_analyses ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Security definer function to check team admin/owner
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND role IN ('owner', 'admin')
  )
$$;

-- Teams RLS policies
CREATE POLICY "Members can view their teams"
ON public.teams FOR SELECT TO authenticated
USING (public.is_team_member(auth.uid(), id));

CREATE POLICY "Anyone can find team by invite code"
ON public.teams FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update teams"
ON public.teams FOR UPDATE TO authenticated
USING (public.is_team_admin(auth.uid(), id));

CREATE POLICY "Owners can delete teams"
ON public.teams FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Team members RLS policies
CREATE POLICY "Members can view team members"
ON public.team_members FOR SELECT TO authenticated
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Admins can add members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_team_admin(auth.uid(), team_id) OR
  (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.teams WHERE id = team_id))
);

CREATE POLICY "Admins can remove members"
ON public.team_members FOR DELETE TO authenticated
USING (public.is_team_admin(auth.uid(), team_id) OR auth.uid() = user_id);

-- Team shared analyses RLS policies
CREATE POLICY "Members can view shared analyses"
ON public.team_shared_analyses FOR SELECT TO authenticated
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Members can share analyses"
ON public.team_shared_analyses FOR INSERT TO authenticated
WITH CHECK (public.is_team_member(auth.uid(), team_id) AND auth.uid() = shared_by);

CREATE POLICY "Sharer or admin can unshare"
ON public.team_shared_analyses FOR DELETE TO authenticated
USING (shared_by = auth.uid() OR public.is_team_admin(auth.uid(), team_id));

-- Update saved_analyses RLS to allow team members to read shared analyses
CREATE POLICY "Team members can read shared analyses"
ON public.saved_analyses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_shared_analyses tsa
    WHERE tsa.analysis_id = id
    AND public.is_team_member(auth.uid(), tsa.team_id)
  )
);
