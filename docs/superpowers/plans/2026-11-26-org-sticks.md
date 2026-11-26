# Org sticks (section A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One org-prepared USB stick that runs the Windows helper, boots NexWipe at F12, and registers itself with the org by itself; copied onto many sticks by our Windows Stick Writer.

**Architecture:** The GitHub-built image gets a Windows-visible boot section and boots into RAM. A new multi-use org **stick key** (one migration) lets each stick register its own read-only station through the existing enroll endpoint. The image is uploaded to private Lovable storage through our own upload endpoint and fetched by the PowerShell Stick Writer using the stick key.

**Tech Stack:** bash + sgdisk/mtools (image), GRUB/live-boot, Python 3 (`nd_station`), PostgreSQL/Supabase RPCs, TanStack Start server handler (TypeScript, zod), PowerShell 5.1 (helper, writer), QEMU+OVMF for the virtual PC.

**Spec:** `docs/superpowers/specs/2026-11-26-org-sticks-design.md`

## Global Constraints

- Nothing here erases or is authorised to erase a laptop drive; stations stay `agents.read_only = true`.
- `agent-handoff/` never contains erasing tools: the writer lives in `stick-writer/` (top level).
- Migrations: `drizzle/migrations/0028_org_stick_keys.sql` + `drizzle/rollback/0028_org_stick_keys.down.sql`, rehearsed locally (apply on 0000..0027 with data, re-run safely, undo restores an identical schema dump, all `tests/db` pass), applied in Lovable by the owner only. Check `drizzle/migrations/meta` for the number before creating it.
- Enrollment, credentials, revocation, rate limits live in SQL RPCs; UI only mirrors.
- Owner/admin actions go through `has_org_role(..., ARRAY['owner','admin'])` (AAL2).
- Server address in `nexwipe-setup.json` comes only from `src/lib/app-origins.ts`.
- UI never says "verified"; nothing goes on the dashboard availability panel until a real laptop passes step 7.
- Never write to the owner's personal USB sticks; real tests use a spare stick the owner names.
- No push without asking. Branch: `org-sticks` (not `main`, which syncs to Lovable).

## Review Focus

1. **Wrong disk picked by the writer** (internal SSD on a USB-C dock, external USB backup HDD ≤ 256 GB, the stick the writer itself runs from). Expect: refused or clearly named; the writer's own stick is never listed. Test in Task 5.
2. **Cloned *used* stick** (master already registered, then duplicated): both copies share `nexwipe-stick-id` and the helper's saved login. Expect: the writer refuses a source stick that has a stick ID unless `-AllowUsedMaster`; a re-registration of a known stick ID revokes the old credential. Tests in Tasks 2 and 5.
3. **Windows offers "format disk" for the ND-STATE section.** Expect: no prompt (GPT attributes 62+63). Checked by the owner in Task 1, step 6; fallback noted there.
4. **Low-RAM laptop with `toram`** (2 GB). Expect: still boots (runs from stick). QEMU `-m 1536` test in Task 1.
5. **Stick key guessing / revoked or expired key / max sticks reached.** Expect: generic refusal, rate limit after 20 bad tries per source per 10 min, 500 global. Tests in Task 2.

---

### Task 1: Windows-visible stick layout, RAM boot, marker-file GRUB

**Files:**
- Modify: `agent-handoff/usb-image/build.sh` (partition types, marker file)
- Modify: `agent-handoff/usb-image/grub.cfg`
- Create: `agent-handoff/usb-image/check-layout.sh` (runs after build in CI)
- Modify: `.github/workflows/stick-image.yml` (run check-layout; also trigger on `org-sticks` branch pushes — already path-based)
- Modify: `agent-handoff/usb-image/README.md` (layout table, toram, Windows note)

