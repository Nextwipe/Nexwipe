# Connected-laptop UX: pop-up + simple laptop screen

Date: 2026-11-18 · Status: design, awaiting owner approval · reviewed by a builder check; items marked *my call* were settled by Claude

## Why

Technicians are non-technical and find the current screens overwhelming. The Agents & stations
page and the connected-laptop page (`src/routes/_authenticated/app.connected.$discoveryId.tsx`)
show every detail at once (connection metadata, barcode, all actions, grade, tag, full diagnostics
table, hardware sections, raw JSON). They have to hunt for laptops and press Refresh to see new
ones. The owner wants the app to come to them: a laptop connects → a pop-up says so → one tap
opens a screen with a few big buttons, details tucked behind tabs.

## How the floor works (from the owner)

- Hundreds of laptops come in; there are only a **handful of NexWipe USB sticks**.
- Any technician uses any stick. The app cannot know which person started which laptop.
- It must stay traceable **which stick did what** to each laptop.
- Consequence: at most one laptop per stick is connected at any moment, so "currently connected"
  is a short list (≈ number of sticks). Everyone in the company sees the same pop-up list.

## Goals

1. Within ~5 s of a technician opening Start NexWipe on a laptop, every signed-in staff member
   sees a "Laptop connected" pop-up on whatever app page they are on.
2. Several connected laptops → one pop-up card that flips between them (carousel).
3. "Open laptop" leads to a simple laptop screen: big action buttons on top, information behind
   tabs.
4. Each laptop shows plainly which stick reported and tested it, and when.

## Non-goals

- No database / migration change (owner chose polling). No Supabase Realtime.
- No auto-start from the USB stick: Windows does not run programs from USB on plug-in; the
  technician still double-clicks Start NexWipe. The pop-up fires when the stick reports.
- No new actions. Buttons only expose what the app already does. Erase stays "Planned".
- No change to the Windows helper or the station program.

## Anti-goals (would be a failure even if it works)

- Pop-up nags: re-appearing for laptops a person already dismissed or opened, or for laptops no
  longer connected.
- Showing a laptop as connected after its stick moved to another laptop.
- Any wording implying hardware is "verified" or that erasure happens (AGENTS.md rules).
- Hiding the trust/safety labels (Simulated, Synthetic test hardware, Needs review) — they move
  but stay visible on the screen without opening a tab.

## Approaches considered

1. **Polling (chosen).** The app re-reads connected laptops every 5 s while open. No DB change,
   ships as a normal code push, delay ≤ ~5 s, negligible load with a handful of users.
2. **Supabase Realtime push.** ~1 s latency, but needs a migration via Lovable (publication change,
   rehearsal, undo) and more moving parts. Rejected for now; can replace polling later without
   changing the UI.

Visual choices (picked by the owner from mockups in `.superpowers/brainstorm/`):
- Pop-up: **A · corner card** (bottom-right, "1 of 3", prev/next, big "Open laptop"). Rejected:
  centre modal (interrupts work), stacked list.
- Laptop screen: **A · big button row + tabs**. Rejected: "do this next" guided steps, buttons-left
  split.

## Design

### "Connected" definition (fixes an existing ambiguity)

A stick is an `agents` row; each (stick, laptop) pair is an `agent_discoveries` row. A laptop is
**connected** when it is the **most recently reported laptop of an active stick whose heartbeat is
< 90 s old** (`isOnline` in `src/lib/connected-device.ts`). Only the latest discovery per stick
counts — today `groupLaptopCards` marks every laptop a stick ever reported as online while that
stick is online, which would make old laptops pop up after the stick moves on. Put this rule in one
pure function in `src/lib/connected-device.ts` with a unit test, and use it for both the pop-up and
the online dot.

Simulated discoveries do appear, but the card carries the Simulated badge (AGENTS.md: anything
simulated is visibly labelled). This also lets the pop-up be tested with the simulator.

### Pop-up (corner card)

- Mounted once in the signed-in layout (`src/routes/_authenticated/app.tsx`), so it shows on every
  app page; only for roles with `agents.view`.
- Data (*my call*): a **light** query, not `useConnectedDevices` (that pulls up to 100 rows with
  full hardware `payload`). New `useConnectedNow` in `src/lib/queries.ts`: active agents with their
  heartbeat + each one's latest discovery (id, device_code, title fields only — no `payload`;
  derive the title from a small column set or `payload->system` subfields), `refetchInterval:
  5000`, background polling off. When its result changes (new connected id / disconnect), it
  invalidates `["connected-devices", orgId]` so the Agents page refreshes too.
