-- UNDO for drizzle/migrations/0027_laptop_stages.sql.
-- Removes laptop stages, Accept/claim, stage history and the virtual-laptop token function, and
-- restores request_diagnostic exactly as defined in 0025 and agent_report_diagnostic exactly as
-- defined in 0026. Laptop reports, test results and audit entries already recorded stay as they are;
-- the stage/claim history itself is dropped with its tables.

DROP TRIGGER IF EXISTS laptops_on_discovery ON public.agent_discoveries;
DROP TRIGGER IF EXISTS laptops_on_diagnostic ON public.diagnostic_results;
DROP FUNCTION IF EXISTS public._laptops_on_discovery();
DROP FUNCTION IF EXISTS public._laptops_on_diagnostic();
DROP FUNCTION IF EXISTS public.accept_laptop(uuid);
DROP FUNCTION IF EXISTS public.release_laptop(uuid);
DROP FUNCTION IF EXISTS public.simulator_prepare_laptop(uuid);
DROP FUNCTION IF EXISTS public._laptop_move(uuid, text, text, uuid, text);
DROP TABLE IF EXISTS public.laptop_stage_events;
DROP TABLE IF EXISTS public.laptops;
DROP TABLE IF EXISTS public.laptop_stage_transitions;
DROP TABLE IF EXISTS public.laptop_stages;

-- request_diagnostic as in 0025.
CREATE OR REPLACE FUNCTION public.request_diagnostic(_agent uuid, _test text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ag public.agents;
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
  INSERT INTO public.audit_events(org_id, actor_id, action, entity_type, entity_id, details)
  VALUES (v_ag.org_id, auth.uid(), 'agents.diagnostic_requested', 'agents', _agent,
    jsonb_build_object('station', v_ag.name, 'test', _test));
  RETURN jsonb_build_object('ok', true, 'test', _test);
END $$;
REVOKE EXECUTE ON FUNCTION public.request_diagnostic(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_diagnostic(uuid, text) TO authenticated;

-- agent_report_diagnostic as in 0026.
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
  -- Identify which laptop this is from the agent's most recent discovery.
  SELECT device_code, device_id INTO v_code, v_device FROM public.agent_discoveries
    WHERE agent_id = _agent ORDER BY reported_at DESC LIMIT 1;
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
