-- NexWipe Phase 2m checks: org stick keys (migration 0028). One multi-use key per batch; each stick registers itself
-- as read-only station(s) linked to one stick record; max sticks, revoke, expiry, rate limit, org isolation.
-- Single DO block; always rolls back.
DO $$
DECLARE
  ua uuid := gen_random_uuid(); ut uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  oa uuid; ob uuid; tok text; k jsonb; key text; key1 text; kid uuid; kid1 uuid; res jsonb; res2 jsonb;
  n int; ok boolean; st text; r text := ''; i int;
  u1 text := repeat('a', 32); u2 text := repeat('b', 32); u3 text := repeat('c', 32);
BEGIN
  INSERT INTO auth.users(id, email, email_confirmed_at, aud, role) VALUES
    (ua, 'p2ma@test.local', now(), 'authenticated','authenticated'), (ut, 'p2mt@test.local', now(), 'authenticated','authenticated'),
    (ub, 'p2mb@test.local', now(), 'authenticated','authenticated');
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub, 'role','authenticated','aal','aal2')::text, true);
  ob := public.create_organization('P2M B', 'p2m-b-' || substr(ub::text,1,8));
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  oa := public.create_organization('P2M A', 'p2m-a-' || substr(ua::text,1,8));
  tok := public.create_invitation(oa, 'p2mt@test.local', 'technician');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal2')::text, true);
  PERFORM public.accept_invitation(tok);

  -- Only owner/admin with two-step sign-in may create keys
  BEGIN PERFORM public.create_stick_key(oa, 'Tech try', null, null); r := r || ' [technician_cannot_create FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [technician_cannot_create PASS]'; END;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal1')::text, true);
  BEGIN PERFORM public.create_stick_key(oa, 'No MFA', null, null); r := r || ' [owner_aal1_cannot_create FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [owner_aal1_cannot_create PASS]'; END;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  k := public.create_stick_key(oa, 'Batch 1', null, null);
  key := k->>'key'; kid := (k->>'id')::uuid;
  r := r || ' [key_format ' || CASE WHEN key ~ '^ndstk_[0-9a-f]{64}$' THEN 'PASS' ELSE 'FAIL' END || ']';
  k := public.create_stick_key(oa, 'Batch of one', null, 1);
  key1 := k->>'key'; kid1 := (k->>'id')::uuid;

  -- Browser roles cannot read the key hash or write the tables
  BEGIN PERFORM key_hash FROM public.stick_keys LIMIT 1; r := r || ' [no_key_hash_read FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [no_key_hash_read PASS]'; END;
  BEGIN INSERT INTO public.sticks(org_id, stick_key_id, stick_uid) VALUES (oa, kid, u3); r := r || ' [no_direct_stick_insert FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [no_direct_stick_insert PASS]'; END;

  -- One stick, two parts -> one stick record, two read-only stations
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  res := public.agent_enroll_stick(key, u1, 'windows', 'USBSER1', 'Stick 1', '0.4.0', 'windows 10', 'LAPTOP1', '10.0.0.1');
  res2 := public.agent_enroll_stick(key, u1, 'boot', 'USBSER1', 'Stick 1', '0.4.0', 'x86_64', 'nexwipe', '10.0.0.1');
  SELECT count(*) INTO n FROM public.sticks WHERE stick_key_id = kid;
  r := r || ' [one_stick_two_parts ' || CASE WHEN n = 1 AND (res->>'ok')::boolean AND (res2->>'ok')::boolean AND res->>'stick_id' = res2->>'stick_id' THEN 'PASS' ELSE 'FAIL' END || ']';
  SELECT bool_and(read_only AND NOT is_simulated AND org_id = oa) INTO ok FROM public.agents WHERE stick_id = (res->>'stick_id')::uuid;
  r := r || ' [stations_read_only ' || CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ']';

  -- Same stick + part again (re-written stick): old station revoked, stick not counted twice
  res2 := public.agent_enroll_stick(key, u1, 'windows', null, 'Stick 1', '0.4.0', 'windows 10', 'LAPTOP2', '10.0.0.1');
  SELECT status INTO st FROM public.agents WHERE id = (res->>'agent_id')::uuid;
  SELECT count(*) INTO n FROM public.sticks WHERE stick_key_id = kid;
  r := r || ' [reregister_revokes_old ' || CASE WHEN st = 'revoked' AND n = 1 THEN 'PASS' ELSE 'FAIL' END || ']';
  r := r || ' [reregister_does_not_block ' || CASE WHEN (SELECT blocked_at FROM public.sticks WHERE stick_uid = u1) IS NULL THEN 'PASS' ELSE 'FAIL' END || ']';

  -- An admin revokes one stick's station: that stick cannot come back by itself, other sticks can
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  PERFORM public.revoke_agent((res2->>'agent_id')::uuid, 'Lost stick');
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  BEGIN PERFORM public.agent_enroll_stick(key, u1, 'windows', null, 'S', null, null, null, '10.0.0.1'); r := r || ' [revoked_stick_blocked FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [revoked_stick_blocked ' || CASE WHEN SQLSTATE = 'ND403' THEN 'PASS' ELSE 'FAIL:' || SQLERRM END || ']'; END;
  BEGIN PERFORM public.agent_enroll_stick(key, u1, 'boot', null, 'S', null, null, null, '10.0.0.1'); r := r || ' [blocked_for_both_parts FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [blocked_for_both_parts PASS]'; END;

  -- max_sticks = 1: second stick refused, re-registering the first still allowed
  PERFORM public.agent_enroll_stick(key1, u2, 'boot', null, 'S', null, null, null, '10.0.0.2');
  BEGIN PERFORM public.agent_enroll_stick(key1, u3, 'boot', null, 'S', null, null, null, '10.0.0.2'); r := r || ' [max_sticks FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [max_sticks ' || CASE WHEN SQLSTATE = 'ND409' THEN 'PASS' ELSE 'FAIL:' || SQLERRM END || ']'; END;
  res := public.agent_enroll_stick(key1, u2, 'boot', null, 'S', null, null, null, '10.0.0.2');
  r := r || ' [max_sticks_same_stick_ok ' || CASE WHEN (res->>'ok')::boolean THEN 'PASS' ELSE 'FAIL' END || ']';

  -- Bad input
  BEGIN PERFORM public.agent_enroll_stick(key, 'NOT-HEX', 'boot', null, 'S', null, null, null, '10.0.0.3'); r := r || ' [bad_stick_id FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [bad_stick_id PASS]'; END;

  -- Expired and revoked keys refused with one message
  UPDATE public.stick_keys SET expires_at = now() - interval '1 minute' WHERE id = kid1;
  res := public.agent_enroll_stick(key1, u2, 'boot', null, 'S', null, null, null, '10.0.0.4');
  r := r || ' [expired_refused ' || CASE WHEN res->>'http_status' = '401' THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal2')::text, true);
  BEGIN PERFORM public.revoke_stick_key(kid); r := r || ' [technician_cannot_revoke FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [technician_cannot_revoke PASS]'; END;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub, 'role','authenticated','aal','aal2')::text, true);
  BEGIN PERFORM public.disconnect_stick_key(kid); r := r || ' [other_org_cannot_disconnect FAIL]';
  EXCEPTION WHEN others THEN r := r || ' [other_org_cannot_disconnect PASS]'; END;
  SELECT count(*) INTO n FROM public.sticks;
  r := r || ' [other_org_sees_no_sticks ' || CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ut, 'role','authenticated','aal','aal2')::text, true);
  SELECT count(*) INTO n FROM public.sticks;
  r := r || ' [technician_sees_sticks ' || CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END || ']';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  n := public.disconnect_stick_key(kid);
  r := r || ' [disconnect_all ' || CASE WHEN n = 1 AND (SELECT revoked_at FROM public.stick_keys WHERE id = kid) IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.agents a JOIN public.sticks s ON s.id = a.stick_id WHERE s.stick_key_id = kid AND a.status <> 'revoked') THEN 'PASS' ELSE 'FAIL:' || n END || ']';
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  res := public.agent_enroll_stick(key, u3, 'boot', null, 'S', null, null, null, '10.0.0.5');
  r := r || ' [revoked_refused ' || CASE WHEN res->>'http_status' = '401' AND res->>'message' = 'Stick key is invalid, revoked or expired' THEN 'PASS' ELSE 'FAIL' END || ']';

  -- Rate limit: 20 wrong keys from one source, then even a good key is refused from there (not from elsewhere)
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated','aal','aal2')::text, true);
  key := public.create_stick_key(oa, 'Batch 2', null, null)->>'key';
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  FOR i IN 1..20 LOOP PERFORM public.agent_enroll_stick('ndstk_' || repeat('0', 64), u3, 'boot', null, 'S', null, null, null, '10.9.9.9'); END LOOP;
  res := public.agent_enroll_stick(key, u3, 'boot', null, 'S', null, null, null, '10.9.9.9');
  r := r || ' [rate_limited ' || CASE WHEN res->>'http_status' = '429' THEN 'PASS' ELSE 'FAIL' END || ']';
  res := public.agent_enroll_stick(key, u3, 'boot', null, 'S', null, null, null, '10.0.0.6');
  r := r || ' [other_source_ok ' || CASE WHEN (res->>'ok')::boolean AND res->>'org_id' = oa::text THEN 'PASS' ELSE 'FAIL' END || ']';

  -- Credential from a stick key authenticates like any station
  res2 := public.agent_authenticate(res->>'credential', 'p2m-nonce-' || gen_random_uuid(), now());
  r := r || ' [credential_works ' || CASE WHEN res2->>'agent_id' = res->>'agent_id' AND (res2->>'read_only')::boolean THEN 'PASS' ELSE 'FAIL' END || ']';

  RAISE EXCEPTION 'RESULTS: %', r;
END $$;
