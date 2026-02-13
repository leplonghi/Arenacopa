
-- Drop the restrictive insert policy and create one that allows self-joining
DROP POLICY "Creator or members can invite" ON public.bolao_members;

-- Allow: 1) Creator inviting others (user_id != auth.uid) OR 2) Self-joining via invite code (user_id = auth.uid, role = member)
CREATE POLICY "Users can join or be invited to bolao" ON public.bolao_members
FOR INSERT WITH CHECK (
  (auth.uid() = user_id AND role = 'member')
  OR
  (auth.uid() <> user_id AND role = 'member' AND (
    public.is_bolao_creator(auth.uid(), bolao_id) OR public.is_member_of_bolao(auth.uid(), bolao_id)
  ))
);
