# Plan — Step 18 — What this means for NexWipe, and open gaps

Mirrors: research [18-nexwipe-implications/README.md](../../../research/blancco-drive-eraser/18-nexwipe-implications/README.md)

## In short
The research said Blancco's real value is the **rules around** the wipe commands. This plan turns each lesson into a
concrete NexWipe build item and says where it lives. Three things are new compared with the research page, because the
owner has now decided to build erasure: (1) the **NexWipe Eraser** is added to the web app as a **new section**, and no
existing section changes; (2) one `AGENTS.md` rule must change first, because today every physical station is
read-only; (3) the list of new database tables, each shipped as a migration with an undo file and applied by the owner
through Lovable. Until each part is built and tested, the app shows it as "Planned" with its phase.

## 18.1 Already matching NexWipe's direction

| # | Research item | NexWipe plan | Phase |
|---|---|---|---|
| 1 | Org-wide identical boot sticks that connect themselves (Configuration Tool + USB Creator model) = the `org-sticks` design (`docs/superpowers/specs/2026-11-26-org-sticks-design.md`) | Reuse the same idea for eraser sticks: one signed `nexwipe-setup.json` per company, written to many sticks by the **NexWipe Stick Creator** (Windows 10/11), each stick registers itself and is separately revocable. The eraser stick is a **separate image and separate key type** from the read-only org stick, so the org-sticks work (migration 0028, already applied through Lovable) is not changed | V1 |
| 2 | Hardware/asset reporting before any erasure (Blancco's asset report and asset licences) | Same: the eraser sends an asset report first (step 05 / step 13 plans); "asset report credits" kept as a counting row next to wipe credits (no charge in V1; payment Later) | V1 |
| 3 | Chromebooks as a separate track; Blancco's manual does not claim its factory reset proves deprovisioning; NexWipe's rule "a Powerwash or setup screen is not proof of deprovisioning or erasure" is consistent | Kept exactly. The Chromebook network process ([15-special-hardware/chromebooks.md](../15-special-hardware/chromebooks.md)) records "Factory reset reported by the Chromebook" in the existing Chromebook track, never "Erased" or "Deprovisioned" | Later |

## 18.2 Lessons worth copying if erasure is ever built

Erasure is now being built, so every lesson becomes a requirement.

| # | Research lesson | NexWipe requirement | Where planned | Phase |
|---|---|---|---|---|
| 4 | Status vocabulary: only Erased / Not erased per drive plus information exceptions; never "verified hardware" | Same two results per drive + exceptions; UI and report use `src/lib/hardware-origin.ts`-style honest labels; the word "verified" never describes hardware | [11-errors-and-result](../11-errors-and-result/README.md) | V1 |
| 5 | Mandatory vs optional steps decide the result; optional failures become visible exceptions | Same rule, computed in the engine and **re-checked in SQL** when the report arrives (the web app never trusts a result it can recompute) | 11 | V1 |
| 6 | Any read/write error → Not erased; write-error threshold (default **5**) stops early | Same, same default 5 | [08-erasure-settings](../08-erasure-settings/README.md), 11 | V1 |
| 7 | Report the level actually reached ("Exceeds NIST Purge" vs "Clear", "Device is SSD…") | Same: report states Purge or Clear actually reached, plus "Device is an SSD" style exceptions; never certification claims | 11, [13-custom-fields-and-report](../13-custom-fields-and-report/README.md) | V1 |
| 8 | Enforce a final verification; NIST needs ≥ 10%; offer 100% | Same: final verification always on; minimum 10%; 100% option | [10-verification](../10-verification/README.md) | V1 |
| 9 | Detect and report every hidden-data place (HPA/DCO, Shadow MBR, NBP, RPMB, namespaces, remapped sectors, SID block, TCG lock, Computrace) even when it can't be removed | Same full list, each reported found / removed / could not remove | [05-drive-and-hardware-detection](../05-drive-and-hardware-detection/README.md), [07-removing-locks](../07-removing-locks/README.md), [16-where-data-may-remain](../16-where-data-may-remain/README.md) | V1 |
| 10 | Firmware-command chains with fallback per drive type; never pause/cancel during a firmware command | Same: chains per drive type (ATA, SCSI, NVMe, eMMC) incl. the **NexWipe SSD method**; Pause/Cancel disabled and "Do not power off" shown during firmware commands | [09-erasure-standards](../09-erasure-standards/README.md) | V1 |
| 11 | Never erase the boot stick (Blancco excludes "BLANCCO"-labelled media); hide removable media by default | Same with label `NEXWIPE`, plus device-ancestry + marker-file check; removable media hidden by default | [before-we-start/safety-rules.md](../before-we-start/safety-rules.md) | V1 |
| 12 | Reports exist only in RAM until saved/sent; automatic backup to every USB stick when offline | Same durability rules | 13 | V1 |
| 13 | Tamper-evident signed reports — signature proves integrity, not correctness | Same; the report-check page says exactly that | 13 | V1 |
| 14 | Freeze-lock removal via sleep/wake is model-sensitive; budget a per-model compatibility list | Same: `rtcwake` sleep/wake, and a model notes list in the web app (`eraser_model_notes`) | 07, [15-special-hardware](../15-special-hardware/README.md) | V1 |

## 18.3 Open gaps in this research

| # | Research gap | How NexWipe handles it | Phase |
|---|---|---|---|
| 15 | "Blancco SSD Erasure" steps are proprietary and unpublished | NexWipe builds its own **NexWipe SSD method** from public steps: strongest supported firmware purge → aperiodic random overwrite → second firmware erase if supported → verify ≥ 10%. Never described as equal to Blancco's | V1 |
| 16 | Five KB articles were 403; ANSSI security target was 404 | Accepted gap; anything that depended on them is marked "(confirm in lab)" in the relevant plan file | V1 |
| 17 | Hash/signature algorithms for reports not public | NexWipe chooses public, standard ones (e.g. SHA-256 + Ed25519 or ECDSA P-256; decide in step 13 plan) and publishes them on the report-check page | V1 |
| 18 | No public independent test of each standard on specific laptop SSD models | NexWipe's own lab recovery tests on DISPOSABLE drives (V1), then independent evaluation | V1 (lab) / V2 (independent) |
| 19 | Licence consumption timing not stated precisely ("to start the erasure"; consuming one "allows the user to save/send reports") | NexWipe rule, written down so it is not ambiguous: one wipe credit is **reserved** when an erasure starts and **consumed** when that drive's report is accepted by the web app; released if the run is interrupted before any write. No charge in V1; payment Later | V1 |

---

## Added for the plan: how the NexWipe Eraser fits into the existing app

The owner asked for this; it is not in the research page.

### A new section, existing sections untouched

| # | Part | Plan | Phase |
|---|---|---|---|
| 20 | Sidebar | New group **"NexWipe Eraser"**. Every existing page (`app.index`, `app.inventory.*`, `app.jobs.*`, `app.projects.*`, `app.policies.*`, `app.agents`, `app.hardware`, `app.chromebooks.*`, `app.connected.*`, `app.clients`, `app.sites`, `app.team`, `app.audit`, `app.settings`, `app.setup`, `app.simulator`, `app.account`) keeps its route and behaviour | V1 |
| 21 | Routes | New files only, under `src/routes/_authenticated/app.eraser.*` (e.g. `app.eraser.index` overview, `app.eraser.prepare-stick` (= Configuration Tool), `app.eraser.stick-creator` (download), `app.eraser.stations`, `app.eraser.live` (remote monitoring), `app.eraser.reports.index` / `app.eraser.reports.$reportId`, `app.eraser.workflows`, `app.eraser.credits`, `app.eraser.compatibility`). Each sets `staticData.sitemap` like every route; `_authenticated` already excludes them from the sitemap | V1 |
| 22 | Data reads | New react-query hooks in `src/lib/queries.ts`, keyed by org id, as the rules require | V1 |
| 23 | Station API | New eraser endpoints added inside the existing agent API handler (`src/server/agent-api/`, behind `src/routes/api/public/agent/v1/$.ts`), in new files (e.g. `src/server/agent-api/eraser/*`). The simulator calls the same handler; simulated eraser runs carry `is_simulated` (trusted code only), are labelled, and are never billable or certificate-eligible | V1 |
| 24 | Eraser code | Outside `agent-handoff/` (whose rules forbid erasure tools): new top-level folders, e.g. `eraser/engine/` (Rust or Go), `eraser/screen/` (kiosk web app), `eraser/image/` (own build and own `verify-image` allow-list: hdparm, nvme-cli, sg3_utils, sedutil-cli, mmc-utils, smartmontools, rtcwake, dmidecode, tpm2-tools, ledmon), `stick-creator/` | V1 |
| 25 | Links to existing data | New tables may **reference** existing rows (`devices`, `drives`, `sites`, `projects`, `clients`, `chromebook_records`) with composite FKs `(org_id, <id>)`. That adds no column to existing tables. Existing tables, triggers and RPCs are not edited in V1 | V1 |
| 26 | Honest status | `docs/STATUS.md` lists each eraser part as Planned with phase until built; the dashboard panel `src/components/nd/availability-panel.tsx` is updated only when STATUS changes; nothing simulated is listed as available | V1 |
| 27 | Permissions | Same model as today: RLS + `SECURITY DEFINER` RPCs (`has_org_role` with AAL2 for owner/admin, `is_org_staff`, `has_project_grant`); `src/lib/permissions.ts` only mirrors them. Browser roles get **read-only** access to all eraser result tables; all writes go through service-role `eraser_*` RPCs called by the agent API, or owner/admin RPCs for settings | V1 |
| 28 | Append-only history | Erasure reports, the per-command log and the wipe-credit ledger are append-only for app users; no UPDATE/DELETE grants, written by trusted code/triggers | V1 |
| 29 | Untrusted callers | Triggers using `is_untrusted_caller()` stop browser writes from setting any erasure result, `is_simulated`, `hardware_verified`, `source = agent_reported`, or a non-synthetic `hardware_origin` | V1 |

### The AGENTS.md rule that must change first

Today `AGENTS.md` says: "Physical stations enroll read-only (`agents.read_only`, enforced by triggers on
authorizations/events/evidence); only trusted server code may unlock one, never an app user." And
`agent-handoff/AGENTS.md` forbids erasure tools in `agent-handoff/`. An eraser cannot exist under those rules as written.
Changing them is the owner's decision (see [before-we-start/owner-decisions.md](../before-we-start/owner-decisions.md)).
Nothing is built until the owner approves this text:

