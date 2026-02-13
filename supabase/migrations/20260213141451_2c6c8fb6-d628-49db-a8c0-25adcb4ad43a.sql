
-- Add foreign key from bolao_members.user_id to profiles.user_id
ALTER TABLE public.bolao_members
  ADD CONSTRAINT bolao_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
