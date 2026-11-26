-- Undo 0028_org_stick_keys. Stations registered through stick keys keep working as ordinary stations
-- (their link to the stick is dropped with the columns).
DROP FUNCTION IF EXISTS public.agent_enroll_stick(text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.disconnect_stick_key(uuid);
DROP FUNCTION IF EXISTS public.revoke_stick_key(uuid);
DROP FUNCTION IF EXISTS public.create_stick_key(uuid, text, timestamptz, integer);
DROP INDEX IF EXISTS public.agents_stick_idx;
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_stick_fk;
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_stick_part_chk;
ALTER TABLE public.agents DROP COLUMN IF EXISTS stick_part;
ALTER TABLE public.agents DROP COLUMN IF EXISTS stick_id;
DROP TABLE IF EXISTS public.stick_enroll_failures;
DROP TABLE IF EXISTS public.sticks;
DROP TABLE IF EXISTS public.stick_keys;
