# Plan — Workflows (scripted processes)

Mirrors: research [06-process-modes-and-workflows/workflows.md](../../../research/blancco-drive-eraser/06-process-modes-and-workflows/workflows.md)

**In short**
- A NexWipe *workflow* is a flowchart drawn in the NexWipe web app that tells NexWipe Eraser what to do step by step —
  same actions, same green (success) / red (failure) exits, same variables and expression language as Blancco's.
- Stored as JSON (a text format for structured data) in the database, signed by the web app, fetched by the eraser
  when the stick's process mode is "Workflow". Runs Computer-level ("Booted") or Drive-level ("Connected").
- Engine side: a workflow runner inside the eraser engine (Rust or Go) with an expression parser; every step is written
  into the report. Editor side: drag-and-drop page in the web app.
- Phase: the engine, editor, logic, variables and the laptop-relevant actions are **V1**. Server-only actions (Locate
  via IPMI, IPMI factory reset), PXE, Reimage and the separate "Verify only" product are **Later**.

**Jargon used below** (research term → NexWipe equivalent)
| Research term | NexWipe equivalent | Phase |
|---|---|---|
| **BDE** – Blancco Drive Eraser | NexWipe Eraser (bootable Linux stick) | V1 |
| **BMP** – cloud portal; **BMP On-Premise** – self-hosted portal | The NexWipe web app. Self-hosted version: n/a for NexWipe — we only run the cloud app | V1 |
| **CT** – Configuration Tool | The "Prepare stick" page; settings baked into signed `nexwipe-setup.json` | V1 |
| **WFE** – Workflow Editor | NexWipe workflow editor page in the web app | V1 |
| **Subworkflow** – a workflow started from inside another | Same | V1 |
| **XML path / XmlPath** – dotted address of one field in the XML report | **ReportPath**: same dotted address into NexWipe's report (NexWipe reports are JSON; path format kept identical, e.g. `nexwipe_data.hardware_report.disks.disk.capacity`) | V1 |
| **Autopilot / Intune** – Microsoft auto-enrolment; still-enrolled machines get claimed by the old owner | Same check (Autopilot check action) | V1 |
| **PSID** – code on a self-encrypting drive's label for factory reset; **TCG Opal/Enterprise** – self-encrypting drive standards | Same; `sedutil-cli --PSIDrevert <PSID> /dev/X` (step 07; confirm in lab) | V1 |
| **IPMI / BMC** – server out-of-band management chip; **UID LED** – server "locate me" light | Same; `ipmitool` | Later |
| **IBR** – undefined in manual, appears to mean in-rack/server workflows (unconfirmed) | n/a for NexWipe V1 — server feature; revisit with server work | Later |
| **WAD client** – Blancco client for Autopilot detection on old BDE versions | n/a for NexWipe — we build only the "modern" behaviour (no separate client); see §5.1 Autopilot check | V1 |

---

## 1. What a workflow is and how it is started (§13, p.150)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| When BDE runs the Workflow process, it follows the actions set in the workflow from the editor | Same | Engine workflow runner walks the JSON graph from the Start action | V1 |
| Editor available in BMP and in BMP On-Premise 6.0.0+ | Editor available in the NexWipe web app (no on-premise version — n/a) | Route `src/routes/_authenticated/app.workflows.*` | V1 |
| Feature licensed separately (contact Blancco) | Included; free in V1. Kept as a parity row: a company setting "Workflows enabled" (on by default) so it can become a paid add-on Later | `organizations` feature flag (migration) | V1 |
| Workflows can be triggered from BMP On-Premise "Start Workflow" in Process Management | "Start workflow" button on the Live erasures page sends a workflow to chosen machines | Remote command channel (step 06 README §6.3) | V1 |

## 2. Requirements (§13.1, p.150)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Network connection plus BMP On-Premise (or BMP account + internet) to manage and store workflows | Network connection + NexWipe account; workflows stored in the web app database | Tables `workflows`, `workflow_versions` with `org_id`, `UNIQUE (org_id,id)`, composite FKs; RLS read for members, writes via RPC only (migration + rollback file) | V1 |
| Image configured with **Security / Erasure Process – Workflow** | Prepare stick page: Process mode = Workflow | `process.mode: workflow` | V1 |
| **Default workflow** – the user's default workflow is used; active by default | Same switch, on by default | `workflow.use_default: true` | V1 |
| **Workflow name** – if Default workflow is off, type the name here | Same field (pick list in our page, stored by name) | `workflow.name` | V1 |
| If On-Premise settings not set in CT "Communication" tab, enter them manually after boot | If connection details are missing, the laptop Settings screen asks for web app address + stick key | Kiosk Settings form | V1 |
| When connection succeeds, workflow fetching retried at 30-second intervals | Same: retry fetch every 30 s until it works | Engine timer | V1 |
| See CT documentation for settings | NexWipe help page for the Prepare stick page | Web app help | V1 |

## 3. Creating and editing a workflow (§13.2, pp.150–151)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| 1. Open BMP | Open the NexWipe web app | — | V1 |
| 2. Go to Process Management – Dynamic Workflows – Drive Eraser workflows (or Workflows tab) | Sidebar "Workflows" page | Route + `staticData.sitemap` excluded (private) | V1 |
| Button only visible if Workflow Editor enabled for the account | Same: button only shown when "Workflows enabled" is on and user is owner/admin | `src/lib/permissions.ts` mirror; real check in RPC `has_org_role` (AAL2 for owner/admin) | V1 |
| 3. Click "Create" to open the editor | Same | — | V1 |
| A workflow needs a name before it can be saved | Same | RPC `workflow_create` rejects empty name | V1 |
| The name cannot be edited later | Same (names are how sticks and subworkflows find a workflow) | No rename RPC; DB trigger blocks name change | V1 |
| Edit: choose workflow → "Manage workflow" → "Edit" (opens in editor) | Same menu | Each save = new row in `workflow_versions` (old kept) | V1 |
| Set default: "Manage Workflow" → "Set as default" | Same | RPC `workflow_set_default` | V1 |
| Only the workflow's owner can set default (p.151) | Same: only the workflow's creator can set it as default (we also allow company owner, to avoid lock-out if creator leaves — flagged as the one deliberate difference) | RPC checks `created_by = auth.uid()` or org owner | V1 |

## 4. The Workflow Editor (§13.3, pp.151–152)

Layout:
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Left: list of actions | Same | React page; flowchart drawn with an existing graph library (pick one already compatible with the app, e.g. React Flow — confirm before adding a dependency) | V1 |
| Middle: work area | Same | Same | V1 |
| Right: Properties panel for workflow or selected action | Same | Form per action type | V1 |