- Card content: green dot "Laptop connected", laptop title (`deviceSummary(...).title`), device
  code, stick name, "just now / 2 min ago", big **Open laptop** button, "1 of N" with prev/next
  and dots when N > 1, and a small ✕ / "Later".
- Order: newest connection first. A newly connected laptop jumps to the front.
- Dismiss rules (*my call*): "Later" or "Open laptop" hides that laptop **in this browser**. It comes
  back only when this browser has seen it go not-connected and then connected again, or after 1 hour
  as a safety net (covers disconnects that happened while no tab was open). Stored in `localStorage`
  as {discovery id → dismissed-at}, wrapped in try/catch. Not keyed on `reported_at` (never changes
  for a stick+laptop pair; migration 0009 updates the row in place) nor `last_reported_at` (bumps on
  every Rescan, which would nag). When no undismissed connected laptops remain, the card disappears.
  Being on that laptop's own page also suppresses its card.
- Accessible: `role="status"` / polite live region announcement; buttons keyboard reachable.

### Laptop screen (big buttons + tabs)

Replaces the layout of `app.connected.$discoveryId.tsx`; existing logic (actions, RPCs, dialogs,
pending/stale states) is reused, only re-arranged.

Header: laptop title, device code, connected dot, one summary pill (e.g. "Test: 1 problem" /
"Test: all passed" / "Not tested"), plus trust labels (Simulated / Synthetic test hardware /
Needs review) when present.

Big buttons (large tiles, icon + one word or two), shown/disabled with today's rules:

| Button | Existing behaviour it uses | Shown when |
|---|---|---|
| Run test (primary) | `runDiagnostic("full")` | always; disabled offline / pending / old helper with one-line reason |
| Add to inventory | `AddToInventoryDialog` | not yet in inventory and allowed; otherwise tile shows "In inventory · <tag>" linking to the device |
| Set grade | grade select from `GradeAndTag` | in inventory |
| Print tag | tag dialog from `GradeAndTag` | in inventory |
| Rescan | `act("rescan")` | always; disabled when the stick has moved on (below) |
| Erase · Planned | disabled | always (AGENTS.md: unbuilt shown as Planned) |

**Stick has moved on** (*my call*): actions go to the stick (`d.agent_id`), and test results are
filed under the stick's latest laptop (migration 0024). So on a laptop that is no longer its
stick's current laptop, Run test and Rescan are disabled with the line "This stick is now on
another laptop. Start NexWipe on this laptop again to test it." Uses the same "connected" rule.

Found while planning: the server files a test result under the stick's discovery with the newest
`reported_at` (first report), so after A → B → A results would land on B. Until a follow-up
migration orders by `last_reported_at`, Run test on such a laptop is disabled with "Results from
this stick would be filed under another laptop. Use a different stick for this laptop."

"Reboot into NexWipe" is removed from the main screen (the restart-into-stick hand-off was
replaced; STATUS.md). Status lines that today sit under the actions (test pending/stale, reboot
status, revoked station, old helper) become one short line under the buttons, only when relevant.

Tabs (one visible at a time, default **Test report**):
- **Test report** — counts ("11 passed · 1 failed: Webcam"), then the existing
  `DiagnosticResultsCard` rows. Empty state: "Not tested yet — press Run test."
- **Hardware** — the existing `SectionCard`s.
- **Barcode** — `DeviceBarcode` + device code.
- **History** — which stick did what (below), plus the raw report under a collapsed "Technical
  details" for support.

### Which stick did what (History tab)

Built from data already stored, no migration:
- Each `agent_discoveries` row for this laptop (`device_code`): "<stick name> · first reported
  <time> · last <time> · <n> reports".
- Each `diagnostic_results` row (`agent_id` is stored): "<stick name> · test suite · Fail
  (Webcam) · <time>". Needs `agents(name)` added to the diagnostics select.
- Newest first.

### Agents & stations page

Keeps the previous simplification (laptops first, sticks folded). Remove "Use Refresh…" wording
since the list now updates by itself. Optionally show, per stick, "Last laptop: <title>"
(builder's call).

## Constraints

- Code-only change; no migration, so the handover says "no database change".
- Security boundary unchanged: all actions call existing RPCs; `can()` only hides UI.
- `docs/STATUS.md` updated (connected devices now update live; pop-up added).
- Works on narrow screens: tiles wrap to 2–3 per row; pop-up full width at the bottom on phones.

## Left to the builder

- Exact icons, tile sizes, colours (use existing `Button`/`ToneBadge`/tabs components; check
  `src/components/ui` for a tabs component before writing one).
- Carousel mechanics (simple index state; no new dependency).
- Tests: unit test for the "connected" rule and the dismiss logic; drive the pop-up and laptop
  screen in the browser with a simulated stick before claiming done.
