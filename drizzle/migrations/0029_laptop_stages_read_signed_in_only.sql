DROP POLICY IF EXISTS "Signed-in users read stages" ON public.laptop_stages;
CREATE POLICY "Signed-in users read stages" ON public.laptop_stages FOR SELECT TO authenticated USING ((select auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "Signed-in users read transitions" ON public.laptop_stage_transitions;
CREATE POLICY "Signed-in users read transitions" ON public.laptop_stage_transitions FOR SELECT TO authenticated USING ((select auth.uid()) IS NOT NULL);