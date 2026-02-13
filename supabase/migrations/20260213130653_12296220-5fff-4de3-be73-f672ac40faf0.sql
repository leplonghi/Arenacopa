
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simulations table (stores user's group stage score predictions)
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Bolões (betting pools)
CREATE TABLE public.boloes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boloes ENABLE ROW LEVEL SECURITY;

-- Bolão members
CREATE TABLE public.bolao_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id UUID REFERENCES public.boloes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bolao_id, user_id)
);

ALTER TABLE public.bolao_members ENABLE ROW LEVEL SECURITY;

-- Bolão predictions (palpites)
CREATE TABLE public.bolao_palpites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id UUID REFERENCES public.boloes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bolao_id, user_id, match_id)
);

ALTER TABLE public.bolao_palpites ENABLE ROW LEVEL SECURITY;

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Helper functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_member_of_bolao(_user_id UUID, _bolao_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bolao_members
    WHERE user_id = _user_id AND bolao_id = _bolao_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bolao_creator(_user_id UUID, _bolao_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boloes
    WHERE id = _bolao_id AND creator_id = _user_id
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON public.simulations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_boloes_updated_at BEFORE UPDATE ON public.boloes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_palpites_updated_at BEFORE UPDATE ON public.bolao_palpites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-add creator as admin member when bolão is created
CREATE OR REPLACE FUNCTION public.auto_join_bolao_creator()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.bolao_members (bolao_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bolao_created
  AFTER INSERT ON public.boloes
  FOR EACH ROW EXECUTE FUNCTION public.auto_join_bolao_creator();

-- RLS Policies

-- Profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Simulations
CREATE POLICY "Users can view own simulations" ON public.simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own simulation" ON public.simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulation" ON public.simulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own simulation" ON public.simulations FOR DELETE USING (auth.uid() = user_id);

-- Bolões
CREATE POLICY "Members and creators can view boloes" ON public.boloes FOR SELECT USING (
  auth.uid() = creator_id OR public.is_member_of_bolao(auth.uid(), id)
);
CREATE POLICY "Authenticated users can create boloes" ON public.boloes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update boloes" ON public.boloes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete boloes" ON public.boloes FOR DELETE USING (auth.uid() = creator_id);

-- Bolão members
CREATE POLICY "Members can view other members" ON public.bolao_members FOR SELECT USING (
  public.is_member_of_bolao(auth.uid(), bolao_id)
);
CREATE POLICY "Creator or members can invite" ON public.bolao_members FOR INSERT WITH CHECK (
  (public.is_bolao_creator(auth.uid(), bolao_id) OR public.is_member_of_bolao(auth.uid(), bolao_id))
  AND user_id <> auth.uid()
  AND role = 'member'
);
CREATE POLICY "Users can leave bolao" ON public.bolao_members FOR DELETE USING (
  auth.uid() = user_id OR public.is_bolao_creator(auth.uid(), bolao_id)
);

-- Palpites
CREATE POLICY "Users can view own palpites" ON public.bolao_palpites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can view others palpites" ON public.bolao_palpites FOR SELECT USING (
  public.is_member_of_bolao(auth.uid(), bolao_id)
);
CREATE POLICY "Members can insert palpites" ON public.bolao_palpites FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.is_member_of_bolao(auth.uid(), bolao_id)
);
CREATE POLICY "Users can update own palpites" ON public.bolao_palpites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own palpites" ON public.bolao_palpites FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
