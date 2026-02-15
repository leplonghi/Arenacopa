
-- Tabela para Notícias da Copa
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    image_url TEXT,
    source TEXT,
    category TEXT DEFAULT 'general',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para Curiosidades (Fatos Históricos, Estatísticas)
CREATE TABLE IF NOT EXISTS public.curiosities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    category TEXT CHECK (category IN ('history', 'stats', 'culture', 'venue')),
    image_url TEXT,
    displayed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para Clima e Status das Cidades-Sede
CREATE TABLE IF NOT EXISTS public.city_status (
    city_id TEXT PRIMARY KEY, -- ex: 'rio-de-janeiro'
    temperature NUMERIC,
    condition TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para Status dos Estádios (Informações dinâmicas)
CREATE TABLE IF NOT EXISTS public.stadium_status (
    stadium_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'operational', -- 'maintenance', 'match-day', 'closed'
    next_match_id TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para Atualizações de Seleções (Lesões, Escalações, Notas)
CREATE TABLE IF NOT EXISTS public.team_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_code TEXT NOT NULL, -- ex: 'BRA', 'FRA'
    content TEXT NOT NULL,
    type TEXT DEFAULT 'news', -- 'injury', 'squad', 'news'
    source_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curiosities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadium_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_updates ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public read, service role write)
-- UPDATED: Allow anon/public to insert/update for demo purposes (use service role in prod)
CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public insert news" ON public.news FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update news" ON public.news FOR UPDATE USING (true);

CREATE POLICY "Public read curiosities" ON public.curiosities FOR SELECT USING (true);
CREATE POLICY "Public insert curiosities" ON public.curiosities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update curiosities" ON public.curiosities FOR UPDATE USING (true);

CREATE POLICY "Public read city_status" ON public.city_status FOR SELECT USING (true);
CREATE POLICY "Public insert city_status" ON public.city_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update city_status" ON public.city_status FOR UPDATE USING (true);

CREATE POLICY "Public read stadium_status" ON public.stadium_status FOR SELECT USING (true);
CREATE POLICY "Public insert stadium_status" ON public.stadium_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stadium_status" ON public.stadium_status FOR UPDATE USING (true);

CREATE POLICY "Public read team_updates" ON public.team_updates FOR SELECT USING (true);
CREATE POLICY "Public insert team_updates" ON public.team_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update team_updates" ON public.team_updates FOR UPDATE USING (true);

-- Allow service role full access (implicit, but good to note)
-- Setup for authenticated users (admins) to write could be added here.