**Interfaces:**
- Produces: partition 1 GPT name `NEXWIPE`, type `0700` (Microsoft basic data, FAT32, volume label `NEXWIPE`), root marker `/.disk/nexwipe-stick`; partition 2 `ND-STATE` type `8300` with attributes 62 (hidden) and 63 (no drive letter). Task 3 mounts partition 1 by `/dev/disk/by-partlabel/NEXWIPE`.

- [ ] **Step 1: Write `check-layout.sh <img>`** — fails unless: `sgdisk -i 1` shows `EBD0A0A2-B9E5-4433-87C0-68B6B72699C7` and name `NEXWIPE`; `sgdisk -i 2` shows attribute flags `C000000000000000`; `mdir -i <img>@@1M ::/.disk/nexwipe-stick` succeeds; `mtype` of `::/EFI/BOOT/grub.cfg` contains `toram` and `search --no-floppy --set=root --file /.disk/nexwipe-stick`.
- [ ] **Step 2: Run it against the A1 image** (`…/07b8028f…/scratchpad/stick-dl/art/*.img`) inside a Linux container → Expected: FAIL on partition type.
- [ ] **Step 3: Change build.sh** — `-t 1:0700 -c 1:"NEXWIPE"`, `mkfs.vfat -n NEXWIPE`, `-A 2:set:62 -A 2:set:63`, `touch $STAGE/.disk/nexwipe-stick`. Change grub.cfg: `search --file`, add `toram` to the normal entry only (diagnostics entry runs from stick = low-RAM fallback).
- [ ] **Step 4: Build** on GitHub (push `org-sticks` — **ask the owner first**) or locally in Docker; `check-layout.sh` passes.
- [ ] **Step 5: Virtual PC** (QEMU, OVMF, `-m 4096`, image as usb-storage): station screen appears; then `device_del` the stick from the QEMU monitor (tcp:127.0.0.1:55444) → station keeps running and its screen still responds. Repeat with `-m 1536` → boots (from RAM or from stick), record which. Save screenshots to `vm-test-evidence/`.
- [ ] **Step 6: Owner check on Windows** (spare stick, written with Rufus/Etcher): Windows shows one drive `NEXWIPE`, no "format disk" prompt; F12 boot reaches the station screen. If a prompt appears → stop and switch to the one-section fallback in the spec before Task 3.
- [ ] **Step 7: Commit** `Stick layout: Windows-visible boot section, boot to RAM, marker-file GRUB`.

### Task 2: Org stick key (migration 0028) + enroll API

**Files:**
- Create: `drizzle/migrations/0028_org_stick_keys.sql`, `drizzle/rollback/0028_org_stick_keys.down.sql`
- Create: `tests/db/phase2m_stick_keys.sql`
- Modify: `src/lib/agent-api/schemas.ts` (`EnrollRequest`), `src/server/agent-api/handler.server.ts` (enroll route), `src/lib/agent-api/schemas.test.ts`
- Modify: `src/integrations/supabase/types.ts` (hand-add in generated style; never prettier)

