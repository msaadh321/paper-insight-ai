
-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS: users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- Paper Collections
CREATE TABLE public.paper_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paper_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own collections" ON public.paper_collections
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public collections viewable by all" ON public.paper_collections
FOR SELECT TO public USING (is_public = true);

-- Join table: collection <-> saved_analyses
CREATE TABLE public.collection_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.paper_collections(id) ON DELETE CASCADE,
  analysis_id uuid NOT NULL REFERENCES public.saved_analyses(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_id, analysis_id)
);

ALTER TABLE public.collection_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collection papers" ON public.collection_papers
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.paper_collections WHERE id = collection_id AND user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.paper_collections WHERE id = collection_id AND user_id = auth.uid())
);

CREATE POLICY "Public collection papers viewable" ON public.collection_papers
FOR SELECT TO public
USING (
  EXISTS (SELECT 1 FROM public.paper_collections WHERE id = collection_id AND is_public = true)
);

-- Comments on analyses
CREATE TABLE public.analysis_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.saved_analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read comments on own analyses" ON public.analysis_comments
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.saved_analyses WHERE id = analysis_id AND user_id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Users can insert comments" ON public.analysis_comments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.analysis_comments
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_comments;
