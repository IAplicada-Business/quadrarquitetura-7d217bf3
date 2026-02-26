
CREATE TABLE public.voice_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.voice_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible TEXT,
  task_type TEXT NOT NULL DEFAULT 'geral',
  category TEXT NOT NULL DEFAULT 'pendencias',
  status TEXT NOT NULL DEFAULT 'pendente',
  priority TEXT NOT NULL DEFAULT 'media',
  due_date DATE,
  source_transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice_tasks" ON public.voice_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice_tasks" ON public.voice_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice_tasks" ON public.voice_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice_tasks" ON public.voice_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_voice_tasks_updated_at BEFORE UPDATE ON public.voice_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