**Interfaces:**
- Tables: `stick_keys(id, org_id, label, key_hash UNIQUE, key_prefix, created_by, created_at, expires_at NULL, max_sticks NULL, revoked_at NULL, UNIQUE(org_id,id))`; `sticks(id, org_id, stick_key_id, stick_uid text, usb_serial text NULL, first_seen_at, last_seen_at, UNIQUE(org_id,id), UNIQUE(org_id,stick_uid), FK (org_id, stick_key_id))`; `agents` gains `stick_id uuid NULL`, `stick_part text NULL CHECK IN ('windows','boot')`, FK `(org_id, stick_id)`; `stick_enroll_failures(at timestamptz, source_hash text)`.
- RLS: org staff `SELECT` on `stick_keys` (no `key_hash` column grant) and `sticks`; no INSERT/UPDATE/DELETE grants for `authenticated`.
- UI RPCs (AAL2 owner/admin): `create_stick_key(_org uuid, _label text, _expires_at timestamptz, _max_sticks int) → jsonb {id, key}` (key `ndstk_` + 32 random bytes hex, shown once); `revoke_stick_key(_key_id uuid)`; `disconnect_stick_key(_key_id uuid) → int` (calls `_revoke_agent` for every active agent of its sticks).
- Service-role RPC: `agent_enroll_stick(_key text, _stick_uid text, _part text, _usb_serial text, _name text, _version text, _platform text, _hostname text, _source text) → jsonb` same shape as `agent_enroll` plus `stick_id`. Rules: rate limit (≥ 20 failures for `sha256(_source)` in 10 min or ≥ 500 globally → `ND429`); bad/revoked/expired key → `ND401` "Stick key is invalid, revoked or expired" (one message for all); new `stick_uid` counts toward `max_sticks` (`ND409` when full); known `(stick, part)` with an active agent → that agent is revoked first (reason `re-registered`); new agent `read_only = true`, never simulated.
- API: `EnrollRequest` = existing fields with `enrollment_token` OR `stick_key` (`/^ndstk_[0-9a-f]{64}$/`) + `stick_id` (`/^[0-9a-f]{32}$/`) + `stick_part` + optional `usb_serial` (≤ 80). Handler passes `_source` = `cf-connecting-ip` header else `x-forwarded-for` first hop else `unknown`.