Navigation:
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Zoom 50%–150% with Ctrl + mouse scroll | Same range and shortcut | Graph library zoom limits | V1 |
| Pan by dragging with left mouse button | Same | Same | V1 |
| Up/down with mouse scroll | Same | Same | V1 |
| Left/right with Shift + mouse scroll | Same | Same | V1 |
| Button shrinks/enlarges the properties area | Same button | CSS panel toggle | V1 |

Editor versions:
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Top-right Workflow Editor version selector listing all editor versions | Same: "Workflow format version" selector | Each workflow JSON carries `format_version` | V1 |
| Choosing a version needs internet; without it only the bundled editor | n/a for NexWipe — our editor is always online (web app); all versions always available | — | V1 |
| Selected editor version should match the client (BDE) image version | Same: editor warns if the format version is newer than what the company's sticks run | Sticks report engine version in heartbeat | V1 |
| Editor version stored in the workflow file; next time BMP uses that version, otherwise falls back to the most suitable editor | Same: version stored; opened with that version, else nearest supported one | Editor loads schema by `format_version` | V1 |

Building:
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Drag and drop actions into the work area | Same | Graph library | V1 |
| Remove by selecting and pressing Delete/Del | Same | Key handler | V1 |
| Connect by clicking an output and linking to another action's input | Same | Graph library edges | V1 |
| Some actions have two outputs: positive (upper-right, green) and negative (lower-right, red); e.g. Erase green = succeeded, red = failed | Same positions and colours; Erase green only when result is "Erased" (never for interrupted/unverified) | Edge `kind: success/failure` | V1 |

Workflow-level setting (p.152):
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "Report in the XML" checkbox — adds all the workflow's action info to the report | "Include workflow steps in report" checkbox | `report_steps` flag; runner appends each step to report `workflow_log` | V1 |
| On by default | Same | Default true | V1 |
| If off in a main workflow, turned off for all its subworkflows | Same | Runner passes flag down | V1 |

Other:
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Rename an action via the edit symbol next to its name (top right); symbol unchanged | Same | Action `label` field; icon from `type` | V1 |
| Save: saves all changes and exits | Same | RPC `workflow_save_version` | V1 |
| Cancel: discards all changes and exits | Same (asks "Discard changes?" first) | — | V1 |

## 5. Available actions (§13.4, pp.152–160)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| All actions can be renamed through their properties | Same | `label` field | V1 |
| Some actions exist only in the new workflow editor (BMP) | n/a for NexWipe — one editor, all actions available (format version decides) | — | V1 |

### 5.1 Device actions (§13.4.1, pp.152–154)

**Start**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Workflow execution starts here | Same; exactly one Start per workflow | Validation | V1 |
| Computer-level: starts when system boots | Same ("Booted") | Runner starts at engine boot | V1 |
| Drive-level: starts when an erasable device is detected | Same ("Connected"); boot stick and hidden removable media never start a run | Runner starts per detected drive | V1 |
| See §8 for differences | Same (§8) | — | V1 |

**Erase**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Starts erasure of the drive using default erasure settings | Same | Engine erase API (steps 08–10) | V1 |
| Erasure standard: full standard name (any from list) | Same | Pick list from NexWipe standards (step 09) | V1 |
| Erasure standard: Default (pre-configured in image) | Same (from setup file) | — | V1 |
| Erasure standard: Use variable (e.g. `<VARIABLE standard>`) or type full name | Same | Resolved at run time | V1 |
| Overwriting pattern type: zeroes or periodic random patterns | Same | Overwrite engine (step 08) | V1 |
| …works only when "NIST 800-88 Clear" is selected | Same restriction | Validation | V1 |
| "Static pattern" also lets you set the byte value | Same | — | V1 |
| Also changeable in CT | Also on Prepare stick page | — | V1 |
| NIST 800-88 Clear allows 1–4 bytes (e.g. `0xAABBCCDD`), also in CT | Same 1–4 byte pattern | Validation `^0x([0-9A-F]{2}){1,4}$` | V1 |
| Verification percentage: ready-made value, a variable, or a typed fixed value (e.g. 0% minimal) | Same three ways; 0% allowed but the report then says "not verified" and the result can't be "Erased" (honesty rule; step 10/11 decide final wording) | Step 10 | V1 |
| Write pattern after erasure: extra overwrite round to ease verification; options "Overwriting pattern type" and "Pattern" | Same option + two sub-options | Step 08 | V1 |
| Use WRITE SAME command: faster for periodic patterns, SCSI/SAS only; enabled by default | Same, default on; ignored on SATA/NVMe | `sg_write_same` (sg3_utils; confirm in lab) | Later |
| Configure firmware-based commands: choose allowed firmware commands; all enabled by default; arrow shows all options | Same list, all on by default, expandable | Step 08 (hdparm, nvme-cli, sg3_utils, sedutil-cli, mmc-utils) | V1 |
| "Enforce Blancco SSD method on SSDs" does not apply to Erase action | Same: "Enforce NexWipe SSD method" setting not applied inside workflows; workflow must choose it | Runner ignores the global flag | V1 |
| "Enable fallback from NIST Purge to NIST Clear" does not apply; fallback must be built into the workflow | Same; report shows the level actually reached (Purge or Clear) | Runner | V1 |
| Incorrect standard or verification % → default (from ISO) used | Same: falls back to setup-file default and logs a warning in the report | Runner | V1 |
| Problems (e.g. not enough licences, invalid standard) stored in `<LAST_OPERATION_START_ERROR>` | Same variable; "not enough licences" → `NOT_ENOUGH_CREDITS` (wipe credits; no charge in V1, counting kept) | Runner | V1 |
| …usable in Set value, Message, Question, Server message | Same | — | V1 |
| Only in Drive Eraser | Only in NexWipe Eraser (not in a verify-only mode) | — | V1 |

**Diagnose**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Runs diagnostic hardware tests | Same | Step 12 tests | V1 |
| Tests requiring user interaction can be selected in settings | Same | Action properties list | V1 |
| YES = "Successful" | Same | Kiosk dialog | V1 |
| NO = "Failed" | Same | — | V1 |
| SKIP = "Not available" | Same | — | V1 |
| Hardware otherwise unavailable = "Not performed" | Same | — | V1 |
| Only Computer-level and only if hardware tests enabled in CT | Same two conditions | Validation + runner | V1 |

