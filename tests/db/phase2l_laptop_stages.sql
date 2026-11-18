-- NexWipe Phase 2l checks: laptop stages, Accept/claim and stage history (migration 0027).
-- Stages are data (laptop_stages + transitions); every move goes through SQL and is recorded;
-- exactly one person can accept a laptop; test results move a laptop to Tested; results are filed
-- under the stick's current laptop (A -> B -> A). Single DO block; always rolls back.
DO $$
DECLARE
  ua uuid := gen_random_uuid(); ut uuid := gen_random_uuid(); ut2 uuid := gen_random_uuid(); uau uuid := gen_random_uuid();
  oa uuid; tok text; st text; n int; ok boolean; r text := '';
  boot uuid; boot2 uuid; lap uuid; lapb uuid; lapc uuid; who uuid; code_a text; code_b text;
BEGIN
  INSERT INTO auth.users(id, email, email_confirmed_at, aud, role) VALUES
    (ua, 'p2la@test.local', now(), 'authenticated','authenticated'), (ut, 'p2lt@test.local', now(), 'authenticated','authenticated'),
    (ut2, 'p2lt2@test.local', now(), 'authenticated','authenticated'), (uau, 'p2lau@test.local', now(), 'authenticated','authenticated');
  UPDATE public.profiles SET full_name = 'Priya Tech' WHERE id = ut;
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  oa := public.create_organization('P2L A', 'p2l-a-' || substr(ua::text,1,8));
  tok := public.create_invitation(oa, 'p2lt@test.local', 'technician');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal1')::text, true);
  PERFORM public.accept_invitation(tok);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  tok := public.create_invitation(oa, 'p2lt2@test.local', 'technician');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut2, 'role','authenticated','aal','aal1')::text, true);
  PERFORM public.accept_invitation(tok);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  tok := public.create_invitation(oa, 'p2lau@test.local', 'auditor');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uau, 'role','authenticated','aal','aal1')::text, true);
  PERFORM public.accept_invitation(tok);

  -- A laptop received by hand before any stick ran (device record with the same serial).
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal2')::text, true);
  INSERT INTO public.devices(org_id, asset_tag, manufacturer, model, system_serial)
  VALUES (oa, 'P2L-HAND-1', 'Lenovo', 'ThinkPad T480', 'P2L-SYS-C');

  -- Two boot sticks (boot sticks may report a suite started at the laptop, without a request).
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  tok := public.create_enrollment_token(oa, 'Boot 1', null, 1);
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  boot := (public.agent_enroll(tok, 'Boot 1', '0.3.0-readonly', 'x86_64 6.12.107', 'nexwipe')->>'agent_id')::uuid;
  PERFORM public.agent_report_inventory(boot, '{"system":{"manufacturer":"HP","model":"EliteBook 840","serial":"P2L-SYS-A"},"station":{"hardware_source":"physical"},"drives":[]}');
  PERFORM public.agent_report_inventory(boot, '{"system":{"manufacturer":"HP","model":"EliteBook 840","serial":"P2L-SYS-A"},"station":{"hardware_source":"physical"},"drives":[]}');
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  tok := public.create_enrollment_token(oa, 'Boot 2', null, 1);
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  boot2 := (public.agent_enroll(tok, 'Boot 2', '0.3.0-readonly', 'x86_64 6.12.107', 'nexwipe')->>'agent_id')::uuid;
  PERFORM public.agent_report_inventory(boot2, '{"system":{"manufacturer":"HP","model":"EliteBook 840","serial":"P2L-SYS-A"},"station":{"hardware_source":"physical"},"drives":[]}');
  PERFORM public.agent_report_inventory(boot2, '{"system":{"manufacturer":"Lenovo","model":"ThinkPad T480","serial":"P2L-SYS-C"},"station":{"hardware_source":"physical"},"drives":[]}');
  RESET ROLE;
  -- One transaction means one now(): back-date so stick 2 is clearly on laptop C now.
  UPDATE public.agent_discoveries SET last_reported_at = now() - interval '1 minute'
    WHERE agent_id = boot2 AND system_serial = 'P2L-SYS-A';

  SELECT device_code INTO code_a FROM public.agent_discoveries WHERE agent_id = boot LIMIT 1;
  SELECT count(*) INTO n FROM public.laptops WHERE org_id = oa AND device_code = code_a;
  SELECT id, stage_key INTO lap, st FROM public.laptops WHERE org_id = oa AND device_code = code_a;
  r := r || ' [one_laptop_two_sticks_two_reports ' || CASE WHEN n = 1 AND st = 'pending' THEN 'PASS' ELSE 'FAIL' END || ']';
  r := r || ' [title_from_report ' || CASE WHEN (SELECT title FROM public.laptops WHERE id = lap) = 'HP EliteBook 840' THEN 'PASS' ELSE 'FAIL' END || ']';
  SELECT l.id, l.stage_key INTO lapc, st FROM public.laptops l JOIN public.agent_discoveries d ON d.org_id = l.org_id AND d.device_code = l.device_code
    WHERE d.agent_id = boot2 AND d.system_serial = 'P2L-SYS-C';
  r := r || ' [received_by_hand_still_pending ' || CASE WHEN st = 'pending' THEN 'PASS' ELSE 'FAIL' END || ']';
  SELECT count(*) INTO n FROM public.laptop_stage_events WHERE laptop_id = lap AND to_key = 'pending' AND actor IS NULL;
  r := r || ' [creation_recorded ' || CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END || ']';

  -- ===== Accept: exactly one wins; auditors cannot =====
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal2')::text, true);
  PERFORM public.accept_laptop(lap);
  SELECT stage_key, claimed_by INTO st, who FROM public.laptops WHERE id = lap;
  r := r || ' [accept_claims ' || CASE WHEN st = 'testing' AND who = ut THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut2, 'role','authenticated','aal','aal2')::text, true);
  BEGIN PERFORM public.accept_laptop(lap); r := r || ' [second_accept_refused FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [second_accept_refused ' || CASE WHEN SQLERRM = 'Already accepted by Priya Tech' THEN 'PASS' ELSE 'FAIL:' || SQLERRM END || ']'; END;
  SELECT claimed_by INTO who FROM public.laptops WHERE id = lap;
  r := r || ' [claim_kept ' || CASE WHEN who = ut THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uau, 'role','authenticated','aal','aal2')::text, true);
  BEGIN PERFORM public.accept_laptop(lapc); r := r || ' [auditor_cannot_accept FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [auditor_cannot_accept PASS]'; END;
  SELECT count(*) INTO n FROM public.laptops WHERE org_id = oa;
  r := r || ' [auditor_reads_board ' || CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END || ']';

  -- ===== Browser cannot write the stage tables =====
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  BEGIN UPDATE public.laptops SET stage_key = 'tested' WHERE id = lap;
    GET DIAGNOSTICS n = ROW_COUNT; r := r || ' [no_direct_stage_update ' || CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END || ']';
  EXCEPTION WHEN others THEN r := r || ' [no_direct_stage_update PASS]'; END;
  BEGIN INSERT INTO public.laptop_stage_events(org_id, laptop_id, from_key, to_key, trigger) VALUES (oa, lap, 'testing', 'tested', 'manual');
    r := r || ' [no_event_insert FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [no_event_insert PASS]'; END;
  BEGIN UPDATE public.laptop_stage_events SET reason = 'x' WHERE laptop_id = lap;
    GET DIAGNOSTICS n = ROW_COUNT; r := r || ' [events_not_editable ' || CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END || ']';
  EXCEPTION WHEN others THEN r := r || ' [events_not_editable PASS]'; END;
  BEGIN INSERT INTO public.laptop_stages(key, label, position, tone) VALUES ('hack', 'Hack', 99, 'neutral');
    r := r || ' [no_stage_insert FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [no_stage_insert PASS]'; END;

  -- ===== Test results move the laptop; incomplete does not =====
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  PERFORM public.agent_report_inventory(boot, '{"system":{"manufacturer":"HP","model":"EliteBook 840","serial":"P2L-SYS-A"},"station":{"hardware_source":"physical"},"drives":[]}');
  PERFORM public.agent_report_diagnostic(boot, 'full', 'incomplete', '{"tests":{"keyboard":{"outcome":"incomplete"}}}', 'declined');
  SELECT stage_key INTO st FROM public.laptops WHERE id = lap;
  r := r || ' [incomplete_stays_testing ' || CASE WHEN st = 'testing' THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM public.agent_report_diagnostic(boot, 'full', 'fail', '{"tests":{"webcam":{"outcome":"fail"}}}', '1 fail');
  SELECT stage_key INTO st FROM public.laptops WHERE id = lap;
  r := r || ' [result_moves_to_tested ' || CASE WHEN st = 'tested' THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM public.agent_report_inventory(boot, '{"system":{"manufacturer":"HP","model":"EliteBook 840","serial":"P2L-SYS-A"},"station":{"hardware_source":"physical"},"drives":[]}');
  SELECT stage_key INTO st FROM public.laptops WHERE id = lap;
  r := r || ' [re_report_keeps_stage ' || CASE WHEN st = 'tested' THEN 'PASS' ELSE 'FAIL' END || ']';
  SELECT count(*) INTO n FROM public.laptop_stage_events WHERE laptop_id = lap AND to_key = 'tested' AND trigger = 'test_result' AND actor IS NULL;
  r := r || ' [system_move_recorded ' || CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END || ']';

  -- ===== Run test: on Tested goes back to Testing, claim kept; on Pending claims for the caller =====
  -- (a boot stick never needs a request to report, but the request path still moves the stage)
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut2, 'role','authenticated','aal','aal2')::text, true);
  PERFORM public.request_diagnostic(boot, 'full');
  SELECT stage_key, claimed_by INTO st, who FROM public.laptops WHERE id = lap;
  r := r || ' [test_again_keeps_claim ' || CASE WHEN st = 'testing' AND who = ut THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM public.request_diagnostic(boot2, 'full');
  SELECT stage_key, claimed_by INTO st, who FROM public.laptops WHERE id = lapc;
  r := r || ' [run_test_on_pending_claims ' || CASE WHEN st = 'testing' AND who = ut2 THEN 'PASS' ELSE 'FAIL' END || ']';

  -- ===== Release =====
  BEGIN PERFORM public.release_laptop(lap); r := r || ' [non_claimer_cannot_release FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [non_claimer_cannot_release PASS]'; END;
  PERFORM public.release_laptop(lapc);
  SELECT stage_key, claimed_by INTO st, who FROM public.laptops WHERE id = lapc;
  r := r || ' [claimer_releases ' || CASE WHEN st = 'pending' AND who IS NULL THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  PERFORM public.release_laptop(lap);
  SELECT stage_key INTO st FROM public.laptops WHERE id = lap;
  r := r || ' [owner_releases ' || CASE WHEN st = 'pending' THEN 'PASS' ELSE 'FAIL' END || ']';
  SELECT count(*) INTO n FROM public.laptop_stage_events WHERE laptop_id = lap AND trigger = 'release' AND actor = ua;
  r := r || ' [release_recorded_with_actor ' || CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END || ']';

  -- ===== Planned stage cannot be entered =====
  RESET ROLE;
  r := r || ' [planned_stage_blocked ' || CASE WHEN NOT public._laptop_move(lap, 'ready_for_sale', 'wipe', NULL, 'test') THEN 'PASS' ELSE 'FAIL' END || ']';
  BEGIN PERFORM set_config('role', 'authenticated', true);
    PERFORM public._laptop_move(lap, 'testing', 'accept', ua, 'x'); r := r || ' [mover_not_public FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [mover_not_public PASS]'; END;
  RESET ROLE;

  -- ===== A -> B -> A: results land on the laptop the stick is on now =====
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  PERFORM public.agent_report_inventory(boot, '{"system":{"manufacturer":"Dell Inc.","model":"Latitude 7400","serial":"P2L-SYS-B"},"station":{"hardware_source":"physical"},"drives":[]}');
  RESET ROLE;
  -- Laptop A was first seen long ago, B a minute ago, and the stick is back on A now.
  UPDATE public.agent_discoveries SET reported_at = now() - interval '10 minutes' WHERE agent_id = boot AND system_serial = 'P2L-SYS-A';
  UPDATE public.agent_discoveries SET last_reported_at = now() - interval '1 minute' WHERE agent_id = boot AND system_serial = 'P2L-SYS-B';
  PERFORM set_config('role', 'service_role', true);
  PERFORM public.agent_report_inventory(boot, '{"system":{"manufacturer":"HP","model":"EliteBook 840","serial":"P2L-SYS-A"},"station":{"hardware_source":"physical"},"drives":[]}');
  PERFORM public.agent_report_diagnostic(boot, 'full', 'pass', '{"tests":{"display":{"outcome":"pass"}}}', 'all pass');
  SELECT device_code INTO code_b FROM public.diagnostic_results WHERE agent_id = boot ORDER BY created_at DESC, id DESC LIMIT 1;
  r := r || ' [a_b_a_filed_under_a ' || CASE WHEN code_b = code_a THEN 'PASS' ELSE 'FAIL' END || ']';
  RESET ROLE;

  -- ===== Simulated laptops are marked =====
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal2')::text, true);
  tok := public.simulator_prepare_laptop(oa)->>'enrollment_token';
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  who := (public.agent_enroll(tok, 'Virtual stick', '0.0.0-sim', 'SIMULATOR (no disk access)', 'sim')->>'agent_id')::uuid;
  PERFORM public.agent_report_inventory(who, '{"system":{"manufacturer":"SIMULATED","model":"Virtual laptop","serial":"P2L-SIM-1"},"station":{"hardware_source":"physical"},"drives":[]}');
  RESET ROLE;
  SELECT l.is_simulated, l.stage_key INTO ok, st FROM public.laptops l JOIN public.agent_discoveries d ON d.org_id = l.org_id AND d.device_code = l.device_code WHERE d.agent_id = who;
  r := r || ' [virtual_laptop_simulated_pending ' || CASE WHEN ok AND st = 'pending' THEN 'PASS' ELSE 'FAIL' END || ']';
  SELECT count(*) INTO n FROM public.devices WHERE org_id = oa AND is_simulated;
  r := r || ' [virtual_laptop_no_device_record ' || CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END || ']';

  RAISE EXCEPTION 'RESULTS: %', r;
END $$;