| # | Change | Proposed text | Phase |
|---|---|---|---|
| 30 | Replace the physical-station rule in `AGENTS.md` | "Physical stations enroll read-only (`agents.read_only`, enforced by triggers on authorizations/events/evidence); only trusted server code may unlock one, never an app user. **NexWipe Eraser sticks are a separate station kind** (own image, own key, own tables `eraser_*`) and are the only code allowed to erase. An eraser station may erase only after an owner/admin approves it in an AAL2 session and trusted server code marks it erase-capable; it runs only allow-listed commands against drives the server authorised (or the company's signed setup explicitly allows offline erasure), never against its own boot medium, and never reports an interrupted or unverified erasure as Erased. Read-only stations and the read-only image never gain erase tools." | V1 |
| 31 | Add a line to `agent-handoff/AGENTS.md` | "Erasure code lives in `eraser/`, never here; `verify-image.sh` keeps refusing erase tools for the read-only image." | V1 |
| 32 | Add an eraser rules file | `eraser/AGENTS.md` with the safety rules from [before-we-start/safety-rules.md](../before-we-start/safety-rules.md) (boot-stick exclusion, removable media hidden, typed confirmation, no pause/cancel during firmware commands, interrupted = not erased, destructive tests only on DISPOSABLE lab drives) | V1 |

