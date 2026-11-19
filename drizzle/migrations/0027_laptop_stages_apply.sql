-- Laptop stages, Accept/claim and stage history.
--
-- Why: the dashboard becomes a board of laptops by stage. A laptop that reports is Pending until
-- exactly one technician accepts it; who claimed what is kept. Stages are data (laptop_stages +
-- laptop_stage_transitions), so later steps (wiping, ...) are added as rows, not code.
--
-- Rules:
--  * Stage changes happen only in SQL, through _laptop_move (row lock + allowed transition +
--    history row). App users can only read these tables.
--  * accept_laptop: owner/admin/technician (has_org_role, AAL2 for owner/admin); auditors read only.
--    Of two people accepting at once, exactly one wins; the other gets "Already accepted by <name>".
--  * A finished test result (pass/fail) moves a laptop to Tested; an incomplete one does not.
--  * The final stage 'ready_for_sale' (wiped, ready to sell) is planned (v2): nothing can enter it.
--  * Fix: test results are filed under the laptop the stick is on now (newest last_reported_at), not
--    the laptop it first saw last (A -> B -> A filed results under B).
--  * simulator_prepare_laptop: a one-time SIMULATED token for "Try a virtual laptop".
-- Safe to run twice.

-- ===== Stage definitions (reference data) =====
CREATE TABLE IF NOT EXISTS public.laptop_stages (
  key text PRIMARY KEY CHECK (key ~ '^[a-z_]{2,40}$'),
  label text NOT NULL,
  position integer NOT NULL,
  tone text NOT NULL DEFAULT 'neutral' CHECK (tone IN ('neutral','info','success','warning','danger')),
  is_initial boolean NOT NULL DEFAULT false,
  is_terminal boolean NOT NULL DEFAULT false,
  planned text
);
CREATE TABLE IF NOT EXISTS public.laptop_stage_transitions (
  from_key text NOT NULL REFERENCES public.laptop_stages(key),
  to_key text NOT NULL REFERENCES public.laptop_stages(key),
  trigger text NOT NULL CHECK (trigger IN ('accept','test_result','test_again','release','wipe')),
  PRIMARY KEY (from_key, to_key, trigger)
);
INSERT INTO public.laptop_stages(key, label, position, tone, is_initial, is_terminal, planned) VALUES
  ('pending', 'Pending', 10, 'warning', true, false, NULL),
  ('testing', 'Testing', 20, 'info', false, false, NULL),
  ('tested', 'Tested', 30, 'success', false, false, NULL),
  ('ready_for_sale', 'Ready for sale', 40, 'success', false, true, 'v2')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.laptop_stage_transitions(from_key, to_key, trigger) VALUES
  ('pending', 'testing', 'accept'),
  ('pending', 'tested', 'test_result'),
  ('testing', 'tested', 'test_result'),
  ('tested', 'testing', 'test_again'),
  ('testing', 'pending', 'release'),
  ('tested', 'ready_for_sale', 'wipe')
ON CONFLICT DO NOTHING;

-- ===== One row per laptop (device_code) per company =====
CREATE TABLE IF NOT EXISTS public.laptops (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_code text NOT NULL,
  title text,
  latest_discovery_id uuid,
  stage_key text NOT NULL REFERENCES public.laptop_stages(key),
  is_simulated boolean NOT NULL DEFAULT false,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, id),
  UNIQUE (org_id, device_code)
);
CREATE INDEX IF NOT EXISTS laptops_stage_idx ON public.laptops(org_id, stage_key, stage_changed_at DESC);