**Self-test**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Runs the drive's own self-tests | Same | `smartctl -t short/long/conveyance`; NVMe `nvme device-self-test` (confirm in lab) | V1 |
| Short – under two minutes | Same | `-t short` | V1 |
| Extended – can take hours | Same | `-t long` | V1 |
| Conveyance – several minutes, transport damage | Same (SATA only; NVMe has none → result "Not available") | `-t conveyance` | V1 |
| Variable – type via variable or typed text | Same | Runner | V1 |

**Reimage**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Reimages with a Windows WIM image from a network share | Same | See plan [reimaging.md](../14-finish-restart-reimage/reimaging.md) | Later |
| Prompt – list of image names at runtime | Same | — | Later |
| Use variable – name from a variable | Same | — | Later |
| Manual entry – type the name | Same | — | Later |
| Citizenship licences and digital product keys supported | Same | — | Later |

**Autopilot check**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Retrieves whether machine is enrolled in Autopilot/Intune | Same | Eraser collects machine identity (serial via `dmidecode`, and the Autopilot hardware hash if it can be built on Linux — confirm feasibility) → web app asks Microsoft. Needs a Microsoft partner/API access the company grants (confirm). If not achievable, action shows "Planned" | V1 |
| Timestamp added to report | Same | Report field | V1 |
| "Recheck status if older than" N days | Same setting | Web app caches result per device | V1 |
| 0 = immediate recheck | Same | — | V1 |
| …subject to a 2 h moratorium | Same 2-hour minimum gap between rechecks | Server-side rate limit | V1 |
| Green exit = Not enrolled | Same | — | V1 |
| Red exit = enrolled, or an error during detection | Same | — | V1 |
| BDE older than 7.17 needs a WAD client run on the machine | n/a for NexWipe — Blancco version history; no extra client | — | V1 |
| Can take a few minutes; run other actions simultaneously | Same advice (use Subworkflow, §7) | — | V1 |
| Computer-level (Booted) workflows only | Same | Validation | V1 |

**Enter PSID**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Shows the same PSID dialog as manual entry, to unlock TCG-locked drives (Opal and Enterprise) | Same | Kiosk PSID dialog (step 07); `sedutil-cli` | V1 |
| "Get PSID value from the variable" – if filled, no dialog | Same | — | V1 |
| Supports secure variable values (via Set Value) | Same | §6.1 | V1 |
| Must be followed by an Erase action that runs PSID Revert | Same (editor pairing check) | Validation | V1 |
| Drive-level only; in Computer-level passes green immediately | Same | Runner | V1 |
| Passes green immediately if drive is not TCG Storage compliant | Same | `sedutil-cli --scan` result | V1 |
| …or if "Reset drive to factory defaults if non-default TCG password is set" is checked | Same | Step 07 setting | V1 |
| …or if "…if drive is in TCG locked state" is checked | Same | Step 07 setting | V1 |
| Red on Cancel | Same | — | V1 |
| Red if the variable has no PSID | Same | — | V1 |
| Red if PSID is invalid | Same | — | V1 |

