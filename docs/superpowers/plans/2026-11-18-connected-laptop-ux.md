# Connected-laptop UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Laptop connected" corner pop-up on every app page (carousel for several), opening a simplified laptop screen with big buttons and tabs, including which stick did what.

**Architecture:** Pure rules in `src/lib/connected-device.ts` (which laptop each stick is on now) and `src/lib/connected-popup.ts` (dismissals), unit-tested. A light 5 s polling query feeds a pop-up mounted in the signed-in layout. The laptop page is re-arranged around existing actions; no new RPCs, no migration.

**Tech Stack:** React + TanStack Router/Query, Supabase JS (PostgREST), shadcn/ui (`tabs.tsx`, `button.tsx`), vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-connected-laptop-ux-design.md`

## Global Constraints

- No database migration, no SQL against any database, no change to `agent-handoff/`.
- Connected = most recently reported (`last_reported_at`) laptop of a stick with `status = 'active'` and heartbeat < 90 s (`isOnline`).
- Poll every **5000 ms**, only while the tab is visible (`refetchIntervalInBackground: false`, the default).
- Dismissal re-arms when this browser sees the laptop not connected, or after **1 hour** (3 600 000 ms).
- Copy: never say hardware is "verified"; Erase tile reads "Erase" + "Planned"; Simulated / Synthetic test hardware / Needs review labels stay visible in the header.
- Security boundary unchanged: actions call the existing RPCs/functions; `can()` only hides UI.
- `localStorage` reads/writes wrapped in try/catch; page must work without it.
- Do not commit or push without the owner's go-ahead (repo memory); commits below are local.

## Review Focus

1. **Stick moved back to an older laptop (A → B → A).** Server functions (0024–0026) file test results under the stick's discovery with the newest `reported_at` (first report), i.e. B, while the stick is really on A. Expect: Run test on A is disabled with "Results from this stick would be filed under another laptop. Use a different stick for this laptop." Test in Task 1 (`stickPosition` → `"misfiled"`).
2. **Stick moved on (A → B), worker opens A.** Expect Run test and Rescan disabled with "This stick is now on another laptop. Start NexWipe on this laptop again to test it." Test in Task 1 (`"moved"`).
3. **Same laptop reported by two sticks, one online.** Expect one pop-up card, online. Test in Task 1 (`connectedLaptops` de-dupes by `device_code`).
4. **Rescan bumps `last_reported_at` on a dismissed laptop.** Expect no re-pop. Test in Task 2.
5. **`localStorage` throws (private window).** Expect pop-up still works, dismissals last for the tab session only. Test in Task 2.

---

### Task 1: "Which laptop is each stick on" rules

**Files:**
- Modify: `src/lib/connected-device.ts` (add functions; change `groupLaptopCards` online rule)
- Test: `src/lib/connected-device.test.ts`

**Interfaces:**
- Produces:
  - `type StickRow = { id: string; agent_id: string; device_code: string | null; reported_at: string | null; last_reported_at: string | null; agents: { status: string | null; last_heartbeat_at: string | null } | null }`
  - `connectedLaptops<T extends StickRow>(rows: T[], now?: number): T[]` — per `agent_id` take the row with max `last_reported_at`; keep those whose stick is active and `isOnline`; de-dupe by `device_code ?? id` (keep newest); sort by `last_reported_at` desc.
  - `stickPosition(stickRows: Pick<StickRow,"id"|"reported_at"|"last_reported_at">[], discoveryId: string): "current" | "moved" | "misfiled"` — `stickRows` are all discoveries of one stick. `"moved"` if `discoveryId` is not the max-`last_reported_at` row; else `"misfiled"` if it is not the max-`reported_at` row; else `"current"`.

- [ ] **Step 1: Write failing tests** in `describe("connectedLaptops")` and `describe("stickPosition")`:
  - stick S reported A (last 14:00) then B (last 14:09), heartbeat fresh → `connectedLaptops` returns `[B]` only.
  - stick heartbeat stale → `[]`; stick `status: "revoked"` → `[]`.
  - sticks S1 and S2 both latest on `device_code "NW-A"`, both online → one row, the newer.
  - two sticks on different laptops → both, newest `last_reported_at` first.
  - `stickPosition([A{rep 13:00,last 14:00}, B{rep 13:30,last 14:09}], "A")` → `"moved"`; `"B"` → `"current"`.
  - `stickPosition([A{rep 13:00,last 14:20}, B{rep 13:30,last 14:09}], "A")` → `"misfiled"`.
  - existing `groupLaptopCards` test: add case — stick moved A → B, A's card `anyOnline === false`, B's `true`.
- [ ] **Step 2:** `npx vitest run src/lib/connected-device.test.ts` → new tests FAIL (not exported).
- [ ] **Step 3:** Implement both functions; make `groupLaptopCards`'s `onlineOf` true only for rows that `connectedLaptops(rows, now)` returns (compute that set once). Its `DiscoveryLike` gains `agent_id` and `reported_at`; `CONNECTED_COLUMNS` already selects both.
- [ ] **Step 4:** Same command → PASS, and `npx tsc --noEmit -p .` clean.
- [ ] **Step 5:** `git commit -m "Connected laptops: one current laptop per stick"`

### Task 2: Pop-up dismissal rules

**Files:**
- Create: `src/lib/connected-popup.ts`
- Test: `src/lib/connected-popup.test.ts`

**Interfaces:**
- Produces:
  - `type Dismissals = Record<string, number>` (discovery id → dismissed-at ms)
  - `DISMISS_MAX_MS = 3_600_000`
  - `pruneDismissals(d: Dismissals, connectedIds: string[], now: number): Dismissals` — drops ids not in `connectedIds` (seen disconnected → re-arm) and entries older than `DISMISS_MAX_MS`. Returns the same object reference when nothing changed.
  - `popupQueue<T extends { id: string }>(connected: T[], d: Dismissals, hideId?: string): T[]` — connected minus dismissed minus `hideId` (the laptop page currently open), order kept.
  - `loadDismissals(): Dismissals` / `saveDismissals(d: Dismissals): void` — key `"nexwipe.popup.dismissed"`, JSON, try/catch; load returns `{}` on any error or bad JSON.

- [ ] **Step 1: Failing tests:**
  - dismissed A, A still connected, 10 min later → `popupQueue` excludes A (covers Rescan: nothing depends on `last_reported_at`).
  - A missing from `connectedIds` → `pruneDismissals` removes A → next time A connects it is queued.
  - dismissed 61 min ago → removed.
  - `hideId` excludes that laptop.
  - with `globalThis.localStorage` stubbed to throw on `getItem`/`setItem` → `loadDismissals()` returns `{}`, `saveDismissals` does not throw.
- [ ] **Step 2:** `npx vitest run src/lib/connected-popup.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** `git commit -m "Connected pop-up: dismissal rules"`

