CREATE POLICY "Creators can update bolao members"
ON public.bolao_members
FOR UPDATE
USING (public.is_bolao_creator(auth.uid(), bolao_id))
WITH CHECK (public.is_bolao_creator(auth.uid(), bolao_id));
