CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.copa_news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL UNIQUE,
    url_to_image TEXT,
    source_name TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    country_filter TEXT, -- Use for 'Brasil', 'Argentina', 'Todos' etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.copa_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are viewable by everyone"
    ON public.copa_news
    FOR SELECT
    USING (true);