-- Append-only history: written only by _laptop_move and the report trigger.
CREATE TABLE IF NOT EXISTS public.laptop_stage_events (
  org_id uuid NOT NULL,
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  laptop_id uuid NOT NULL,
  from_key text,
  to_key text NOT NULL,
  trigger text NOT NULL,
  actor uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (org_id, laptop_id) REFERENCES public.laptops(org_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS laptop_stage_events_laptop_idx ON public.laptop_stage_events(laptop_id, created_at DESC);

ALTER TABLE public.laptop_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laptop_stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laptops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laptop_stage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.laptop_stages, public.laptop_stage_transitions, public.laptops, public.laptop_stage_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.laptop_stages, public.laptop_stage_transitions, public.laptops, public.laptop_stage_events TO authenticated;
GRANT ALL ON public.laptop_stages, public.laptop_stage_transitions, public.laptops, public.laptop_stage_events TO service_role;
DROP POLICY IF EXISTS "Signed-in users read stages" ON public.laptop_stages;
CREATE POLICY "Signed-in users read stages" ON public.laptop_stages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Signed-in users read transitions" ON public.laptop_stage_transitions;
CREATE POLICY "Signed-in users read transitions" ON public.laptop_stage_transitions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff read laptops" ON public.laptops;
CREATE POLICY "Staff read laptops" ON public.laptops FOR SELECT TO authenticated USING (public.is_org_staff(org_id));
DROP POLICY IF EXISTS "Staff read laptop history" ON public.laptop_stage_events;
CREATE POLICY "Staff read laptop history" ON public.laptop_stage_events FOR SELECT TO authenticated USING (public.is_org_staff(org_id));

DROP TRIGGER IF EXISTS audit_laptops ON public.laptops;
CREATE TRIGGER audit_laptops AFTER INSERT OR UPDATE ON public.laptops FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- ===== The only way a stage changes =====
-- Returns false when the move is not allowed (unknown/forbidden transition, planned stage); callers
-- decide whether that is an error. Accept sets the claim, release clears it, others keep it.
CREATE OR REPLACE FUNCTION public._laptop_move(_laptop uuid, _to text, _trigger text, _actor uuid, _reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.laptops;
BEGIN
  SELECT * INTO v FROM public.laptops WHERE id = _laptop FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.laptop_stages WHERE key = _to AND planned IS NOT NULL) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.laptop_stage_transitions
                 WHERE from_key = v.stage_key AND to_key = _to AND trigger = _trigger) THEN RETURN false; END IF;
  UPDATE public.laptops SET stage_key = _to, stage_changed_at = now(),
    claimed_by = CASE _trigger WHEN 'accept' THEN _actor WHEN 'release' THEN NULL ELSE claimed_by END,
    claimed_at = CASE _trigger WHEN 'accept' THEN now() WHEN 'release' THEN NULL ELSE claimed_at END
  WHERE id = _laptop;
  INSERT INTO public.laptop_stage_events(org_id, laptop_id, from_key, to_key, trigger, actor, reason)
  VALUES (v.org_id, _laptop, v.stage_key, _to, _trigger, _actor, left(_reason, 300));
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public._laptop_move(uuid, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._laptop_move(uuid, text, text, uuid, text) TO service_role;

-- ===== A report creates the laptop (Pending) or refreshes its name; it never moves the stage =====
CREATE OR REPLACE FUNCTION public._laptops_on_discovery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text; v_id uuid;
BEGIN
  IF NEW.device_code IS NULL THEN RETURN NULL; END IF;
  v_title := nullif(trim(coalesce(NEW.payload->'system'->>'manufacturer', '') || ' ' ||
                         coalesce(NEW.payload->'system'->>'model', '')), '');
  INSERT INTO public.laptops(org_id, device_code, title, latest_discovery_id, stage_key, is_simulated)
  VALUES (NEW.org_id, NEW.device_code, left(v_title, 200), NEW.id, 'pending', NEW.is_simulated)
  ON CONFLICT (org_id, device_code) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    INSERT INTO public.laptop_stage_events(org_id, laptop_id, from_key, to_key, trigger, actor, reason)
    VALUES (NEW.org_id, v_id, NULL, 'pending', 'report', NULL, 'First reported by a NexWipe stick');
  ELSE
    UPDATE public.laptops SET title = coalesce(left(v_title, 200), title), latest_discovery_id = NEW.id
    WHERE org_id = NEW.org_id AND device_code = NEW.device_code
      AND (title IS DISTINCT FROM coalesce(left(v_title, 200), title) OR latest_discovery_id IS DISTINCT FROM NEW.id);
  END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public._laptops_on_discovery() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS laptops_on_discovery ON public.agent_discoveries;
CREATE TRIGGER laptops_on_discovery AFTER INSERT OR UPDATE ON public.agent_discoveries
  FOR EACH ROW EXECUTE FUNCTION public._laptops_on_discovery();

-- ===== A finished test result moves the laptop to Tested =====
CREATE OR REPLACE FUNCTION public._laptops_on_diagnostic()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NEW.test = 'full' AND NEW.outcome IN ('pass','fail') AND NEW.device_code IS NOT NULL THEN
    SELECT id INTO v_id FROM public.laptops WHERE org_id = NEW.org_id AND device_code = NEW.device_code;
    IF v_id IS NOT NULL THEN
      PERFORM public._laptop_move(v_id, 'tested', 'test_result', NULL, 'Test result: ' || NEW.outcome);
    END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public._laptops_on_diagnostic() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS laptops_on_diagnostic ON public.diagnostic_results;
CREATE TRIGGER laptops_on_diagnostic AFTER INSERT ON public.diagnostic_results
  FOR EACH ROW EXECUTE FUNCTION public._laptops_on_diagnostic();

-- ===== Accept and release (app RPCs) =====
CREATE OR REPLACE FUNCTION public.accept_laptop(_laptop uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.laptops; v_name text;
BEGIN
  SELECT * INTO v FROM public.laptops WHERE id = _laptop FOR UPDATE;
  IF NOT FOUND OR NOT public.has_org_role(v.org_id, ARRAY['owner','admin','technician']::public.org_role[]) THEN
    RAISE EXCEPTION 'Laptop not found or not permitted' USING ERRCODE = '42501';
  END IF;
  IF v.stage_key <> 'pending' THEN
    IF v.claimed_by IS NOT NULL THEN
      SELECT coalesce(nullif(trim(full_name), ''), email) INTO v_name FROM public.profiles WHERE id = v.claimed_by;
      RAISE EXCEPTION 'Already accepted by %', coalesce(v_name, 'someone else') USING ERRCODE = '22023';
    END IF;
    RAISE EXCEPTION 'This laptop is no longer waiting to be accepted' USING ERRCODE = '22023';
  END IF;
  PERFORM public._laptop_move(_laptop, 'testing', 'accept', auth.uid(), NULL);
  RETURN jsonb_build_object('ok', true, 'stage', 'testing');
END $$;
REVOKE EXECUTE ON FUNCTION public.accept_laptop(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_laptop(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.release_laptop(_laptop uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.laptops;
BEGIN
  SELECT * INTO v FROM public.laptops WHERE id = _laptop FOR UPDATE;
  IF NOT FOUND OR NOT public.has_org_role(v.org_id, ARRAY['owner','admin','technician']::public.org_role[]) THEN
    RAISE EXCEPTION 'Laptop not found or not permitted' USING ERRCODE = '42501';
  END IF;
  IF v.claimed_by IS DISTINCT FROM auth.uid() AND NOT public.has_org_role(v.org_id, ARRAY['owner','admin']::public.org_role[]) THEN
    RAISE EXCEPTION 'Only the person who accepted this laptop, or an owner or admin, can release it' USING ERRCODE = '42501';
  END IF;
  IF NOT public._laptop_move(_laptop, 'pending', 'release', auth.uid(), NULL) THEN
    RAISE EXCEPTION 'Only a laptop that is being tested can be released' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('ok', true, 'stage', 'pending');
END $$;
REVOKE EXECUTE ON FUNCTION public.release_laptop(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_laptop(uuid) TO authenticated;

-- ===== Run test also moves the stick's current laptop: Pending -> accepted by the caller; Tested -> Testing =====
CREATE OR REPLACE FUNCTION public.request_diagnostic(_agent uuid, _test text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ag public.agents; v_lap uuid; v_stage text;
BEGIN
  SELECT * INTO v_ag FROM public.agents WHERE id = _agent FOR UPDATE;
  -- Owners/admins only count in an AAL2 session (has_org_role); auditors and viewers cannot act.
  IF NOT FOUND OR NOT public.has_org_role(v_ag.org_id, ARRAY['owner','admin','technician']::public.org_role[]) THEN
    RAISE EXCEPTION 'Station not found or not permitted' USING ERRCODE = '42501';
  END IF;
  IF v_ag.status <> 'active' THEN RAISE EXCEPTION 'This station has been revoked' USING ERRCODE = '22023'; END IF;
  IF _test IS DISTINCT FROM 'full' THEN RAISE EXCEPTION 'Unknown diagnostic test' USING ERRCODE = '22023'; END IF;
  IF v_ag.is_simulated THEN RAISE EXCEPTION 'Simulated stations cannot run diagnostics' USING ERRCODE = '22023'; END IF;
  IF v_ag.diagnostic_status IN ('requested','delivered') AND v_ag.diagnostic_status_at > now() - interval '2 minutes' THEN
    RAISE EXCEPTION 'A diagnostic is already in progress for this station' USING ERRCODE = '22023';
  END IF;
  UPDATE public.agents SET diagnostic_requested_at = now(), diagnostic_test = _test, diagnostic_requested_by = auth.uid(),
    diagnostic_status = 'requested', diagnostic_detail = NULL, diagnostic_status_at = now() WHERE id = _agent;
  -- The laptop the stick is on now.
  SELECT l.id, l.stage_key INTO v_lap, v_stage FROM public.agent_discoveries d
    JOIN public.laptops l ON l.org_id = d.org_id AND l.device_code = d.device_code
    WHERE d.agent_id = _agent ORDER BY d.last_reported_at DESC NULLS LAST LIMIT 1;
  IF v_stage = 'pending' THEN
    PERFORM public._laptop_move(v_lap, 'testing', 'accept', auth.uid(), 'Accepted by starting a test');
  ELSIF v_stage = 'tested' THEN
    PERFORM public._laptop_move(v_lap, 'testing', 'test_again', auth.uid(), 'Test started again');
  END IF;
  INSERT INTO public.audit_events(org_id, actor_id, action, entity_type, entity_id, details)
  VALUES (v_ag.org_id, auth.uid(), 'agents.diagnostic_requested', 'agents', _agent,
    jsonb_build_object('station', v_ag.name, 'test', _test));
  RETURN jsonb_build_object('ok', true, 'test', _test);
END $$;
REVOKE EXECUTE ON FUNCTION public.request_diagnostic(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_diagnostic(uuid, text) TO authenticated;

-- ===== Results are filed under the laptop the stick is on now (was: the laptop it first saw last) =====
CREATE OR REPLACE FUNCTION public.agent_report_diagnostic(_agent uuid, _test text, _outcome text, _result jsonb, _detail text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ag public.agents; v_code text; v_device uuid; v_delivered boolean;
BEGIN
  SELECT * INTO v_ag FROM public.agents WHERE id = _agent AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agent has been revoked' USING ERRCODE = 'ND401'; END IF;
  IF _test NOT IN ('keyboard','full') OR _test IS NULL THEN RAISE EXCEPTION 'Unknown diagnostic test' USING ERRCODE = 'ND422'; END IF;
  IF _outcome NOT IN ('pass','fail','incomplete') OR _outcome IS NULL THEN RAISE EXCEPTION 'Unknown diagnostic outcome' USING ERRCODE = 'ND422'; END IF;
  -- coalesce: a station with no request has NULL status, and NOT NULL would let a keyboard result through.
  v_delivered := coalesce(v_ag.diagnostic_status = 'delivered' AND v_ag.diagnostic_test = _test, false);
  IF _test = 'full' AND public._agent_is_windows_helper(v_ag.platform) THEN
    -- The Windows helper runs the suite in the laptop's own Windows, only when the app asked for it.
    IF NOT v_delivered THEN RAISE EXCEPTION 'No diagnostic was delivered to this station' USING ERRCODE = 'ND409'; END IF;
  ELSIF _test = 'full' THEN
    NULL;  -- boot-stick station: may also report a suite started at the laptop (key T), without a cloud request
  ELSIF NOT v_delivered THEN
    -- A keyboard result is only accepted for a keyboard test this station was actually handed.
    RAISE EXCEPTION 'No diagnostic was delivered to this station' USING ERRCODE = 'ND409';
  END IF;
  -- Identify which laptop this is: the one the stick reported most recently (it is on it now).
  SELECT device_code, device_id INTO v_code, v_device FROM public.agent_discoveries
    WHERE agent_id = _agent ORDER BY last_reported_at DESC NULLS LAST LIMIT 1;
  IF v_code IS NULL THEN RAISE EXCEPTION 'This station has not reported a laptop yet' USING ERRCODE = 'ND409'; END IF;

  INSERT INTO public.diagnostic_results(org_id, agent_id, device_code, device_id, test, outcome, result, detail, is_simulated)
  VALUES (v_ag.org_id, _agent, v_code, v_device, _test, _outcome, coalesce(_result, '{}'::jsonb),
    left(nullif(trim(_detail), ''), 300), v_ag.is_simulated);

  IF v_delivered THEN
    UPDATE public.agents SET diagnostic_status = CASE WHEN _outcome = 'incomplete' THEN 'failed' ELSE 'done' END,
      diagnostic_detail = left(nullif(trim(_detail), ''), 300), diagnostic_status_at = now(),
      diagnostic_requested_at = NULL WHERE id = _agent;
  END IF;

  INSERT INTO public.audit_events(org_id, actor_id, action, entity_type, entity_id, details)
  VALUES (v_ag.org_id, NULL, 'agents.diagnostic_' || _test || '_' || _outcome, 'agents', _agent,
    jsonb_build_object('station', v_ag.name, 'device_code', v_code, 'outcome', _outcome, 'requested', v_delivered));
  RETURN jsonb_build_object('ok', true, 'outcome', _outcome);
END $$;
REVOKE EXECUTE ON FUNCTION public.agent_report_diagnostic(uuid, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_report_diagnostic(uuid, text, text, jsonb, text) TO service_role;

-- ===== "Try a virtual laptop": a one-time SIMULATED enrollment token, nothing else =====
CREATE OR REPLACE FUNCTION public.simulator_prepare_laptop(_org uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_token text;
BEGIN
  IF NOT public.has_org_role(_org, ARRAY['owner','admin','technician']::public.org_role[]) THEN
    RAISE EXCEPTION 'Only technicians, administrators and owners can run the simulator' USING ERRCODE = 'ND403';
  END IF;
  v_token := 'ndenr_' || encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.enrollment_tokens(org_id, label, token_hash, is_simulated, created_by, expires_at)
  VALUES (_org, 'SIMULATED · virtual laptop', encode(extensions.digest(v_token, 'sha256'), 'hex'), true, auth.uid(), now() + interval '1 hour');
  RETURN jsonb_build_object('enrollment_token', v_token);
END $$;
REVOKE EXECUTE ON FUNCTION public.simulator_prepare_laptop(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.simulator_prepare_laptop(uuid) TO authenticated;

-- ===== Existing laptops: one row each; Tested if a finished test exists, else Pending =====
WITH latest AS (
  SELECT DISTINCT ON (d.org_id, d.device_code) d.org_id, d.device_code, d.id, d.is_simulated, d.reported_at,
    nullif(trim(coalesce(d.payload->'system'->>'manufacturer', '') || ' ' || coalesce(d.payload->'system'->>'model', '')), '') AS title
  FROM public.agent_discoveries d WHERE d.device_code IS NOT NULL
  ORDER BY d.org_id, d.device_code, d.last_reported_at DESC NULLS LAST
), ins AS (
  INSERT INTO public.laptops(org_id, device_code, title, latest_discovery_id, stage_key, is_simulated, first_seen_at)
  SELECT l.org_id, l.device_code, left(l.title, 200), l.id,
    CASE WHEN EXISTS (SELECT 1 FROM public.diagnostic_results r WHERE r.org_id = l.org_id AND r.device_code = l.device_code
                      AND r.test = 'full' AND r.outcome IN ('pass','fail')) THEN 'tested' ELSE 'pending' END,
    l.is_simulated, coalesce(l.reported_at, now())
  FROM latest l
  ON CONFLICT (org_id, device_code) DO NOTHING
  RETURNING org_id, id, stage_key
)
INSERT INTO public.laptop_stage_events(org_id, laptop_id, from_key, to_key, trigger, actor, reason)
SELECT org_id, id, NULL, stage_key, 'backfill', NULL, 'Existing laptop when stages were introduced' FROM ins;