- [ ] **Step 1: Write `tests/db/phase2m_stick_keys.sql`** (self-rolling-back DO block, house style) asserting: technician cannot `create_stick_key`; owner without AAL2 cannot; owner gets `ndstk_` key; enroll windows + boot parts for one `stick_uid` → 1 stick, 2 agents, both `read_only`; second `stick_uid` with `max_sticks = 1` → ND409; same `(stick,part)` again → old agent `status = 'revoked'`, stick count unchanged; revoked key → ND401; expired key → ND401; 20 bad keys from one source → 21st ND429 even with a good key; key from org A never creates agents in org B; `disconnect_stick_key` revokes all agents and returns their count; `authenticated` cannot `SELECT key_hash`.
- [ ] **Step 2: Run on local rehearsal DB (memory recipe, ports 553xx)** → Expected: FAIL (functions missing).
- [ ] **Step 3: Write migration + rollback.**
- [ ] **Step 4: Rehearse** — apply 0000..0027 with data, apply 0028 twice, `tests/db/*` all pass (phase2_acceptance's known `_sweep_jobs` stop excepted), down file → `pg_dump --schema-only` identical to pre-0028 dump.
- [ ] **Step 5: API** — zod test cases in `schemas.test.ts`: stick key + id accepted; both token and key → rejected; bad key format rejected. Handler routes on which field is present. `npm test` passes.
- [ ] **Step 6: Commit** `Org stick keys (migration 0028): multi-use key, one record per stick, enroll API`.

### Task 3: Stick connects by itself

**Files:**
- Modify: `agent-handoff/station/nd_station/station.py`, `state.py`; Create: `agent-handoff/station/nd_station/setup_file.py`; Test: `agent-handoff/station/tests/test_setup_file.py`
- Create: `agent-handoff/usb-image/rootfs/etc/systemd/system/run-nexwipe.mount` (partlabel `NEXWIPE` → `/run/nexwipe`, `rw,noexec,nosuid,nodev,flush,nofail`)
- Modify: `agent-handoff/windows-helper/nexwipe.ps1` (`Register-Station`, state path)

**Interfaces:**
- `setup_file.load(path) -> dict` → `{server, stick_key, org_name, wifi: {ssid, password} | None}`; rejects server not https (except vm-test allow list).
- `setup_file.stick_id(root) -> str`: reads `nexwipe-stick-id` (32 hex) or creates it with `secrets.token_hex(16)` and fsyncs.
- `state.binding_for(stick_id)` replaces boot serial.
- Helper: same file names; saved login at `state/station-<stick_id>.json`; `stick_part = 'windows'`, station `'boot'`.

- [ ] **Step 1: Tests** — `test_load_rejects_http_server`, `test_stick_id_created_once` (second call returns same id), `test_stick_id_rejects_garbage_file` (recreated), `test_wifi_optional`.
- [ ] **Step 2–3: Implement**, station auto-enrolls at start when not enrolled and a stick key is present; joins Wi-Fi via NetworkManager D-Bus/`nmcli` only if cable has no route after 10 s. `verify-image.sh` still OK (no `mount(` calls — mount is the systemd unit).
- [ ] **Step 4: Virtual PC** against local app + rehearsal DB: fresh stick image + setup file → station appears in Agents & stations with no typing; restart → same station; copy image to a second disk image (clone of unused master) → second, separate station.
- [ ] **Step 5: Helper** — `pwsh` self-test (`-SelfTest`) passes on the Mac; manual Windows run in Task 7.
- [ ] **Step 6: Commit.**

### Task 4: Image upload door + download links

**Files:** Create `src/routes/api/public/stick-image/$.ts` + `src/server/stick-image/*.ts`; workflow upload job; bucket + `stick_image_versions` in migration 0028 (fold in before it is handed over) or 0029.
- Upload: `PUT /api/public/stick-image/upload/<version>/<piece>` with `Authorization: Bearer $STICK_UPLOAD_TOKEN` (Lovable secret, constant-time compare); only that path prefix; pieces ≤ 45 MB; `latest-candidate.json` written last. `POST …/promote/<version>` needs a signed-in owner/admin (not the token).
- Download: `POST /api/public/stick-image/links` body `{stick_key}` → signed URLs (1 h) for the promoted version's pieces + its `latest.json`. Rate-limited via the same failure table.
- Tests: token missing/wrong → 401; path outside prefix → 400; links with revoked key → 401.
- Owner actions: add `STICK_UPLOAD_TOKEN` to Lovable secrets and GitHub secrets.

### Task 5: NexWipe Stick Writer (`stick-writer/`)

**Files:** `stick-writer/NexWipe Stick Writer.cmd`, `stick-writer/nexwipe-stick-writer.ps1`, `stick-writer/README.md`.
- `Get-EligibleDisks` = `Get-Disk` where `BusType -eq 'USB'`, not `IsBoot`/`IsSystem`, no pagefile volume, not the disk the writer runs from, `Size -le 256GB`. `-SelfTest` feeds fake disk objects through it: SATA, NVMe, USB system disk, USB 1 TB, writer's own stick → all refused; USB 32 GB → listed.
- Flow: list → tick → type `ERASE` → download pieces (parallel, resumable, SHA-256 each + whole) into `%LOCALAPPDATA%\NexWipe\cache` → per stick: `Clear-Disk`, raw write to `\\.\PhysicalDriveN`, read back + compare hash, copy helper + `nexwipe-setup.json` (no stick ID). Checksum mismatch → stop before writing.
- Runs `-SelfTest` with `pwsh` on the Mac.

### Task 6: App screens

Prepare USB stick: stick keys list (label, sticks used / max, expiry, Revoke, Disconnect all), Create key (shows key once + **Download Stick Writer** zip with `nexwipe-setup.json`, optional Wi-Fi fields with the "use a separate bench Wi-Fi" note). Agents & stations: "Stick key" column. Hooks in `src/lib/queries.ts` keyed by org id. Update `docs/STATUS.md` (Planned → built, not yet on real hardware).

### Task 7: Real test (owner + spare stick)

Owner's Windows laptop runs the writer on a spare stick; Start NexWipe shows the laptop on the board; F12 boot of a laptop shows it too; Accept works. Record in `agent-handoff/PHYSICAL_TEST_CHECKLIST.md`. Only after this: dashboard availability panel.

**Deferred (said here so nothing is silently dropped):** "possible copy" flag when one stick credential is used from two laptops at once (needs hostname on heartbeat) — after Task 7; check-in interval tuning / 1,000-stick load test (spec §7) — before any org goes past ~50 sticks.
