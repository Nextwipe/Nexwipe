-- 0028 Org stick keys (section A, Blancco model). One multi-use key per org batch of sticks; every physical stick
-- registers itself once and gets its own read-only station(s): one for the Windows helper, one for the boot system.
-- Keys are stored only as SHA-256. Wrong keys are rate-limited per source and globally. Re-runnable.

CREATE TABLE IF NOT EXISTS public.stick_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  max_sticks integer CHECK (max_sticks IS NULL OR max_sticks BETWEEN 1 AND 100000),
  revoked_at timestamptz,
  revoked_by uuid,
  UNIQUE (org_id, id)
);
ALTER TABLE public.stick_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stick_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, org_id, label, key_prefix, created_by, created_at, expires_at, max_sticks, revoked_at, revoked_by)
  ON public.stick_keys TO authenticated;
GRANT ALL ON public.stick_keys TO service_role;
DROP POLICY IF EXISTS stick_keys_select ON public.stick_keys;
CREATE POLICY stick_keys_select ON public.stick_keys FOR SELECT TO authenticated USING (public.is_org_staff(org_id));

CREATE TABLE IF NOT EXISTS public.sticks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stick_key_id uuid NOT NULL,
  stick_uid text NOT NULL CHECK (stick_uid ~ '^[0-9a-f]{32}$'),
  usb_serial text CHECK (usb_serial IS NULL OR char_length(usb_serial) <= 80),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  blocked_at timestamptz,  -- a person revoked this stick: it may not register again (re-preparing gives a new id)
  UNIQUE (org_id, id),
  UNIQUE (org_id, stick_uid),
  FOREIGN KEY (org_id, stick_key_id) REFERENCES public.stick_keys(org_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS sticks_key_idx ON public.sticks(stick_key_id);
ALTER TABLE public.sticks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sticks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sticks TO authenticated;
GRANT ALL ON public.sticks TO service_role;
DROP POLICY IF EXISTS sticks_select ON public.sticks;
CREATE POLICY sticks_select ON public.sticks FOR SELECT TO authenticated USING (public.is_org_staff(org_id));

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS stick_id uuid;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS stick_part text;
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_stick_part_chk;
ALTER TABLE public.agents ADD CONSTRAINT agents_stick_part_chk CHECK (stick_part IS NULL OR stick_part IN ('windows', 'boot'));
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_stick_fk;
ALTER TABLE public.agents ADD CONSTRAINT agents_stick_fk FOREIGN KEY (org_id, stick_id) REFERENCES public.sticks(org_id, id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS agents_stick_idx ON public.agents(stick_id) WHERE stick_id IS NOT NULL;

-- Sticks register themselves whenever they have no credential, so revoking a stick's station by a person (any path:
-- revoke_agent, disconnect_stick_key) must also block the stick, or it would quietly come back on its next start.
-- Revocations by the system (actor NULL, e.g. a stick registering again) do not block.
CREATE OR REPLACE FUNCTION public._agents_block_stick()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.sticks SET blocked_at = coalesce(blocked_at, now()) WHERE org_id = NEW.org_id AND id = NEW.stick_id;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public._agents_block_stick() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS agents_block_stick ON public.agents;
CREATE TRIGGER agents_block_stick AFTER UPDATE OF status ON public.agents FOR EACH ROW
  WHEN (NEW.status = 'revoked' AND OLD.status IS DISTINCT FROM 'revoked' AND NEW.stick_id IS NOT NULL AND NEW.revoked_by IS NOT NULL)
  EXECUTE FUNCTION public._agents_block_stick();

-- Failed stick-key attempts (no key material, only a hash of the source address). Service role only.
CREATE TABLE IF NOT EXISTS public.stick_enroll_failures (
  at timestamptz NOT NULL DEFAULT now(),
  source_hash text NOT NULL
);
CREATE INDEX IF NOT EXISTS stick_enroll_failures_at_idx ON public.stick_enroll_failures(at);
ALTER TABLE public.stick_enroll_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stick_enroll_failures FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.stick_enroll_failures TO service_role;

-- ---------------------------------------------------------------- app RPCs (owner/admin, AAL2 via has_org_role)
CREATE OR REPLACE FUNCTION public.create_stick_key(_org uuid, _label text, _expires_at timestamptz, _max_sticks integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_key text; v_id uuid;
BEGIN
  IF NOT public.has_org_role(_org, ARRAY['owner','admin']::public.org_role[]) THEN
    RAISE EXCEPTION 'Only owners and administrators can create stick keys' USING ERRCODE = 'ND403';
  END IF;
  IF _expires_at IS NOT NULL AND _expires_at <= now() THEN
    RAISE EXCEPTION 'Expiry must be in the future' USING ERRCODE = 'ND422';
  END IF;
  v_key := 'ndstk_' || encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.stick_keys(org_id, label, key_hash, key_prefix, created_by, expires_at, max_sticks)
  VALUES (_org, trim(coalesce(_label, '')), encode(extensions.digest(v_key, 'sha256'), 'hex'), left(v_key, 12), auth.uid(), _expires_at, _max_sticks)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'key', v_key);
END $$;

CREATE OR REPLACE FUNCTION public.revoke_stick_key(_key_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid;
BEGIN
  SELECT org_id INTO v_org FROM public.stick_keys WHERE id = _key_id;
  IF v_org IS NULL OR NOT public.has_org_role(v_org, ARRAY['owner','admin']::public.org_role[]) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = 'ND403';
  END IF;
  UPDATE public.stick_keys SET revoked_at = now(), revoked_by = auth.uid() WHERE id = _key_id AND revoked_at IS NULL;
END $$;

-- Revokes the key and every station registered through it (their sticks are blocked by the trigger). Returns how many.
CREATE OR REPLACE FUNCTION public.disconnect_stick_key(_key_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid; r record; n integer := 0;
BEGIN
  SELECT org_id INTO v_org FROM public.stick_keys WHERE id = _key_id;
  IF v_org IS NULL OR NOT public.has_org_role(v_org, ARRAY['owner','admin']::public.org_role[]) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = 'ND403';
  END IF;
  FOR r IN SELECT a.id FROM public.agents a JOIN public.sticks s ON s.org_id = a.org_id AND s.id = a.stick_id
           WHERE s.stick_key_id = _key_id AND a.status <> 'revoked' LOOP
    PERFORM public._revoke_agent(r.id, 'All sticks of this key disconnected', auth.uid());
    n := n + 1;
  END LOOP;
  UPDATE public.stick_keys SET revoked_at = now(), revoked_by = auth.uid() WHERE id = _key_id AND revoked_at IS NULL;
  RETURN n;
END $$;

-- ---------------------------------------------------------------- service-role RPC (enroll API)
-- Returns {ok:false, http_status, error, message} for refusals that must be counted (a raised exception would roll
-- back the failure row); other bad input raises as usual.
CREATE OR REPLACE FUNCTION public.agent_enroll_stick(_key text, _stick_uid text, _part text, _usb_serial text,
  _name text, _version text, _platform text, _hostname text, _source text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_src text := encode(extensions.digest(coalesce(nullif(_source, ''), 'unknown'), 'sha256'), 'hex');
  v_k public.stick_keys; v_stick public.sticks; v_old uuid; v_cred text; v_agent uuid; v_name text; v_n integer;
BEGIN
  IF _part IS NULL OR _part NOT IN ('windows', 'boot') THEN
    RAISE EXCEPTION 'stick_part must be windows or boot' USING ERRCODE = 'ND422';
  END IF;
  IF _stick_uid IS NULL OR _stick_uid !~ '^[0-9a-f]{32}$' THEN
    RAISE EXCEPTION 'stick_id must be 32 lowercase hex characters' USING ERRCODE = 'ND422';
  END IF;
  DELETE FROM public.stick_enroll_failures WHERE at < now() - interval '1 day';
  IF (SELECT count(*) FROM public.stick_enroll_failures WHERE source_hash = v_src AND at > now() - interval '10 minutes') >= 20
     OR (SELECT count(*) FROM public.stick_enroll_failures WHERE at > now() - interval '10 minutes') >= 500 THEN
    RETURN jsonb_build_object('ok', false, 'http_status', 429, 'error', 'rate_limited',
      'message', 'Too many wrong stick keys. Wait 10 minutes and try again.');
  END IF;

  SELECT * INTO v_k FROM public.stick_keys WHERE key_hash = encode(extensions.digest(coalesce(_key, ''), 'sha256'), 'hex') FOR UPDATE;
  IF NOT FOUND OR v_k.revoked_at IS NOT NULL OR (v_k.expires_at IS NOT NULL AND v_k.expires_at <= now()) THEN
    INSERT INTO public.stick_enroll_failures(source_hash) VALUES (v_src);
    RETURN jsonb_build_object('ok', false, 'http_status', 401, 'error', 'unauthorized',
      'message', 'Stick key is invalid, revoked or expired');
  END IF;

  SELECT * INTO v_stick FROM public.sticks WHERE org_id = v_k.org_id AND stick_uid = _stick_uid FOR UPDATE;
  IF NOT FOUND THEN
    -- the key row is locked above, so concurrent registrations cannot overshoot max_sticks
    SELECT count(*) INTO v_n FROM public.sticks WHERE stick_key_id = v_k.id;
    IF v_k.max_sticks IS NOT NULL AND v_n >= v_k.max_sticks THEN
      RAISE EXCEPTION 'This stick key has reached its maximum number of sticks' USING ERRCODE = 'ND409';
    END IF;
    INSERT INTO public.sticks(org_id, stick_key_id, stick_uid, usb_serial)
    VALUES (v_k.org_id, v_k.id, _stick_uid, left(nullif(trim(_usb_serial), ''), 80))
    RETURNING * INTO v_stick;
  ELSIF v_stick.blocked_at IS NOT NULL THEN
    RAISE EXCEPTION 'This stick was disconnected by an administrator. Prepare it again with the Stick Writer to use it.' USING ERRCODE = 'ND403';
  ELSE
    UPDATE public.sticks SET last_seen_at = now(), usb_serial = coalesce(left(nullif(trim(_usb_serial), ''), 80), usb_serial)
      WHERE id = v_stick.id;
    -- a re-written or reset stick registers again: its previous station for this part is switched off
    FOR v_old IN SELECT id FROM public.agents WHERE stick_id = v_stick.id AND stick_part = _part AND status <> 'revoked' LOOP
      PERFORM public._revoke_agent(v_old, 'Stick registered again', NULL);
    END LOOP;
  END IF;

  v_name := left(coalesce(nullif(trim(_name), ''), 'NexWipe stick'), 100);
  v_cred := 'ndagt_' || encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.agents(org_id, name, is_simulated, agent_version, platform, hostname, credential_prefix, last_heartbeat_at, last_state, stick_id, stick_part)
  VALUES (v_k.org_id, v_name, false, left(_version, 40), left(_platform, 80), left(_hostname, 120), left(v_cred, 14), now(), 'enrolled', v_stick.id, _part)
  RETURNING id INTO v_agent;  -- agents_set_read_only makes it read-only (no enrollment token, not simulated)
  INSERT INTO public.agent_credentials(org_id, agent_id, credential_hash) VALUES (v_k.org_id, v_agent, encode(extensions.digest(v_cred, 'sha256'), 'hex'));
  RETURN jsonb_build_object('ok', true, 'agent_id', v_agent, 'org_id', v_k.org_id, 'credential', v_cred, 'is_simulated', false,
    'name', v_name, 'stick_id', v_stick.id);
END $$;

REVOKE EXECUTE ON FUNCTION public.create_stick_key(uuid, text, timestamptz, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_stick_key(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.disconnect_stick_key(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agent_enroll_stick(text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_stick_key(uuid, text, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_stick_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_stick_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_enroll_stick(text, text, text, text, text, text, text, text, text) TO service_role;
