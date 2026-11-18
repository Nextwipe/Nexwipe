# Laptop board, stages and claiming

Date: 2026-11-18 · Status: design, awaiting owner approval · builder-checked; *my call* marks Claude's decisions · builds on
`2026-11-18-connected-laptop-ux-design.md` (branch `connected-laptop-ux`)

## Why

Clients are non-technical. After login they don't know what to do: the dashboard's main button
("Receive devices") opens manual serial entry, and the stick flow hides under "Agents & stations"
in the Erasure menu. Several technicians (e.g. 10 in one factory) are logged in at once; a laptop
that connects must be accepted by exactly one of them, and who claimed what must be kept. The
laptop's journey will grow (testing today; wiping, grading, shipping later), so its state must be
general, not hard-coded tabs.

## What the owner decided

- The dashboard is a **laptop board**: every laptop that reported, one tab per stage with counts.
- **Pending** = NexWipe has reported the laptop and nobody has accepted it.
- **Accepting** claims the laptop for that user; it then continues on the Full Computer Test page /
  laptop screen. Two users can never both accept one laptop; who claimed what is recorded.
- Stages are **data, not code** (approach A below). Later stages are added without rewriting the
  board.
- **The final stage means "wiped and ready for sale"** (owner's meaning of "in inventory"). Wiping is
  not built, so today nothing can reach it: the board shows its tab as "Planned · v2" (AGENTS.md:
  unbuilt shown as Planned). Starting stages: **Pending → Testing → Tested → Ready for sale
  (planned)**.
- The app's existing "Add to inventory" (a `devices` record: registered/received) is **not** a
  stage. It is shown as a label next to the stage ("Recorded · NW-…") at any stage (*my call*,
  from the owner's answer: a laptop received by hand still starts in Pending and must be accepted
  and tested).
- Migrations 0000–0026 are applied in Lovable (owner, 2026-11-18); the new one is 0027.
- "Agents & stations" is renamed **Full Computer Test** and moves to the top of the menu.
- People with no laptop at hand can **try it with a virtual laptop** (the simulator), labelled
  Simulated everywhere.
- The Windows command window stays (NexWipe runs from the stick on a laptop that never opens the
  cloud site); no change to the helper's launch.

## Goals

1. Stored, per-laptop current stage, changed only by SQL, with an append-only history (who, when,
   from, to, why).
2. Stage list in a table: key, label, order, tone, `is_initial`; allowed transitions in a table.
   The board's tabs, counts and badges are generated from it.
3. `accept_laptop` RPC: atomic claim (row lock / conditional update); the loser gets a clear error
   "Already accepted by <name>".
4. Automatic transitions from trusted events: first report → Pending; finished test result →
   Tested; added to inventory → In inventory.
5. Dashboard board + pop-up "Accept" + Full Computer Test rename + onboarding steps + virtual laptop.

## Non-goals

- No wiping, shipping or grading stages yet (the model must allow them; nobody builds them now).
- No per-user permissions beyond the claim (see "Who may act" — *my call*).
- No change to the Windows helper, the station program or the agent API contract.
- Chromebooks keep their own track; laptops with `device_class = 'chromebook'` are out of scope.

## Anti-goals

- Two people both "own" a laptop, or a claim that isn't recorded.
- A stage changed from the browser by a table write (must be RPC/trigger only, like jobs).
- Simulated laptops counted with real ones without a visible Simulated label.
- A stage list baked into the React code (adding Wiping must not need board changes).

## Approaches considered

- **A. Stored stage + stages table + one SQL transition path (chosen).** General, enforces order,
  full history, matches the project's "state changes only in SQL" rule. Costs a bigger migration.
- B. Derive the stage in the browser from facts. No stored state; but new stages need code, screens
  can disagree, order can't be enforced. Rejected.
- C. Free-text status column. Can't stop double-accept or keep reliable history. Rejected.

## Design

### Identity of a laptop

One laptop = one `device_code` per org (already shared by all sticks that report it; see
`groupLaptopCards`). New table keyed by `(org_id, device_code)`.

### Schema (migration `0027_laptop_stages`, with `drizzle/rollback/0027_laptop_stages.down.sql`)

- `laptop_stages` (global reference data): `key text PK`, `label text`, `position int`,
  `tone text` (neutral|info|success|warning|danger), `is_initial bool`, `is_terminal bool`,
  `planned text null` (e.g. 'v2': shown as Planned, no transition may enter it while set).
  Seeded: `pending` (initial), `testing`, `tested`, `ready_for_sale` (terminal, planned 'v2').
- `laptop_stage_transitions`: `(from_key, to_key)` PK, `trigger text` (`accept` | `test_result` |
  `manual`). Seeded: pending→testing (accept), testing→tested (test_result), tested→testing
  (test_again), testing→pending (release). tested→ready_for_sale (wipe) is seeded but blocked while
  the stage is planned.
- `laptops`: `org_id`, `id uuid`, `device_code`, `stage_key` FK, `is_simulated bool`,
  `claimed_by uuid` (auth user), `claimed_at`, `first_seen_at`, `stage_changed_at`,
  `UNIQUE (org_id, id)`, `UNIQUE (org_id, device_code)`.
- `laptop_stage_events` (append-only, trigger-written): `org_id`, `laptop_id` (composite FK),
  `from_key`, `to_key`, `actor uuid null` (null = system), `reason text`, `created_at`.
  No UPDATE/DELETE grants. Also mirrored into `audit_events` like other tenant changes.

### SQL behaviour

- `_laptop_move(_org, _laptop, _to, _trigger, _actor, _reason)` (internal, SECURITY DEFINER):
  locks the row (`FOR UPDATE`), checks `(stage_key, _to, _trigger)` exists in transitions, updates,
  writes the event. All transitions go through it.
- Trigger on `agent_discoveries` insert/update: ensure a `laptops` row for `(org_id, device_code)`
  exists in `pending` (`is_simulated` copied from the discovery).
- Trigger on `diagnostic_results` insert with `test = 'full'` and outcome in (pass, fail): move to
  `tested` if allowed. Incomplete runs do not move it.
- `accept_laptop(_laptop uuid)` RPC (authenticated): caller must be owner/admin/technician
  (*my call*: auditors see the board but cannot accept), the laptop must be in `pending`; moves to
  `testing` with trigger `accept`, sets `claimed_by/at`. Concurrent second call fails with
  `Already accepted by <display name>`.
- `request_diagnostic` (Run test) gains (*my call*): on a Pending laptop it first accepts it for the
  caller (same atomic path, so it can lose to a concurrent Accept); on a Tested laptop it moves it
  back to Testing (trigger `test_again`), claim unchanged.
- **Fix the A → B → A misfiling in 0027** (*my call*): `agent_report_diagnostic` files results under
  the stick's discovery with the newest `last_reported_at`, not `reported_at`; otherwise the
  automatic move to Tested would move the wrong laptop. The UI's "misfiled" guard is then removed.
- `release_laptop(_laptop)`: claimer or owner/admin (`has_org_role`, AAL2) puts it back to
  `pending` and clears the claim (transition testing→pending, trigger `manual`).
- Browser roles: SELECT only on the four tables (RLS by org); no INSERT/UPDATE/DELETE.
- Backfill: one `laptops` row per existing `(org_id, device_code)`; stage derived once from facts
  (has full pass/fail result → `tested`; else `pending`).

### Who may act on a claimed laptop (*my call*, owner may change)

Everyone in the company sees every laptop. Run test / Rescan / Add to inventory / grade stay as
today (any technician), but the laptop screen shows "Accepted by Priya" prominently and, for a
non-claimer, the buttons ask "This is Priya's laptop. Continue anyway?" once. Rationale: no hard
lock means a sick colleague can't strand a laptop; owner/admin can also Release. Making it a hard
lock later is one check in the RPCs.

### Dashboard = laptop board

- Replaces the top of `src/routes/_authenticated/app.index.tsx` for staff roles (customer viewers
  keep "Your projects").
- Header: "Laptops" + primary **Prepare USB stick** + secondary **Add by hand** (old Receive
  devices).
- Planned stages show as a disabled tab "Ready for sale · Planned v2".
- Tabs generated from `laptop_stages` ordered by `position`, each with a count; default tab
  Pending if it has any, else Testing. A "Mine" toggle filters to `claimed_by = me`.
- Each row: laptop title, device code, stage badge, claimed-by name, connected dot, last test
  verdict, time in stage. Pending rows have a big **Accept** button; other rows open the laptop
  screen.
- The existing numbers/activity move below the board.
- Empty board (no laptop ever): the 3-step onboarding card (Prepare stick → plug in and
  double-click Start NexWipe → accept it here) and a "No laptop at hand? **Try a virtual laptop**"
  button. *My call*: this needs a **new simulator scenario** (the current one only fakes erasure
  jobs and pre-creates an inventory device): a simulated stick reports one laptop through the real
  agent API (AGENTS.md) so it lands in Pending marked Simulated; after Accept, Run test can deliver a
  simulated full-suite result through the same API. Simulated laptops are never billable or
  certificate-eligible and always show the Simulated badge.

### Pop-up

The corner pop-up shows laptops that are **Pending and connected right now** (*my call*: old
pending laptops from earlier weeks stay on the board's Pending tab without nagging anyone), with
**Accept** as its big button (Open stays as a link). Closing it leaves the laptop in Pending on the board; a small
"N waiting" pill stays at the bottom while any are pending. When someone else accepts, it
disappears for everyone on the next poll.

### Laptop screen

Header gains the stage badge and "Accepted by <name> · <time>" (or an Accept button while
pending). History tab lists stage events ("Priya accepted · 14:02", "Moved to Tested by test
result · 14:20").

### Menu and naming

- "Agents & stations" → **Full Computer Test**, first item after Dashboard; URL `/app/agents`
  unchanged. Page title and back links renamed.
- Setup checklist step 4 → "Prepare a USB stick". Availability panel label updated together with
  `docs/STATUS.md` (AGENTS.md rule).

## Constraints

- Migration rules (AGENTS.md): rehearsed on a local throwaway DB on top of 0000..0026 with data,
  re-run safely, undo restores an identical schema dump, all `tests/db` pass; new
  `tests/db/phase2l_laptop_stages.sql` covers: double accept (one wins), forbidden transitions,
  browser cannot write tables, simulated flag copied, backfill, auto moves, append-only history.
- Order: push → owner applies 0027 in Lovable with the exact prompt → preview → Publish. The UI must
  cope with the table missing (show "Waiting for a database update", like `needsDbUpdate`).
- No SQL against the live database from this machine.

## Left to the builder

- Exact column types/indexes, event mirroring into `audit_events`, error codes.
- Board component structure, row density, phone layout (rows stack; tabs scroll horizontally).
- How the "N waiting" pill and pop-up share state.