**Verify**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Starts verification using default verification settings | Same, in a "Verify only" mode of NexWipe Eraser (equivalent of Blancco's separate Drive Verifier product) | Step 10 verify engine reused | Later |
| Verification standard dropdown | Same | — | Later |
| Byte value `0x00`–`0xFF` (depends on standard) | Same | Validation | Later |
| Whole workflow interrupted if not enough licences | Same, "not enough wipe credits" (no charge; counting kept) | — | Later |
| Interrupted if verification cannot start (other reason) | Same | — | Later |
| Only in Drive Verifier | Only in Verify-only mode | — | Later |

**Charge battery**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Pauses workflow until battery reaches a level, then continues | Same | Read `/sys/class/power_supply/BAT*/capacity` | V1 |
| Target charge level | Same | — | V1 |
| Time window in minutes for progress | Same | — | V1 |
| Success: target reached or no battery found | Same | — | V1 |
| Failure: charging too slow or no progress in the set minutes | Same | — | V1 |

**Discharge battery**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Pauses until battery discharges to a level; unplug power to start | Same; screen tells technician to unplug | Same sysfs reading | V1 |
| Target charge level | Same | — | V1 |
| Success: level reached or no battery found | Same | — | V1 |
| Failure: discharging too slow or charge level increases | Same | — | V1 |
| Computer-level only | Same | Validation | V1 |

### 5.2 Logic actions (§13.4.2, pp.154–158)

**Condition**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| IF statement: expression evaluated and converted to Boolean | Same | Engine expression evaluator (§6.3) | V1 |
| true → success (green), false → failure (red) | Same | — | V1 |
| Uses operators in §6.3 and variables below | Same | — | V1 |

**Question**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Pop-up asking a pre-defined Yes/No question | Same | Kiosk modal | V1 |
| Customisable text: title, bold, italics | Same | Markdown subset (§6.2) | V1 |
| "Customize background color" checkbox + colour | Same | — | V1 |
| Variables inserted via the **(x)** icon, shown with values | Same (x) button | Editor | V1 |
| Yes → Success, No → Fail | Same | — | V1 |
| Max 1024 characters | Same | Validation | V1 |

**Set variable / Set value**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Assigns a new value to a variable | Same | Runner | V1 |
| Targets listed in §6.1 | Same | — | V1 |
| Right-hand side may be an expression (p.165) | Same | — | V1 |
| Interrupted: "Action is called on an invalid target" (drive ID unavailable) | Same | — | V1 |
| Interrupted: "Failed evaluating expression" (syntax error) | Same | — | V1 |

**Subworkflow**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Fetches the workflow named in "Subworkflow name" and runs it | Same | Engine fetches by name from agent API | V1 |
| "Continue to the next action before completion" on → parent goes green immediately, both run in parallel, Collect results needed | Same | Runner spawns parallel task | V1 |
| Off → parent waits | Same | — | V1 |
| Doesn't exist / can't be fetched → parent validation fails | Same | Pre-run validation fetches all subworkflows | V1 |
| Cannot start itself | Same | Validation | V1 |
| Drive-level subworkflow from computer-level fails for any drive → result "failure" | Same | — | V1 |
| Subworkflow interrupted → parent interrupted | Same | — | V1 |

**Create custom erasure**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Creates a new erasure option (custom pattern + type) for Erase | Same | Engine in-memory standard | V1 |
| Name (action name, default "Create Custom Erasure") | Same | — | V1 |
| Erasure Name (required; shown in UI selection) | Same | Validation | V1 |
| Add step: type, byte value, pattern type; more with (+) | Same | — | V1 |
| Set custom erasure name to (variable, used with Erase → Use variable) | Same | — | V1 |
| Only one path | Same single exit | — | V1 |
| Only via workflows, but reusable from the UI's "In-process" settings during the session | Same | — | V1 |
| Listed at the bottom under "Custom defined standards" | Same heading idea ("Custom standards") | Kiosk settings | V1 |
| Report honesty | Custom standards are reported by their exact steps and never labelled as a named official standard | Report | V1 |
| Only in Drive Eraser | Only in NexWipe Eraser | — | V1 |

**Collect results**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Collects results of subworkflows started with "continue before completion" | Same | Runner join | V1 |
| Subworkflow name to wait for | Same | — | V1 |
| Waits for all subworkflows with that name | Same | — | V1 |
| Green if all succeeded | Same | — | V1 |
| Red if at least one failed | Same | — | V1 |
| One interrupted → main interrupted with "Interrupted by subworkflow" | Same reason text (own wording equivalent) | — | V1 |
| None started → completes immediately via green | Same | — | V1 |

**Create custom field**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Creates/updates a custom field and asks the operator | Same | Step 13 custom fields | V1 |
| Custom field name (action name, shown in pop-up) | Same | — | V1 |
| Title (identifies field in report; cannot be empty → "The custom field has an empty title") | Same | Validation | V1 |
| Type: Text field | Same | — | V1 |
| Type: Drop down list | Same | — | V1 |
| Type: Multi drop down list | Same | — | V1 |
| Default value (Text only) | Same | — | V1 |
| Options (comma-separated; drop-downs only) | Same | — | V1 |
| Regular expression (Text only) | Same (a pattern the answer must match) | Validated in editor and engine | V1 |
| Regular expression hint | Same | — | V1 |
| Required (empty not accepted) | Same | — | V1 |
| Show in custom field editor | Same | — | V1 |
| Use the default value (assign default and continue without asking) | Same | — | V1 |
| Predefined image field stays unchanged unless user interacts | Same for fields predefined in the setup file | — | V1 |
| Workflow field with identical title overrides the predefined one | Same | — | V1 |

**Custom field editor**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Opens a dialog to view/update several fields before continuing | Same | Kiosk dialog | V1 |
| "Fill in the remaining horizontal space" (default) | Same, default | CSS grid auto-fit | V1 |
| "Set fixed number of columns" | Same | — | V1 |

**Add delay (sleep)**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Pauses for a set duration in ms | Same | Runner timer | V1 |
| Range 0–2,000,000,000 ms | Same range | Validation | V1 |

**Finish / Finalize**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Finalises the process | Same | — | V1 |
| Show fail – device shows process failed | Same (red card) | — | V1 |
| Restart (Computer-level only) | Same; still waits for report backup (step 14) | — | V1 |
| Shutdown (Computer-level only) | Same; same backup gate | — | V1 |
| No Finish reached → whole workflow interrupted | Same | Runner | V1 |
| Shutdown takes precedence over Restart | Same | — | V1 |

**Variables listed for Condition (pp.154–155)**
| Variable | Blancco meaning / notes | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| `<DRIVEATTRIBUTES REMAPPED_SECTOR_COUNT>` | Remapped sectors; Drive-level only; Invalid in computer-level or if unsupported | Same | `smartctl -A` attr 5 / NVMe equivalent (confirm in lab) | V1 |
| `<DRIVEATTRIBUTES UNCORRECTABLE_SECTOR_COUNT>` | Uncorrectable/bad sectors; same restriction | Same | SMART attr 198 / NVMe media errors (confirm in lab) | V1 |
| `<DRIVEATTRIBUTES IS_SSD>` | Current drive is SSD; Drive-level only | Same | `/sys/block/X/queue/rotational` = 0 + detection (step 05) | V1 |
| `<DRIVEATTRIBUTES IS_NVME>` | Current drive is NVMe; Drive-level only | Same | Transport from detection | V1 |
| `<DEVICECUSTOMFIELD FIELD_TITLE>` / `<DEVICECUSTOMFIELD FieldTitle>` | Custom field value; multi drop-down = comma-separated | Same | — | V1 |
| `<REPORTPATH XMLPATH>` | Report node, e.g. `lessThan(<REPORTPATH …battery_capacity.capacity>, 80)` | Same (path into NexWipe report) | §11 | V1 |
| `<ENTITYINFO Name>` | ENTITYINFO value | Same | — | V1 |
| `<MODEL>` | Drive model (drive-level) / computer model (computer-level) | Same | Detection + `dmidecode -s system-product-name` | V1 |
| `<MANUFACTURER>` | Drive vendor / computer vendor | Same | `dmidecode -s system-manufacturer` | V1 |
| `<LAST_OPERATION_START_ERROR>` | Why an operation couldn't start, e.g. `"NOT_ENOUGH_LICENSES"` | Same; codes like `NOT_ENOUGH_CREDITS` | — | V1 |
| `<ERASURE_PROGRESS>` | 0–100 %, 100 when complete | Same | — | V1 |
| `<ERASURE_TIME_LEFT>` | 0–int64 max seconds, 0 when complete | Same | — | V1 |

### 5.3 Misc actions (§13.4.3, pp.158–160)

**Save report / Send report**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Sends a new report or updates the existing one | Same (update = new signed version; old kept) | Agent API report endpoint | V1 |
| "Send report:" sends to BMP; forced on | Same, always on | — | V1 |
| Erase ran before → erasure report; otherwise asset report | Same | — | V1 |
| Interrupted on missing licence | Same, "no wipe credits" (no charge in V1) | — | V1 |
| No separate description for "Save report" | NexWipe adds a clear Save report action: saves the signed report to a chosen USB drive (not the boot stick system area) | — | V1 |

**Save issue report**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Creates a new issue report, saves to a destination | Same (logs + system info bundle) | `journalctl`, `dmesg`, engine logs → zip | V1 |
| Destination | Same | — | V1 |

**Send issue report**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Sends an issue report (extra info + logs) to BMP | Same, to the web app | Agent API upload | V1 |
| "Customized comment" toggle + "Problem description" field | Same | — | V1 |
| Empty description or toggle off → auto-generated comment | Same | — | V1 |
| "Customized comment" on automatically sends to BMP (as worded) | Same behaviour | — | V1 |

**Play sound**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Plays a sound once erasure progress has completed | Same | `aplay` with bundled own sounds | V1 |
| Sound sample: Information | Same | — | V1 |
| Sound sample: Warning | Same | — | V1 |
| Sound sample: Error | Same | — | V1 |
| Duration seconds, default 5 | Same | — | V1 |
| Sample repeats until duration met | Same | — | V1 |
| No sound if no drivers or device misconfigured | Same (action still goes on) | — | V1 |

**Message**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Info dialog with OK | Same | Kiosk modal | V1 |
| Title, bold, italics | Same | — | V1 |
| "Customize background color" | Same | — | V1 |
| Variables shown with values | Same | — | V1 |
| Timeout seconds | Same | — | V1 |
| Continues after OK or timeout | Same | — | V1 |
| Max 1024 characters | Same | — | V1 |

**Server message** — summary row: sends HTTP GET/POST/PUT/PATCH/DELETE, parses JSON reply, stores values into variables → Same, **V1**, engine HTTP client (Rust `reqwest` / Go `net/http`).

**Locate**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Makes a drive blink to find it in dense equipment | Same | `ledctl locate=/dev/X` (ledmon) | Later |
| "Turn on" | Same | — | Later |
| Per-drive workflow: drive blinking | Same | ledmon | Later |
| Asset-level workflow: UID LED on/off via IPMI | Same | `ipmitool chassis identify` | Later |
| Also off from the Locate button in the UI | Same | Kiosk button | Later |
| Main use via "IBR workflows" | n/a until server work (meaning unconfirmed) | — | Later |

**IPMI factory reset**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Clears IPMI data: customer accounts, network config, event log, etc. | Same | `ipmitool` / vendor tools (confirm in lab) | Later |
| No parameters | Same | — | Later |
| Used when credentials not required for "BMP factory reset" (likely BMC) | Same purpose | — | Later |
| Computer-level only | Same | — | Later |
| Two paths, "Successful" and "Failed" | Same | — | Later |
| No management controller → success | Same | — | Later |
| Supported: Dell iDRAC, HPE iLO, Supermicro, Quanta | Same four, only after lab test on each | — | Later |

**Server message — parameters (pp.158–160)**
| Field | Blancco rule | NexWipe builds (same) | Phase |
|---|---|---|---|
| Method | GET (no body), POST, PUT, PATCH, DELETE | Same five | V1 |
| URL | Max 2048 chars; `<>` variables substituted | Same | V1 |
| URL | Only HTTP and HTTPS | Same | V1 |
| URL | HTTPS: server certificate validation not performed | **Deliberate difference:** NexWipe validates certificates by default (an unchecked HTTPS link can be faked). Option "Skip certificate check" exists for parity, off by default, shown with a warning and recorded in the report | V1 |
| Extra HTTP headers | Separated by new lines; max 2048 chars; `<>` tags allowed | Same | V1 |
| Extra HTTP headers | `Content-type`/`Content-length` always replaced for POST | Same | V1 |
| Extra HTTP headers | Supports secure variables | Same | V1 |
| Content type | `application/json` or `application/x-www-form-urlencoded` | Same | V1 |
| Content type | Certain expressions not allowed, e.g. `"field=value&"` | Same check | V1 |
| Store HTTP return code to | Empty or one assignable tag (`<VARIABLE>`, `<ENTITYINFO>`, `<DEVICECUSTOMFIELD>`) | Same | V1 |
| JSON to send as POST payload | Not used with GET; secure variables; tags in values not keys | Same | V1 |
| JSON reply from server | Values empty or assignable tag; if reply matches template, variables assigned | Same | V1 |
| Request timeout | 1–2,000,000 seconds | Same | V1 |
| Result | Green if any status code (incl. 404/500) | Same | V1 |
| Result | Red if no status code (refused, timeout…) | Same | V1 |
| Interrupts workflow | URL invalid after substitution | Same | V1 |
| Interrupts workflow | Headers incorrect after substitution | Same | V1 |
| Interrupts workflow | Variable cannot be assigned | Same | V1 |

#### Server message examples (§13.4.3.1, pp.160–161)

| Blancco example | NexWipe builds (same) | Phase |
|---|---|---|
| Valid reply template (`erasureStandard` → `<VARIABLE standardId>`, `machineGrade` → `<DEVICECUSTOMFIELD machineGrade>`, `someSubObject.someArray[1]` → `<ENTITYINFO someArrayElemTwo>`) | Same template accepted; kept as an automated test case | V1 |
| Corresponding reply (`"nist-purge"`, `5`, ignored `someIgnoredValue`, array `[12.34, 34.56, 56.78]`) | Same result: standardId=`nist-purge`, machineGrade=`5`, someArrayElemTwo=`34.56` (stored as String — floats not supported); test case | V1 |
| Invalid: `"<MANUFACTURER>"` as key — keys must be constant | Same rejection; test case | V1 |
| Invalid: `<REPORTPATH …>` as value — REPORTPATH cannot be assigned | Same rejection; test case | V1 |
| Invalid: two tags in one value — only one variable | Same rejection; test case | V1 |
| Invalid: `10203040` constant — not assignable; assign to variable then check in Condition | Same rejection + same hint; test case | V1 |
| Invalid: `"One"`/`"Three"` constants in array — not assignable | Same rejection; test case | V1 |

## 6. Variables and expressions

### 6.1 Set variable targets (§13.4.2, pp.155–156)

| Target | Blancco effect | NexWipe builds (same) | Phase |
|---|---|---|---|
| `<ENTITYINFO FieldName>` | Value on computer or drive, shown in UI and report; Computer-level: between "Process: workflow" label and Process tabs; Drive-level: under each drive | Same, same places | V1 |
| `<DEVICECUSTOMFIELD FieldTitle>` | Creates/updates custom field; new one is "Text field" | Same | V1 |
| `<VARIABLE VarName>` | `G_` prefix = any workflow; else current workflow only | Same | V1 |
| `<ERASURE_PROGRESS>` | 0–100 %; "invalid" before erasure | Same | V1 |
| `<ERASURE_TIMELEFT>` | 0–int64 max s; "invalid" before erasure; also spelled `ERASURE_TIME_LEFT` | Both spellings accepted | V1 |
| `<SECUREVARIABLE VarName>` | Encrypted after saving; shows `<encrypted data>` on reopen; only for Server message and Enter PSID; elsewhere invalid | Same. How: encrypted with a per-company key in the database; decrypted only by trusted server code when the signed workflow is delivered to an enrolled eraser, kept in RAM only, never written to the report | V1 |
| `<LAST_OPERATION_START_ERROR>` | Reason an operation couldn't start | Same | V1 |

### 6.2 How variables behave (§13.4.3.2, pp.161–162)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| `<VARIABLE name>` stores values that do not go into the report | Same | V1 |
| `G_` variables global during a session | Same (session = one eraser boot) | V1 |
| Variables supported in Set Value, Condition, Message, Question | Same | V1 |
| In dialogs `**this**` bold, `*this*` italic | Same | V1 |
| Types: String, Integer, Boolean, JSON | Same | V1 |
| No floats — stored as String, no float arithmetic | Same | V1 |
| Variables belong to target drive (drive-level) or Host entity (computer-level) | Same | V1 |
| All drive-level workflows on the same drive share one context | Same | V1 |
| All computer-level workflows can access each other's variables | Same | V1 |
| Example `<VARIABLE Capacity> = <REPORTPATH …disks.disk.capacity> + 100` gives a value per disk | Same; automated test case | V1 |
| Drive-level must use `G_` to reach a computer-level variable; `G_` ignored in computer-level | Same | V1 |
| "Accessing computer-level variables from drive-level workflow is not possible" (without `G_`) | Same | V1 |
| Message/Question support basic Markdown (`**bold**`, `*italic*`) | Same | V1 |
| "8. Continue" becomes "1. Continue"; write `8\. Continue` | Same Markdown behaviour (standard renderer) | V1 |
| Variables on both sides of expressions | Same | V1 |
| Integer `+ - * /` | Same | V1 |
| Operations cannot be used in questions | Same | V1 |
| `concat(X, Y)` for strings | Same | V1 |
| Variables case-sensitive | Same | V1 |
| Globals work when main is computer-level and sub is drive-level | Same | V1 |
| `G_` optional in main computer-level, required in subworkflows to reach computer-level variables | Same | V1 |

### 6.3 Supported condition expressions (§13.4.3.3, pp.162–165)

All built in the engine's expression evaluator, each example below kept as an automated test case. **V1** for every row.

| Operator / function | Blancco example(s) | NexWipe builds (same) | Phase |
|---|---|---|---|
| `AND` | `true AND false` | Same; non-Boolean converted | V1 |
| `OR` | `true OR false` | Same | V1 |
| `==` | `10 == 10`, `'False' == false`, `'10' == 10` | Same; mixed types → String; case-insensitive for Latin; Invalid → false | V1 |
| `!=` | `true != false`, `'' != 10` | Same rules | V1 |
| `lessThan(Int, Int)` | `(10,20)=true`, `('441',445)=true`, `(false,200)=true`, `('AB','AA')=false` | Same conversion rules; Invalid → false | V1 |
| `moreThan(Int, Int)` | `(20,10)=true`, `(0,0)=false`, `('A','AA')=false` | Same | V1 |
| `min(Int, Int)` | `min(10,20)=10` | Same; integers only | V1 |
| `max(Int, Int)` | `max(10,20)=20` | Same | V1 |
| `length(String)` | `length("VBOX")=4` | Same | V1 |
| `startsWith` | `("Hello World","Hello")=true` | Same; case-sensitive | V1 |
| `endsWith` | `("Hello World","World")=true` | Same; case-sensitive | V1 |
| `contains` | `("Blancco Drive Eraser","drive")=true` | Same; case-insensitive Latin (our test uses `("NexWipe Eraser","eraser")`) | V1 |
| `mid(String, Int)` | `mid("Hello World",6)="World"` | Same | V1 |
| `mid(String, Int1, Int2)` | `mid("Hello World",7,2)="or"` | Same | V1 |
| `left(String, Int)` | `left("Hello World",3)="Hel"` | Same | V1 |
| `right(String, Int)` | `right("Hello World",4)="orld"` | Same | V1 |
| `concat(String, String)` | `concat("This is ",true)`, `concat("Number of apples is ",50)`, `concat(50,'')="50"` | Same | V1 |
| `isValid(Operand)` | `isValid(<REPORTPATH a/b/c>)=true` if path exists | Same | V1 |
| `jsonValue(Json, key)` | `…'id')==234`; `'married'` `== false` | Same; wrong type / missing key → Invalid | V1 |
| `fromPath(Json, path)` | `'x.y.z'=="result"`; `'x.2.index'==2` | Same | V1 |
| `where(Json array, key, value)` | `where(json('[{"key":1},{"key":2},{"key":3}]'),'key',2)` → `{"key":2}` | Same; not found → Invalid | V1 |

Operand types (p.164):
| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Types String, Boolean, Integer, JSON, Invalid ("4 types" vs five listed) | Same five (Invalid counted as a type) | V1 |
| String `"Hello"`, `'Bye'` | Same | V1 |
| Boolean `true`/`false`, must be lowercase | Same | V1 |
| Integer `10`, `0`, `-500` | Same (64-bit) | V1 |
| JSON `{"a":"yes",…}`, `["a","b"]`, `{"a":"b"}` | Same | V1 |
| Invalid: wrong argument types, missing `<REPORTPATH>`, unsupported DRIVEATTRIBUTE | Same three causes | V1 |

Type conversion rules (pp.164–165):
| From → To | Blancco rule | NexWipe builds (same) | Phase |
|---|---|---|---|
| String → Boolean | true if ≥1 character | Same | V1 |
| Integer → Boolean | true if > 0 | Same | V1 |
| Boolean → String | `"true"`/`"false"` | Same | V1 |
| Integer → String | e.g. 500 → `"500"` | Same | V1 |
| Boolean → Integer | true → 1, false → 0 | Same | V1 |
| String → Integer | only if all numeric | Same | V1 |
| Invalid → Boolean | only conversion; false | Same | V1 |
| JSON → Boolean | `{true}`/`{false}` as is; else false | Same | V1 |
| JSON → String | string form | Same | V1 |
| JSON → Integer | if holds integer (`{10}`); else fails | Same | V1 |

Quoting rules (p.165):
| Blancco example | NexWipe builds (same) | Phase |
|---|---|---|
| Rule: string literals outside tags must be quoted; use the other quote type if the string contains one | Same | V1 |
| Accepted `<MODEL> == "VBOX"` | Same (test) | V1 |
| Accepted `<MODEL> == 'VBOX'` (same as above) | Same (test) | V1 |
| Accepted `<MODEL> == '"VBOX"'` → string `"VBOX"` | Same (test) | V1 |
| Accepted `<MODEL> == "'"` | Same (test) | V1 |
| Not accepted `<MODEL> == VBOX` | Same (test) | V1 |
| Not accepted `<MODEL> == """` | Same (test) | V1 |
| Inside tags quotes optional; everything up to `>` is the parameter | Same | V1 |
| `<DEVICECUSTOMFIELD Asset ID>` OK | Same (test) | V1 |
| `<DEVICECUSTOMFIELD "Asset ID">` same | Same (test) | V1 |
| `<DEVICECUSTOMFIELD 'Asset ID'>` same | Same (test) | V1 |
| `<ENTITYINFO Device color>` OK | Same (test) | V1 |
| Functions take non-constant args: `lessThan(<DRIVEATTRIBUTES REMAPPED_SECTOR_COUNT>, max(10, <DRIVEATTRIBUTES UNCORRECTABLE_SECTOR_COUNT>))` | Same (test) | V1 |
| Set Value same logic: `<ENTITYINFO Remapped> = concat("Remapped sector count: ", <DRIVEATTRIBUTES REMAPPED_SECTOR_COUNT>)` | Same (test) | V1 |

## 7. Autopilot status (§13.5, pp.166–167)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| BDE can check Autopilot status | Same (Autopilot check action, §5.1) | See §5.1 feasibility note | V1 |
| Booted via PXE or USB | USB in V1; PXE (network boot) Later | — | V1 (USB) / Later (PXE) |
| With On-Premise: BDE → On-Premise → BMP; without: BDE → BMP | Eraser → NexWipe web app → Microsoft (no on-premise path — n/a) | Server function | V1 |
| Fetching can take several minutes; workflow can erase, diagnose, wait meanwhile | Same | — | V1 |
| Status in report under `…system.autopilot.enrollment_status` | Same path in NexWipe report (`nexwipe_data.hardware_report.system.autopilot.enrollment_status`) | Report schema | V1 |
| Operator instructions based on it (process, quarantine, scrap…) | Same, via Condition + Message | — | V1 |
| Use a workflow with Autopilot Check (example in manual) | Same; ship an example template | Template | V1 |
| Returned status can be stored in a workflow variable | Same | — | V1 |
| Pauses workflow by default until status returns | Same | — | V1 |
| To avoid: put in a Subworkflow with "continue before completion", rejoin with Collect | Same pattern in the template | — | V1 |

| Status | Description | Reported value | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| `NOT_PROCESSED` | Not processed; WAD client should run first | Not processed | Same code; meaning for us: "identity not yet collected from this machine" | V1 |
| `UNKNOWN` | Not fetched — connection issue, error, timeout | Unknown | Same | V1 |
| `NOT_ENROLLED` | Not enrolled | Not enrolled | Same | V1 |
| `ENROLLED` | Enrolled | Enrolled | Same | V1 |
| `NOT_AVAILABLE` | Detection threw an error | Not available | Same | V1 |
| `NO_LICENSE` | Recheck failed: no licence | No license | Same code, meaning "no wipe credits / feature off" (no charge in V1) | V1 |
| `RECHECK_FAILED` | Recheck failed for other reason | Recheck failed | Same | V1 |

## 8. Drive-level vs Computer-level mode (§13.6, pp.167–168)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Report: workflow under "System version" → Computer-level; under "Drive" → Drive-level | Same placement in the NexWipe report | V1 |
| Drive-level starts when a device is connected and detected; "Refresh" detects new drives | Same (Refresh / Ctrl+R) | V1 |
| Drive-level Start named "Connected" | Same | V1 |
| Drive-level supports hot-plugging | Same (SATA/USB/NVMe on desktops; server bays Later — README §6.4) | V1 |
| Computer-level starts at boot; Start named "Booted" | Same | V1 |
| Computer-level does not support hot-plugging | Same | V1 |
| Switch via "Start item" = Booted / Connected | Same | V1 |

| Action | Computer-level (Blancco) | Drive-level (Blancco) | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| Start | Booted | Connected | Same | V1 |
| Erase | All drives present at boot | Single current drive | Same; "all drives" still excludes boot stick and hidden removable media | V1 |
| Send report | Full report with hardware | Drive-level report | Same | V1 |
| Set value | `<ENTITYINFO>` under `…system`; `<DEVICECUSTOMFIELD>` creates global field | `<ENTITYINFO>` under `…disks.disk`; creates drive-level field | Same | V1 |
| Condition | Per-drive variables not evaluated; per-drive REPORTPATH = first found drive | Evaluated for current drive; paths filtered | Same | V1 |
| Finish | For the machine; can restart/shut down | For a drive | Same | V1 |
| Diagnose | Starts chosen tests (must be enabled in CT) | Not supported — skipped | Same | V1 |
| Subworkflow | Can start computer- or drive-level | Drive-level only | Same | V1 |
| Create custom field | Global field | Drive-level field | Same | V1 |

## 9. Running a workflow (§13.7, p.168)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Boot the image, enter communication/other settings if needed; process follows the workflow | Same | V1 |
| Operator interaction depends entirely on the workflow | Same | V1 |
| UI while fetching and while running (screenshots) | Our own screens: "Fetching workflow…" (with 30 s retry countdown) and a running view showing the current action name on each card | V1 |

## 10. Example workflow (§13.8, p.169)

Rebuilt as a ready-made template and as the end-to-end acceptance test for the workflow engine (in a VM eraser on a
disposable virtual drive).
| # | Blancco step | NexWipe builds (same) | Phase |
|---|---|---|---|
| — | (Diagram — screenshot in manual) | Our own diagram in the editor template | V1 |
| 1 | Start (Connected) – device detected | Same | V1 |
| 2 | Condition – if not acceptable → lower Finalize with "Show fail" | Same | V1 |
| 3 | Set Variable – if acceptable, value written into custom field | Same | V1 |
| 4 | Send Report – sent; existing report updated; if sending fails → lower Finalize "Show fail" | Same | V1 |
| 5 | Process finalised | Same | V1 |

## 11. REPORTPATH attribute (§13.9, pp.170–173)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| In this version REPORTPATH only in Condition (manual elsewhere shows it in Server message payloads and Set Value) | NexWipe allows it in Condition, Set Value and Server message payload values (matches the manual's own examples); never as an assignment target | V1 |
| XmlPath = nodes separated by `.` | Same | V1 |
| Syntax error in path stops workflow with INTERRUPTED | Same | V1 |
| Leaf uint/string → its text value | Same | V1 |
| Array node ("entries") → number of children | Same | V1 |
| Node doesn't exist → `""` | Same | V1 |

### 11.1 XmlPath examples (§13.9.1, pp.170–171)
| Blancco path | NexWipe path (same shape) | Phase |
|---|---|---|
| `blancco_data.blancco_hardware_report.disks.disk.interface_type` | `nexwipe_data.hardware_report.disks.disk.interface_type` | V1 |
| `…blancco_hardware_report.disks.disk.capacity` | `nexwipe_data.hardware_report.disks.disk.capacity` | V1 |
| `…blancco_erasure_report.erasures.erasure.state` | `nexwipe_data.erasure_report.erasures.erasure.state` | V1 |
| `…blancco_erasure_report.erasures.erasure.firmware_rounds` | `nexwipe_data.erasure_report.erasures.erasure.firmware_rounds` | V1 |
| `user_data.fields.My custom field` | Same | V1 |

### 11.2 Filters (§13.9.2, p.171)
| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| `…erasure[target.target_id=100].failed_sectors` selects erasures whose child matches | Same syntax | V1 |
| Several filters combine as AND: `[target.target_id=100][target.type=disk]` | Same | V1 |
| Both children must exist | Same | V1 |
| Only `elementPath=value` supported | Same | V1 |

### 11.3 Index addressing (§13.9.3, p.171)
| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| `…log_pages.log_page[2]` fetches by position | Same | V1 |
| Zero-based | Same | V1 |
| Index ≥ count → Invalid | Same | V1 |
| Can build a "for" loop over elements (diagram) | Same; runner has a loop guard (max steps per run, e.g. 100,000 — limit to confirm) so a bad loop can't hang a machine forever | V1 |

### 11.4 Drive-specific paths (§13.9.4, pp.171–172)
| Blancco path | NexWipe builds (same) | Phase |
|---|---|---|
| `…hardware_report.disks.disk` → disk currently processed | Same auto-filter | V1 |
| `…erasure_report.erasures.erasure` → erasure whose target is current drive | Same | V1 |

### 11.5 Usage examples (§13.9.5, p.172)
Each kept as an automated test (NexWipe path names).
| Blancco example | NexWipe builds (same) | Phase |
|---|---|---|
| Available memory: `moreThan(<…memory.total_memory>, 4194967295)` | Same | V1 |
| Processor cores: `moreThan(<…processors.total_cores>, 3)` | Same | V1 |
| Battery capacity `lessThan(<…battery_capacity.capacity>, 80)` — only one battery checked if several | Same, same one-battery limit documented | V1 |
| Drive features `<…features.feature[.=cryptoerase]> == "cryptoerase"` | Same | V1 |
| Last self-test `<…self_tests.self_test[id=1].Value> == "[0x00] completed without error"` | Same shape (our own result text) | V1 |
| SMART `lessThan(<…smart_attribute[name=Power On Hours].raw_value>, 1000)` | Same | V1 |
| Not cancelled `<…erasure.state> != "cancelled"` | Same | V1 |
| SMART = drive's built-in health counters | Same explanation in help | V1 |

### 11.6 Limitations (§13.9.6, pp.172–173)
| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| `.`, `[`, `]` can't appear in node names (e.g. custom field names) | Same; custom field titles with these characters are refused when created | V1 |
| `<`, `>`, `(`, `)` can't be used in Condition expressions (as literal text) | Same | V1 |
| Some values hard to use (timestamps, resolutions), e.g. `display.resolution="1920x1080"` | Same limitation documented | V1 |

## 12. Error messages (§13.10, pp.173–175)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| If the workflow can't run, an error is shown | Same, on the laptop screen; the editor also runs the same checks before saving so most errors are caught in the web app | V1 |
| Only one error at a time; next after fixing the first | Same on the laptop; the editor lists all at once (convenience) | V1 |

Same messages (own wording, same meaning), each with a test case. All **V1** unless noted.
| Error message | Explanation | Solution | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| Unknown error | Not recognised | Send issue report to Blancco | Same; "Send issue report to NexWipe" | V1 |
| Invalid start item | First action invalid | Check versions match | Same; check format version | V1 |
| Failed to parse expression [expression] | Couldn't parse | Check Condition/Set Value syntax | Same | V1 |
| Unknown erasure standard | Not recognised | Check versions | Same | V1 |
| Incorrect workflow data | Bad data | Check versions; recreate | Same | V1 |
| Invalid operand value [value] | Bad operand | Check syntax | Same | V1 |
| Unknown hardware test [test name] | Unknown test | Check versions; contact dev team | Same; contact NexWipe | V1 |
| Hardware test [test name] parsing failed | Parsing failed | Check versions | Same | V1 |
| Invalid placement of parentheses in [expression] | Bad `()` | Close each pair | Same | V1 |
| Unsupported DRIVEATTRIBUTES parameter [name] | Unsupported | Check spelling/versions | Same | V1 |
| Unsupported variable [name] | Unsupported | Check spelling/versions | Same | V1 |
| Invalid subworkflow name [name] | Bad name | Not empty, ≤255 symbols | Same limit (also applied to all workflow names) | V1 |
| Workflow cannot call itself | Recursion | Remove own name | Same | V1 |
| Could not fetch subworkflow [name] | Fetch failed | Check name exists | Same | V1 |
| Drive-level workflow cannot call computer-level workflow | Wrong direction | Computer → drive only | Same | V1 |
| Pre-configured custom field is locked | Locked field in image | Remove conflicting Custom field / Set Value | Same (locked field from setup file) | V1 |
| None of the optical test options were chosen. | Optical drive without Read/Write/Blank | Deselect or choose a subtest | Same | V1 |
| Invalid regular expression "EXPRESSION". | Bad regex | Check it | Same | V1 |
| Empty question. | Question empty | Fill in | Same | V1 |
| Empty message. | Message empty | Fill in | Same | V1 |
| The custom field has an empty title. | Title empty | Fill in | Same | V1 |
| The custom field's dropdown/multi dropdown list does not have any option. | No options | Fill in | Same | V1 |
| Invalid sleep time. | Duration invalid | 0–2,000,000,000 ms | Same | V1 |
| Unsupported URL "URL". | Bad protocol | `http://` or `https://` | Same | V1 |
| Invalid timeout value "TIMEOUT". | Bad timeout | 1–2,000,000 s | Same | V1 |
| Invalid element in JSON reply: JSON_PATH. | Bad reply template | Must be an assignable tag | Same | V1 |
| Invalid extra HTTP headers. | Bad headers | Check value | Same | V1 |
| Default value doesn't match the regular expression. | Mismatch | Change one | Same | V1 |
| Interactive workflow items cannot be used with remote erasure control. | Interactive items (Create Custom Field, Diagnose, Question, Message) while UI locked by remote control | Remove them or change "Erasure control" from remote | Same rule with "Controlled from NexWipe web app" | V1 |