### How database changes ship (every table below)

| # | Rule | Plan | Phase |
|---|---|---|---|
| 33 | Numbered migration + undo file | Each change is `drizzle/migrations/00NN_<name>.sql` with `drizzle/rollback/00NN_<name>.down.sql`. Next free number at time of writing is **0029** (0028 is applied in Lovable as `0028_org_stick_keys_apply.sql`; Lovable sometimes saves its own copy under the next number — check `drizzle/migrations` and the journal again before writing) | V1 |
| 34 | Local rehearsal | On a local throwaway database: apply on top of 0000..N-1 with data, re-run safely, undo restores an identical schema dump, all `tests/db/*.sql` pass; add new `tests/db` checks for each new RLS/RPC | V1 |
| 35 | Owner applies in Lovable | Prompt: "Apply the SQL in `drizzle/migrations/00NN_<name>.sql` to the database exactly as written. Do not modify it." Never run SQL against the live database from a local machine | V1 |
| 36 | Order | push → apply in Lovable → check preview → Publish, so the published site never needs a column the database lacks. Every handover says whether it contains a migration | V1 |
| 37 | Tenant pattern | Every tenant table has `org_id` and `UNIQUE (org_id, id)`; children use composite FKs `(org_id, parent_id)` | V1 |

### New database tables implied by all steps