### Task 3: Light polling query + corner pop-up

**Files:**
- Modify: `src/lib/queries.ts` (add `useConnectedNow`)
- Create: `src/components/nd/connected-popup.tsx`
- Modify: `src/routes/_authenticated/app.tsx` (mount once, next to `<Outlet />`)

**Interfaces:**
- Consumes: `connectedLaptops` (Task 1), `pruneDismissals`, `popupQueue`, `loadDismissals`, `saveDismissals` (Task 2), `relativeTime` (`src/lib/jobs.ts`), `SimulatedBadge`.
- Produces: `useConnectedNow(): UseQueryResult<ConnectedNowRow[]>` where `ConnectedNowRow = StickRow & { is_simulated: boolean; sys: { manufacturer?: string; model?: string } | null; agents: { name: string; status: string | null; last_heartbeat_at: string | null } | null }`; `<ConnectedPopup />` (no props).

- [ ] **Step 1:** `useConnectedNow`: key `["connected-now", orgId]`, select `"id, agent_id, device_code, reported_at, last_reported_at, is_simulated, sys:payload->system, agents!inner(name, status, last_heartbeat_at)"`, `.eq("org_id", orgId).eq("agents.status", "active").order("last_reported_at", { ascending: false }).limit(200)`, `refetchInterval: 5000`, `retry` same as `useConnectedDevices` (`needsDbUpdate`). Returns raw rows; the component applies `connectedLaptops`. When the set of connected ids differs from the previous result, `invalidateQueries(["connected-devices", orgId])`.
- [ ] **Step 2:** `ConnectedPopup` per mockup A (`.superpowers/brainstorm/*/content/popup-v2.html`, card A): fixed bottom-right (`fixed bottom-4 right-4 z-50 w-80`; on `< sm` full width with 16px gutter); green dot + "Laptop connected" + "1 of N"; title from `sys.manufacturer + sys.model` (fallback "Unknown laptop"); device code; "<stick name> · <relativeTime(last_reported_at)>"; `SimulatedBadge` when `is_simulated`; big primary **Open laptop** (`Link` to `/app/connected/$discoveryId`, also dismisses); prev/next + dots when N > 1; "Later" dismisses current. Wrapper `role="status" aria-live="polite"`. Hidden when queue empty or `!can(role, "agents.view")`. `hideId` = `discoveryId` param when on that route (`useParams({ strict: false })`). New arrivals: keep index pointing at the newest (index 0) when the queue's first id changes.
- [ ] **Step 3:** `npx tsc --noEmit -p .` clean; `npx vitest run` all pass.
- [ ] **Step 4: Browser check** (signed-in local dev server, or the owner's preview): with the agent simulator from `/app/simulator` producing a report (or a real stick), the card appears within ~5 s on Inventory; "Later" hides it; Rescan does not bring it back; two laptops show "1 of 2" and next works. Note what was and wasn't checked.
- [ ] **Step 5:** `git commit -m "Laptop connected pop-up on every page"`

### Task 4: Laptop screen — big buttons, tabs, History

**Files:**
- Modify: `src/routes/_authenticated/app.connected.$discoveryId.tsx`
- Modify: `src/lib/queries.ts` (`DIAGNOSTIC_COLUMNS` += `agent_id, agents(name)`; add `useLaptopHistory(deviceCode)` and `useStickDiscoveries(agentId)`)
- Possibly modify: `src/components/nd/device-tag-dialog.tsx` (split `GradeAndTag` into `GradeSelect` + `PrintTagButton` exports, same behaviour)

**Interfaces:**
- Consumes: `stickPosition` (Task 1); existing `act`, `runDiagnostic`, `AddToInventoryDialog`, `DiagnosticResultsCard`, `SectionCard`, `DeviceBarcode`, `deviceSections`.
- Produces: `useLaptopHistory(deviceCode: string | null)` → discoveries for that code with `agents(name)`: `id, reported_at, last_reported_at, report_count, agents(name)`; `useStickDiscoveries(agentId: string | null)` → `id, reported_at, last_reported_at` for that stick.

- [ ] **Step 1:** Header: title, device code, `OnlineDot` (online = `stickPosition === "current"` and stick online), one pill: "Not tested" / "Test: all passed" / "Test: N problem(s)" from latest full-suite result; trust badges as today. Remove the connection meta line and the barcode from the header.
- [ ] **Step 2:** Tile row (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3`, each tile ≥ 88px tall, icon + label): **Run test** (primary), **Add to inventory** / "In inventory · <tag>" link, **Set grade**, **Print tag**, **Rescan**, **Erase** (disabled, "Planned"). Grade/Print only enabled when in inventory, with "Add to inventory first" as the reason. Existing disable rules kept; additionally Run test + Rescan disabled when `stickPosition` is `"moved"`, Run test disabled when `"misfiled"` (copy from Review Focus 1–2). One reason line under the tiles, only the highest-priority one (revoked > moved/misfiled > offline > old helper > test pending/stale). Drop the Reboot button and its dialog/status line.
- [ ] **Step 3:** `Tabs` (default `report`): **Test report** (summary line "11 passed · 1 failed: Webcam" + `DiagnosticResultsCard`; empty: "Not tested yet — press Run test."), **Hardware** (`SectionCard` grid + Needs review box), **Barcode** (`DeviceBarcode` + code), **History** (merged list newest first: "<stick> · first reported … · last … · N reports" per discovery, "<stick> · test suite · Pass/Fail (parts) · time" per diagnostic; then collapsed "Technical details" with the raw report).
- [ ] **Step 4:** `npx tsc --noEmit -p .`, `npx vitest run` pass; browser check of the page at desktop and 390 px width: tiles wrap, no horizontal scroll, tabs switch, History names the stick.
- [ ] **Step 5:** `git commit -m "Laptop screen: big buttons and tabs, stick history"`

### Task 5: Agents page wording, STATUS, final checks

**Files:**
- Modify: `src/components/nd/station-discoveries.tsx` (online dot via Task 1 rule is automatic; description stays one line)
- Modify: `src/routes/_authenticated/app.agents.tsx` (remove the "ponytail" thousands-of-sticks comment: only a handful of sticks exist)
- Modify: `docs/STATUS.md` (Connected devices bullet: list updates itself every 5 s; "Laptop connected" pop-up; laptop screen tabs; checks run and what is unverified; misfiled-results server quirk noted as follow-up needing a migration)

- [ ] **Step 1:** Edits above.
- [ ] **Step 2:** `npx vitest run` → all pass; `npx tsc --noEmit -p .` → clean.
- [ ] **Step 3:** `git commit -m "Docs: connected-laptop pop-up and screen"`; report to the owner: no database change, nothing pushed, follow-up migration idea (`ORDER BY last_reported_at` in the 0024–0026 result filing).
