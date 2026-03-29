-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for signed sheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('folhas-assinadas', 'folhas-assinadas', false);

-- Add column to frequencias_geradas to store signed sheet path
ALTER TABLE public.frequencias_geradas 
ADD COLUMN folha_assinada_url TEXT,
ADD COLUMN assinada_em TIMESTAMP WITH TIME ZONE;

-- Storage policies for folhas-assinadas bucket
CREATE POLICY "Authenticated users can upload signed sheets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'folhas-assinadas');

CREATE POLICY "Authenticated users can view signed sheets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'folhas-assinadas');

CREATE POLICY "Authenticated users can delete their signed sheets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'folhas-assinadas');

-- Add UPDATE and DELETE policies for frequencias_geradas
CREATE POLICY "Permitir atualização de frequências"
ON public.frequencias_geradas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Permitir exclusão de frequências"
ON public.frequencias_geradas FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();