All names start with `eraser_` (or are clearly eraser-only) so no existing table is touched. "Platform" = shared
reference data with no `org_id`, readable by all, written only by NexWipe staff migrations.

| # | Table | Holds | From research step | Phase |
|---|---|---|---|---|
| 38 | `eraser_setups` | A company's named stick setups (Prepare stick page) | 01, 04 | V1 |
| 39 | `eraser_setup_versions` | Immutable, signed versions of each setup = the `nexwipe-setup.json` content (all settings: standards, verification, hardware tests and thresholds, custom fields, process mode, network, removable-media visibility) | 01, 04, 08, 10, 12, 13 | V1 |
| 40 | `eraser_images` (platform) | Released eraser builds: version, checksums, signature, Secure Boot shim info | 01, 03 | V1 |
| 41 | `eraser_stick_keys` | Per-company eraser stick key (separate from read-only `stick_keys`), revocable | 01 | V1 |
| 42 | `eraser_stations` | Each eraser stick/station that registered (identity, setup version, erase-capable flag set only by trusted code after AAL2 approval, revoked flag, `is_simulated`) | 01, 03, 06 | V1 |
| 43 | `eraser_sessions` | One row per boot of a laptop: station, laptop identity, start/end, process mode, technician | 03, 06 | V1 |
| 44 | `eraser_asset_reports` | Hardware (asset) report per session: system, CPU, RAM, battery, drives, model notes shown | 05, 13 | V1 |
| 45 | `erasure_standards` (platform) | The erasure standards as data: step order, rounds, patterns, verification, fallbacks, level reached | 09 | V1 |
| 46 | `eraser_drive_results` | One row per drive per session: model, serial, type, standard, level reached (Purge/Clear), result (Erased/Not erased), exceptions, hidden-area findings, optional link to existing `drives` | 05, 07, 08, 10, 11, 16 | V1 |
| 47 | `eraser_command_log` | Append-only per-drive log of every command sent and its result | 07, 08, 11 | V1 |
| 48 | `eraser_hardware_test_results` | One row per hardware test per session: test, result, measured values, operator, notes | 12 | V1 |
| 49 | `eraser_reports` | Append-only signed reports: document, hash, signature, key id, storage path, `is_simulated`, link to session | 13 | V1 |
| 50 | `eraser_report_keys` (platform) | Public keys used to check report signatures | 13 | V1 |
| 51 | `eraser_issue_reports` | "Report issue" bundles sent from sticks | 13 | V1 |
| 52 | `wipe_credit_ledger` | Append-only credit movements (grant, reserve, consume, release) per org; balance is a view. No charge in V1; payment Later | 01 (§1.4 licences), 13 | V1 |
| 53 | `eraser_commands` | Remote-control commands queued from the web app to a station (start, pause, refresh, restart, shutdown), with who/when/result | 06 | V1 |
| 54 | `eraser_live_status` | Latest heartbeat and per-drive progress for remote monitoring (overwritten, not history) | 06 | V1 |
| 55 | `eraser_workflows` / `eraser_workflow_versions` | Company workflows and their immutable versions | 06 | V1 |
| 56 | `eraser_model_notes` (platform, plus optional org rows) | Compatibility list: maker, model, firmware, note (freeze-lock, S3, safe resolution, Mac purge limits, ChromeOS issues) | 07, 15 | V1 |
| 57 | `eraser_port_maps` | Saved drive-bay port maps and aliases per station | 15 | Later |
| 58 | `eraser_reimage_images` | Reimaging sources and results | 14 | Later |
| 59 | `eraser_chromebook_runs` | Chromebook network-process runs (station, CB id, reset status reported, tests, report), linked to existing `chromebook_records`; resale status stays with `_cb_resale_blockers` | 15 | Later |
| 60 | `eraser_certification_evidence` | Lab recovery-test records for drives tested (DISPOSABLE only) | 17 | V2 |

Skipped on purpose: no separate tables for custom-field definitions or verification settings — they live inside
`eraser_setup_versions` (one signed document), and their values live inside the report. Split them out only if the
app needs to search by them.
