-- Create a table for system-wide dashboard configurations
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- General Settings
    enabled_cards JSONB DEFAULT '{"colaboradores": true, "orgaos": true, "pontos": true}'::jsonb,
    default_period TEXT DEFAULT 'hoje', -- hoje, semana, mes, ano
    
    -- Power BI Configuration
    powerbi_report_id TEXT,
    powerbi_workspace_id TEXT,
    powerbi_embed_url TEXT,
    powerbi_enabled BOOLEAN DEFAULT false
);

-- Row Level Security (RLS)
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage settings
CREATE POLICY "Super Admins can manage settings" 
ON public.dashboard_settings
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
));

-- All collaborators can read settings (for the dashboard view)
CREATE POLICY "Everyone can read settings"
ON public.dashboard_settings
FOR SELECT
USING (true);

-- Initial seed (optional, but good for defaults)
INSERT INTO public.dashboard_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001') -- Fixed ID for global settings
ON CONFLICT (id) DO NOTHING;
