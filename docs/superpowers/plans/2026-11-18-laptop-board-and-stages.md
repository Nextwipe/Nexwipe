# Laptop Board, Stages and Claiming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A stored, data-defined stage per laptop (Pending → Testing → Tested → Ready for sale·planned) with atomic Accept/claim and append-only history, shown as a tabbed laptop board on the dashboard, plus the Full Computer Test rename, onboarding and a virtual-laptop trial.

**Architecture:** Migration 0027 adds `laptop_stages`, `laptop_stage_transitions`, `laptops`, `laptop_stage_events` and one internal mover `_laptop_move`; triggers create laptops on report and move them on test results; RPCs `accept_laptop` / `release_laptop`; `request_diagnostic` and `agent_report_diagnostic` are replaced. The React board reads stages and laptops (read-only) and calls the RPCs. The simulator gains two scenarios that go through the real agent API.

**Tech Stack:** Postgres/Supabase (plpgsql, RLS), local Supabase in Docker for rehearsal, React + TanStack Router/Query, vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-laptop-board-and-stages-design.md`

## Global Constraints

- Never run SQL against the live database; rehearse on `supabase start` (local Docker) only.
- Migration file `drizzle/migrations/0027_laptop_stages.sql` + undo `drizzle/rollback/0027_laptop_stages.down.sql`; idempotent (re-run safe); undo restores an identical schema dump; all `tests/db/*.sql` pass after apply.
- Stage changes only in SQL: browser roles get `SELECT` only on the four new tables; no UPDATE/DELETE on `laptop_stage_events` for anyone but service_role.
- Accept/release/Run-test roles: `has_org_role(org, ARRAY['owner','admin','technician'])` (AAL2 for owner/admin is inside it). Auditors: read only.
- Stage keys exactly: `pending`, `testing`, `tested`, `ready_for_sale` (planned `'v2'`). Triggers in transitions exactly: `accept`, `test_result`, `test_again`, `release`, `wipe`.
- Error text for a lost race: `Already accepted by <full_name or email>`.
- Anything simulated: `is_simulated` copied from the discovery; visible Simulated badge; never billable.
- UI copy: never "verified"; planned stage shown as "Planned · v2".
- No change to `agent-handoff/`.
- Commits local only; no push without the owner's go-ahead.

## Review Focus

1. **Two technicians press Accept on the same laptop at once.** One wins, the other sees "Already accepted by …". Pinned by `tests/db/phase2l_laptop_stages.sql` (second call raises, claimed_by is the first user) in Task 1.
2. **Laptop received by hand before its stick ran** (discovery inserted with `device_id` already set). Lands in Pending, shows "Recorded" label, not stuck. Task 1 DB test + Task 4 board label.
3. **Same laptop on two sticks / reported again after Tested.** Still one `laptops` row; a re-report never moves it back to Pending. Task 1 DB test.
4. **Incomplete test (declined / half-run).** Stage stays Testing. Task 1 DB test.
5. **Database update not applied yet** (preview before Lovable apply). Board shows "Waiting for a database update", old dashboard still usable; pop-up keeps working on the old rule. Task 3 unit test on `needsDbUpdate` with the 0027 table-missing error + Task 4 render guard.

---

### Task 1: Migration 0027 + DB acceptance tests (rehearsed locally)

**Files:**
- Create: `drizzle/migrations/0027_laptop_stages.sql`, `drizzle/rollback/0027_laptop_stages.down.sql`, `tests/db/phase2l_laptop_stages.sql`
- Rehearsal scratch: `$SCRATCH/rehearse/` (supabase project dir, dumps)

**Interfaces:**
- Produces (SQL):
  - tables `laptop_stages(key PK, label, position, tone, is_initial, is_terminal, planned)`, `laptop_stage_transitions(from_key, to_key, trigger, PK(from_key,to_key,trigger))`, `laptops(org_id, id, device_code, title, latest_discovery_id, stage_key, is_simulated, claimed_by, claimed_at, first_seen_at, stage_changed_at; UNIQUE(org_id,id), UNIQUE(org_id,device_code))`, `laptop_stage_events(org_id, id bigserial, laptop_id, from_key, to_key, trigger, actor, reason, created_at; FK (org_id, laptop_id))`.
  - `_laptop_move(_laptop uuid, _to text, _trigger text, _actor uuid, _reason text) RETURNS boolean` (false = transition not allowed; caller decides to raise or ignore).
  - `accept_laptop(_laptop uuid) RETURNS jsonb {ok, stage}`; `release_laptop(_laptop uuid) RETURNS jsonb {ok, stage}`.
  - `request_diagnostic(_agent, _test)` replaced: also takes the stick's current laptop (`ORDER BY last_reported_at DESC`) and moves pending→testing (accept for caller) or tested→testing (test_again).
  - `agent_report_diagnostic(...)` replaced: identical except `ORDER BY last_reported_at DESC`.
  - `simulator_prepare(_org, _scenario)`: accepts new scenarios `virtual_laptop`, `virtual_laptop_tested`; for them creates only the simulated enrollment token (no device/drives/policy) and returns `{enrollment_token}`.
  - Triggers: AFTER INSERT/UPDATE OF device_code, payload ON `agent_discoveries` → upsert laptop (pending if new; refresh title/latest_discovery_id; never move stage); AFTER INSERT ON `diagnostic_results` WHERE test='full' AND outcome IN ('pass','fail') → `_laptop_move(..., 'tested', 'test_result', NULL, ...)` ignoring false.
  - Backfill: laptops from existing discoveries; stage `tested` if a full pass/fail result exists for the code, else `pending`.

- [ ] **Step 1: Write `tests/db/phase2l_laptop_stages.sql`** (single DO block, rolls back, same style as `phase2k_diagnostics.sql`). Asserts:
  - a report from an enrolled stick creates exactly one `laptops` row in `pending` with title "<manufacturer> <model>"; a second report and a second stick on the same serial keep one row.
  - a discovery inserted with `device_id` set (laptop received by hand) is still `pending`.
  - technician T1 `accept_laptop` → `testing`, `claimed_by = T1`; T2 `accept_laptop` raises `Already accepted by` …; auditor raises `42501`.
  - authenticated `INSERT/UPDATE/DELETE` on all four tables fails; `UPDATE laptop_stage_events` fails even for the owner.
  - full result `incomplete` → stays `testing`; `fail` → `tested`; a new report afterwards → still `tested`.
  - `request_diagnostic` on a `pending` laptop claims it for the caller and moves to `testing`; on `tested` moves to `testing`, claim unchanged.
  - A → B → A on one stick: the result is filed under A (`device_code` of A).
  - `release_laptop` by a non-claimer technician raises; by the claimer → `pending`, claim cleared.
  - `_laptop_move` to `ready_for_sale` returns false (planned).
  - every move wrote one `laptop_stage_events` row with actor (null for system).
  - simulated discovery → `laptops.is_simulated = true`.
- [ ] **Step 2: Start the local DB** `supabase start` in `$SCRATCH/rehearse` (fresh `supabase init`), apply 0000..0026 with `psql -v ON_ERROR_STOP=1 -f` in order (skip `*_apply.sql`, which are Lovable copies — **confirm by diffing each `_apply` against its sibling first**), seed data by running all existing `tests/db/*.sql` once (they roll back; seed instead with the phase2k setup committed in a separate non-rollback script in scratch). Dump schema → `before.sql`.
  Run: `psql … -f tests/db/phase2l_laptop_stages.sql` → Expected: FAIL (`relation "laptops" does not exist`).
- [ ] **Step 3: Write 0027** (single `BEGIN … COMMIT`; `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP TRIGGER IF EXISTS`, seed with `ON CONFLICT DO NOTHING`, backfill `ON CONFLICT DO NOTHING`; RLS: `org_id`-scoped SELECT for `is_org_member`… *use `is_org_staff(org_id)` OR project grant the same way `agent_discoveries` does — copy its policy*; stages/transitions readable by `authenticated`). Mirror moves into `audit_events` (`action = 'laptops.stage_' || to_key`).
- [ ] **Step 4: Apply 0027 twice; run phase2l** → Expected: PASS (prints its OK line); run every other `tests/db/*.sql` → all PASS.
- [ ] **Step 5: Write the undo** (drop triggers, functions it created, tables; restore 0026's `agent_report_diagnostic`, 0025's `request_diagnostic`, 0013's latest `simulator_prepare` verbatim). Apply undo, dump → diff with `before.sql` → Expected: no differences. Re-apply 0027 → phase2l PASS.
- [ ] **Step 6: Commit** `git add drizzle/migrations/0027_laptop_stages.sql drizzle/rollback/0027_laptop_stages.down.sql tests/db/phase2l_laptop_stages.sql && git commit -m "DB 0027: laptop stages, accept/claim, history"`; stop local Supabase.

### Task 2: Types + query hooks + pure board helpers

**Files:**
- Modify: `src/integrations/supabase/types.ts` (add the four tables + two RPCs by hand, matching 0027; Lovable regenerates later)
- Modify: `src/lib/queries.ts`
- Create: `src/lib/laptop-board.ts`, `src/lib/laptop-board.test.ts`

**Interfaces:**
- Produces:
  - `useLaptopStages()` → `{key,label,position,tone,is_initial,is_terminal,planned}[]` ordered by position; key `["laptop-stages"]`, `staleTime: Infinity`.
  - `useLaptops()` → rows `id, device_code, title, latest_discovery_id, stage_key, is_simulated, claimed_by, claimed_at, stage_changed_at, first_seen_at`; key `["laptops", orgId]`; `refetchInterval: 5000`.
  - `useLaptopEvents(laptopId)` → `from_key,to_key,trigger,actor,reason,created_at` newest first.
  - `acceptLaptop(id: string): Promise<void>` / `releaseLaptop(id: string): Promise<void>` in `src/lib/laptop-board.ts` (supabase.rpc; throw `Error(errorMessage)`).
  - `boardTabs(stages, laptops, mineUserId?: string): { key: string; label: string; count: number; planned: string | null }[]` — one per stage in position order; counts after the Mine filter.
  - `defaultTab(tabs): string` — `pending` if count > 0, else first non-planned tab with count > 0, else `pending`.
  - `needsDbUpdate` (existing, `src/lib/connected-device.ts`) must return true for the 0027-missing error (`relation "public.laptops" does not exist` / PGRST205 "Could not find the table 'public.laptops'").
- [ ] **Step 1: Failing tests** in `laptop-board.test.ts`: `boardTabs` order + counts + planned passthrough; Mine filter; `defaultTab` with and without pending; `needsDbUpdate({ code: "PGRST205", message: "Could not find the table 'public.laptops' in the schema cache" })` → true.
- [ ] **Step 2:** `npx vitest run src/lib/laptop-board.test.ts` → FAIL.
- [ ] **Step 3:** Implement; extend `needsDbUpdate` only if the PGRST205 case fails.
- [ ] **Step 4:** Same command PASS; `npx tsc --noEmit -p .` clean.
- [ ] **Step 5: Commit** "Laptop board: stage hooks and helpers".

### Task 3: Dashboard board + accept, menu rename, onboarding, virtual laptop

**Files:**
- Create: `src/components/nd/laptop-board.tsx`, `src/components/nd/laptop-board.test.tsx`
- Modify: `src/routes/_authenticated/app.index.tsx` (staff view: board on top; header buttons), `src/routes/_authenticated/app.tsx` (menu), `src/routes/_authenticated/app.agents.tsx` (title "Full Computer Test", head title), `src/routes/_authenticated/app.connected.$discoveryId.tsx` (back link text), `src/routes/_authenticated/app.setup.tsx` (step 4 copy), `src/components/nd/availability-panel.tsx` + `docs/STATUS.md` (label)
- Modify: `src/simulator/scenarios.ts`, `src/lib/simulator.functions.ts` (new scenarios + `accept` op)

**Interfaces:**
- Consumes: Task 2 hooks/helpers.
- Produces: `<LaptopBoard />`; `TechnicianOps.acceptLaptop(deviceCode: string): Promise<void>` (finds the laptop by code, calls `accept_laptop`); scenario ids `virtual_laptop`, `virtual_laptop_tested`.
- [ ] **Step 1: Failing component tests** (mock hooks like `connected-popup.test.tsx`): tabs render labels+counts from stages ("Pending 2", "Ready for sale · Planned v2" disabled); a pending row shows **Accept**, clicking calls `acceptLaptop(id)`; an accept error shows its message (toast or inline) — assert `Already accepted by Priya` text appears; Mine toggle filters; Simulated badge on simulated rows; "Recorded" label when the latest discovery has `device_id`; empty board shows the 3 steps and "Try a virtual laptop"; table-missing error shows "Waiting for a database update".
- [ ] **Step 2:** `npx vitest run src/components/nd/laptop-board.test.tsx` → FAIL.
- [ ] **Step 3:** Implement board. Rows: title, device code, stage badge (tone from stage), "Accepted by <memberName>" (via `useMembers`), last-test verdict not required here, time in stage (`relativeTime(stage_changed_at)`); row click → `/app/connected/$discoveryId` with `latest_discovery_id`. Header: primary **Prepare USB stick** (opens `PrepareUsbStick`, owner/admin only per `agents.manage`; technicians get **Full Computer Test** link instead), secondary **Add by hand** (`/app/inventory?intake=true`). Dashboard: board above existing metrics; first-login hint card (localStorage `nexwipe.hint.board`, try/catch) "New here? Prepare a USB stick, or try a virtual laptop."
- [ ] **Step 4:** Menu: first group gets `{ to: "/app/agents", label: "Full Computer Test", icon: Laptop, cap: "agents.view" }` right after Dashboard; remove it from Erasure. Rename page header/head title/back links. Setup step 4 → "Prepare a USB stick" (Full Computer Test → Prepare USB stick). Availability label → "Full Computer Test (read-only)", same note; STATUS.md updated in Task 5.
- [ ] **Step 5:** Simulator: add the two scenarios to `SCENARIOS` with titles "Virtual laptop (lands in Pending)" / "Virtual laptop, accepted and tested"; `runScenario` for them: prepare → enroll "Virtual stick" → heartbeat → `POST /inventory` with a simulated payload (`system: { manufacturer: "SIMULATED", model: "Virtual laptop", serial: "SIMLAP"+suffix, … }`) → for `_tested`: `ops.acceptLaptop(code)` then `POST /diagnostics/result` `{ test: "full", outcome: "fail", result: { tests: { webcam: {outcome:"fail"}, display:{outcome:"pass"} } } }` (boot-stick platform path, no request needed). "Try a virtual laptop" button calls `runSimulatorScenario({ scenario: "virtual_laptop" })` then invalidates `["laptops", orgId]`.
- [ ] **Step 6:** `npx vitest run` all PASS; `npx tsc --noEmit -p .` clean.
- [ ] **Step 7: Commit** "Dashboard laptop board, Accept, Full Computer Test".

### Task 4: Pop-up and laptop screen use stages

**Files:**
- Modify: `src/components/nd/connected-popup.tsx` (+ test), `src/routes/_authenticated/app.connected.$discoveryId.tsx`, `src/lib/queries.ts` (`useConnectedNow` also selects nothing new; join in component)

**Interfaces:**
- Consumes: `useLaptops`, `useLaptopStages`, `acceptLaptop`, `useLaptopEvents`.
- [ ] **Step 1: Failing tests** (popup): when `useLaptops` says a connected laptop is `testing`, no card; `pending` + connected → card with big **Accept** (calls `acceptLaptop`) and an "Open" link; when `useLaptops` errors with table-missing, falls back to today's behaviour (all connected).
- [ ] **Step 2:** FAIL → implement (pending set = laptops with `stage_key = 'pending'` keyed by `device_code`; filter `connectedLaptops` by it; "N waiting" pill when the queue is non-empty but every item is dismissed: small bottom-right button "N laptops waiting" that clears dismissals for those ids).
- [ ] **Step 3:** Laptop screen: header stage badge + "Accepted by <name> · <time>" or an **Accept** button while pending; non-claimer confirm once per laptop per session before Run test/Rescan/Add/grade ("This is <name>'s laptop. Continue anyway?", AlertDialog); **Release** for claimer/owner/admin; History tab prepends stage events ("<name> accepted", "Moved to Tested by a test result"). Remove the `misfiled` branch and `stickPosition` "misfiled" usage (0027 fixes the server); keep "moved".
- [ ] **Step 4:** `npx vitest run` PASS (update `stickPosition` tests: drop misfiled case or keep function returning it but unused — **remove it**), tsc clean.
- [ ] **Step 5: Commit** "Pop-up asks to Accept; laptop screen shows stage and claim".

### Task 5: STATUS, handover text, full verification

**Files:** `docs/STATUS.md`, `src/components/nd/availability-panel.tsx` (already), spec status line.
- [ ] **Step 1:** STATUS: new bullet for 0027 (stages, Accept, board, rename, virtual laptop, A→B→A fixed) with what was rehearsed and what is unverified; mark 0027 "must be applied in Lovable".
- [ ] **Step 2:** `npx vitest run` → all PASS; `npx tsc --noEmit -p .` → clean.
- [ ] **Step 3: Commit** "Docs: laptop board and stages (0027)".
