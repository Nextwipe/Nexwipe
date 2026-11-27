# Plan — Chromebooks with NexWipe Eraser

Mirrors: research [15-special-hardware/chromebooks.md](../../../research/blancco-drive-eraser/15-special-hardware/chromebooks.md)

**In short**
- Phase **Later** for everything in this file. NexWipe copies Blancco's network process: one laptop/desktop runs NexWipe
  Eraser as a **station**; Chromebooks in Developer mode join it over the network, are factory-reset on command, can run
  the same Chromebook hardware tests, and get one report each.
- One deliberate difference, required by NexWipe's existing rules (`AGENTS.md`, `agent-handoff/AGENTS.md`): **a
  Powerwash/factory reset is not proof of deprovisioning or erasure.** Blancco calls its report proof "that the erasure
  has taken place"; NexWipe's report says "Factory reset reported by the Chromebook" and never "Erased".
- It plugs into the existing Chromebook track (`chromebook_records`/`chromebook_events`, `chromebook_*` RPCs,
  `src/lib/chromebook.ts`, routes `app.chromebooks.*`): reset status and management status stay independent;
  resale-ready stays decided only by `_cb_resale_blockers`. Chromebooks never get drive-erasure jobs.
- The pairing command (`curl … | bash` as root) is copied in shape, but served with a one-time code and checksum so
  a Chromebook can only pair with the station that showed the code.

Source kept from research: Blancco Drive Eraser User Manual v7.21.0, chapter 12 (pp.144–149) and §15–15.2 (pp.180–181).

Terms used here (NexWipe equivalents):

| # | Blancco term | NexWipe equivalent / note | Phase |
|---|---|---|---|
| T1 | ChromeOS | Same | Later |
| T2 | Powerwash (ChromeOS factory reset; the manual says "factory reset") | Same term; NexWipe records it as a reset reported by the device, never as erasure | Later |
| T3 | Factory reset | Same meaning | Later |
| T4 | Recovery mode | Same; only the doorway to Developer mode | Later |
| T5 | Developer mode (OS verification off, root shell) | Same; a technician-performed ChromeOS step, recorded separately from NexWipe operations (`agent-handoff/AGENTS.md`) | Later |
| T6 | OS verification | Same | Later |
| T7 | Virtual terminal (VT) | Same | Later |
| T8 | Locked / enrolled (enterprise enrolment) | Same; maps to the existing management status in `chromebook_records` | Later |
| T9 | Rooted Chromebook | Same | Later |
| T10 | GBB flags | Same; read with `futility gbb --get --flags` (confirm in lab) | Later |
| T11 | Firmware write protection (screw/jumper or software) | Same; read with `crossystem wpsw_cur` and `flashrom --wp-status` (confirm in lab) | Later |
| T12 | CT / BDE CT; BMP | Prepare stick page; the NexWipe web app | Later |
| T13 | DHCP server | Same | Later |

## Supported Chromebooks (§12.1, p.144)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Any Chromebook made from **2015** onward, ARM or Intel | Same support statement | The Chromebook runs only a shell script + browser page, so CPU type does not matter | Later |
| 2 | Before 2015 not officially supported | Same | — | Later |
| 3 | Rooted Chromebooks detected as normal ones (not flagged) | NexWipe goes one step further where it can: reports GBB flags and write-protect state (see §15.2) so a modified device is visible; never claims a device is "not rooted" | Script reads `crossystem`, GBB flags | Later |

## Minimum requirements (§12.2, p.144)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 4 | Latest CT binary | Prepare stick page (always the latest; no binary to install) | Web app | Later |
| 5 | Latest BDE image | Latest NexWipe Eraser image from the NexWipe Eraser section | Stick Creator | Later |
| 6 | Normal Chromebook, 2015+, **neither locked nor enrolled** | Same requirement; the station refuses to start a reset when the script reports enterprise enrolment, and the existing Chromebook record shows the management status | Enrolment read in script (method: confirm in lab) | Later |
| 7 | Network with DHCP and a switch (internet preferred for updates) | Same | — | Later |
| 8 | Laptop/desktop running the image, preferably with no internal drive | Same advice; the station stick has a "Chromebook station" mode in which **no local drive can be erased** | Station mode flag in `nexwipe-setup.json` | Later |
| 9 | BMP or Blancco Cloud account for licences and reports | NexWipe web app account | — | Later |
| 10 | Drive Eraser licences (erasure) | Wipe credits, one per processed Chromebook (no charge in V1; payment Later) | Credit ledger (step 18 plan) | Later |
| 11 | Optional USB-to-Ethernet adapters | Same | — | Later |
| 12 | Work split between station and Chromebook; operator prepares and connects | Same split | — | Later |
| 13 | About **10 minutes** per machine | Same target; measured in lab | — | Later |
| 14 | Chromebook must be on the network; cable easiest, wireless possible | Same | — | Later |

## Prepare Blancco Drive Eraser (§12.3, pp.144–145)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 15 | Configure image before booting; once booted can be left running as a station | Same | — | Later |
| 16 | Turn on "Report per connected devices" mode | Same mode on Prepare stick page ("One report per connected device") | `process.mode = per_connected_device` | Later |
| 17 | HTTP: turn on "Chromebook support", note CB_Port; Process > Connected Devices > Chromebook Support > HTTP Port, default **80** | Same setting path and default 80 | Station serves the welcome page on that port | Later |
| 18 | HTTPS port must be configured too | Same; HTTPS port setting (default 443). The pairing script and results go over HTTPS with the station's own certificate fingerprint shown on the welcome page | Station TLS (confirm design in lab) | Later |
| 19 | Turn on Chromebook diagnostics/hardware tests and set up the BMP connection | Same: choose Chromebook tests; web app connection is already baked into the stick | — | Later |
| 20 | Boot the configured image on the laptop | Same | — | Later |
| 21 | Connect to network; note BDE IP shown bottom-left | Same: station IP shown bottom-left | — | Later |
| 22 | Drop-down filters view: drives only, Chromebooks only, or both | Same filter | Kiosk UI | Later |
| 23 | Connected Chromebook appears on **grey** background; select it and press **Erase** | Same grey card; the button is named **"Factory reset"**, not "Erase" (honesty rule: it is not a NexWipe erasure) | — | Later |
| 24 | Background turns **white**, serial numbers shown, factory-reset progress shown (Successful / Failed) | Same; statuses "Reset reported successful" / "Reset failed" | Script reports progress to station | Later |
| 25 | Any custom field can be filled for a Chromebook (e.g. Asset ID) | Same custom fields | Step 13 plan | Later |
| 26 | Each Chromebook gets an individual report: review, save to USB, send to BMP | Same; sent report creates/updates the Chromebook's existing `chromebook_records` entry and adds a `chromebook_events` row via trusted server code | Agent API (`src/server/agent-api/`) | Later |
| 27 | When done, select it and press **X** (bottom right) to remove it; **this also shuts the Chromebook down** | Same button, same warning that it shuts the Chromebook down | Station sends shutdown to script | Later |

## Preparing a Chromebook (§12.4, p.145)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 28 | Must be switched to Developer mode before processing | Same; technician-performed, recorded as a technician step | Help page | Later |
| 29 | Can be done ahead: switch, shut down, boot again just before | Same tip | Help page | Later |
| 30 | Official instructions link (Chromium developer mode doc) | Same link in help | — | Later |
| 31 | Switching takes a few minutes; wait | Same note | — | Later |

### Enable Recovery and Developer mode, regular Chromebooks (laptops) (§12.4.1.1, pp.145–146)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 32 | **Esc + Refresh (F3) + Power** → Recovery mode | Same step in NexWipe help | Help page with pictures | Later |
| 33 | When asked for recovery media, **Ctrl + D** | Same | — | Later |
| 34 | **Enter** when prompted | Same | — | Later |
| 35 | After reboot: "OS verification is off" | Same | — | Later |
| 36 | **Ctrl + D** to continue, or wait | Same | — | Later |
| 37 | Some need **Esc + Maximize + Power** | Same note | — | Later |

### Enable Recovery and Developer mode, keyboardless Chromebooks (tablets) (§12.4.1.2, p.146)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 38 | External keyboard required for the terminal | Same | — | Later |
| 39 | Hold **Power + Volume-Up + Volume-Down 10 s** → Recovery | Same | — | Later |
| 40 | Navigate with Volume keys, select with Power | Same | — | Later |
| 41 | **Volume-Up + Volume-Down** together → Developer mode, confirm | Same | — | Later |

## Process a Chromebook (§12.5, pp.146–147)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 42 | Most work on the Chromebook, some on the station | Same | — | Later |
| 43 | Welcome Screen → **"Get Started"** | Same | — | Later |
| 44 | Network screen: connect if needed → **"Next"** | Same | — | Later |
| 45 | Wireless can be configured here | Same | — | Later |
| 46 | With internet, accept Google terms of service; otherwise go to step 5 | Same | — | Later |
| 47 | With internet, wait for updates | Same | — | Later |
| 48 | **"Browse as Guest"** | Same | — | Later |
| 49 | Enter station IP in address bar (e.g. `192.168.50.110`) | Same | — | Later |
| 50 | Add port if CB_port ≠ 80 (e.g. `:81`) | Same | — | Later |
| 51 | Welcome screen "Welcome to Blancco Chromebook Diagnostics"; follow instructions | NexWipe welcome page ("NexWipe Chromebook station") with the same instructions and the **exact command for this station** printed on it (Blancco's manual implies this but does not say it) | Station web page | Later |
| 52 | VT via **Ctrl+Alt+F2**, **Ctrl+Alt+Right Arrow** or **Ctrl+Alt+Refresh** | Same keys listed | — | Later |
| 53 | Log in as **root** at `localhost login:` | Same | — | Later |
| 54 | Type `curl <ip>/s/<n> \| bash` | Same shape: `curl -fsS https://<station-ip>:<port>/s/<one-time-code> \| bash`; script is short-lived and only valid for that code (security note: a plain `curl \| bash` over HTTP could be spoofed on a shared network) | Station serves script; code expires after use (confirm TLS handling on ChromeOS curl in lab) | Later |
| 55 | Return with **Ctrl+Alt+F1** or **Ctrl+Alt+Left Arrow** | Same | — | Later |
| 56 | Screen shows **"Connection established"** — paired | Same message meaning | Script ↔ station channel | Later |
| 57 | Chromebook shows its ID top right (e.g. **CB-3**) | Same ID style "CB-3" | — | Later |
| 58 | Chromebook appears in the station interface | Same | — | Later |
| 59 | [Station] Select and **erase** (same ID shown); this enables diagnostics in the Chromebook browser; skip to step 10 if none configured | Same flow with the **Factory reset** button; same ID on both screens | — | Later |
| 60 | [Chromebook] Diagnostics run from the browser | Same (tests below) | Station web page + script | Later |
| 61 | Review diagnostics, press **"Upload to Blancco Drive Eraser"** | Same, button "Upload to station" | — | Later |
| 62 | [Station] Review report, fill custom fields, send to BMP | Same, send to web app | — | Later |
| 63 | Chromebook box shows icons for diagnostics, custom-field update and report sending | Same three status icons | — | Later |
| 64 | Must reboot; Developer mode turned off during reboot; **"Reboot now"** on Chromebook or **X / Dismiss** on station | Same buttons | Script asks firmware to leave Developer mode on next boot (`crossystem disable_dev_request=1`, confirm in lab) | Later |

How the reset itself is triggered (not described by Blancco; NexWipe's method, to be confirmed in lab): the script
requests ChromeOS's own Powerwash for the next boot (e.g. the stateful-partition reset request file) and reports what it
did. Because this is ChromeOS's own wipe, NexWipe records it as **"Factory reset reported by the Chromebook"** — not
verified, not a NexWipe erasure, not deprovisioning.

## Chromebook hardware tests (§12.6, pp.147–148)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 65 | If configured: memory, CPU, battery capacity, battery discharge (full list below) | Same | Script + station web page | Later |
| 66 | Test icon colour shows state; hover shows hint | Same | — | Later |
| 67 | Gray = "Hardware tests not executed" | Same colour and meaning | — | Later |
| 68 | Yellow = running, **blinks** | Same | — | Later |
| 69 | Red = one or more failed | Same | — | Later |
| 70 | Green = all passed | Same | — | Later |
| 71 | Battery Capacity: capacity vs design max and cycles; default **60%**; adjustable | Same rule and default as [12-hardware-tests](../12-hardware-tests/README.md) §9.1 | `/sys/class/power_supply` on the Chromebook | Later |
| 72 | Battery Discharge: unplugged; ≥ 50% advised (configurable initial charge); cannot start below **20%**; p.p. thresholds (25 p.p. from 80% fails below 55%) | Same; Chromebook minimum 20% | Same rule as §9.2 | Later |
| 73 | CPU Basic: calculations; Successful/Failed | Same | Script | Later |
| 74 | Display: colours to spot dead pixels (RGB) | Same | Browser page | Later |
| 75 | Keyboard: pressed keys appear in a text area; some keys (e.g. function keys) not captured; green working / yellow maybe stuck / red maybe not working | Same (browser-based, so same limits) | Browser page | Later |
| 76 | Memory: low and extended, pattern write/read/verify; slow; Successful/Failed | Same | `memtester` on the Chromebook (as Blancco's §9.9 note suggests) | Later |
| 77 | Touchpad: click buttons and circled areas; red → yellow → green | Same | Browser page | Later |
| 78 | Webcam: video stream; browser pop-up, click **"Allow"** | Same | Browser camera API | Later |

## Process outcome (§12.7, pp.148–149)

| # | Blancco says | NexWipe builds | How | Phase |
|---|---|---|---|---|
| 79 | All user data erased (**factory reset**) | Records "Factory reset reported by the Chromebook" as a reset status on the existing Chromebook record; never sets an erasure or deprovisioning status | Existing `chromebook_*` RPCs; trusted code only for `api_reported` values | Later |
| 80 | Report "proving that the erasure has taken place", with hardware and diagnostic info | Report has the same hardware and diagnostic info, but **does not** say erasure is proven. Wording: "ChromeOS factory reset was requested and reported complete by the device. This is not a verified erasure." | Report template | Later |
| 81 | After reboot to normal mode, ChromeOS reusable, no re-image needed | Same expected outcome; NexWipe records whether the device left Developer mode only if the device reports it | — | Later |

### What the manual claims, and what it does not

| # | Research reading | NexWipe plan | Phase |
|---|---|---|---|
| 82 | Claimed: "Erase" runs a factory reset over the network with Successful/Failed; report described as proof of erasure | NexWipe copies the network reset and status, **not** the proof claim (AGENTS.md: a Powerwash or setup screen is not proof of deprovisioning or erasure) | Later |
| 83 | Not stated: erasure method/standard, overwrite or verification, how the reset is done | Same gap; NexWipe states plainly in the report that no NexWipe erasure standard was applied | Later |
| 84 | Not stated: removing enrolment or locks; manual requires neither locked nor enrolled | Same: NexWipe does not deprovision; management status in `chromebook_records` stays independent and only integration-confirmed deprovisioning (trusted code) can change it | Later |
| 85 | Developer mode expected to switch off on final reboot, but §15.2 says some stay stuck | Same; see §15.2 rows | Later |

## Troubleshooting (§15, §15.1, §15.2, pp.180–181)

### General: getting help (§15, p.180)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 86 | Blancco Support KB / ticket at support.blancco.com; collect machine info first | n/a for NexWipe — Blancco's support. Equivalent: NexWipe help pages + "Contact support" in the web app | Web app | Later |
| 87 | Click **"Report issue"** (or **F3**) after reproducing | Same button and F3 on the station | Issue report (step 13 plan) | Later |
| 88 | Write a short description | Same | — | Later |
| 89 | Save issue report to USB or send to BMP | Same: save to USB or send to the web app | — | Later |
| 90 | Submit ticket at support.blancco.com (Submit a Ticket → Next → details + attach → Submit) | n/a for NexWipe — instead, an issue report sent to the web app opens a support request automatically; no separate ticket site | Web app | Later |

### §15.1 Required files not found (p.180)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 91 | Message: some required files not found; reboot and wait longer for the welcome screen before switching to terminal; if it persists, create an issue report and contact support | Same message meaning (own wording) | Script checks its required ChromeOS tools exist | Later |
| 92 | Cause: terminal opened before components and drivers initialised | Same explanation in help | — | Later |
| 93 | Fix: reboot, wait for the full Welcome Screen (after Google logo); wait longer if needed | Same | — | Later |
| 94 | Some machines (e.g. Lenovo ThinkPad 13 Chromebook on ChromeOS 94): update ChromeOS via OTA | Same known issue in the compatibility list | `eraser_model_notes` | Later |
| 95 | If the **last line** of the message is missing → communication problem between station and device | Same design: the last line is sent by the station, so its absence shows the link is broken | — | Later |

### §15.2 Device stays in Developer mode after erasure (pp.180–181)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 96 | Exception "Some internal attributes (GBB flags) have abnormal values." | Same exception meaning | `futility gbb --get --flags` ≠ 0 (confirm in lab) | Later |
| 97 | Exception "Firmware write protection via hardware is disabled." | Same | `crossystem wpsw_cur` = 0 | Later |
| 98 | Exception "Firmware write protection via software is disabled or its range is zero." | Same | `flashrom --wp-status` | Later |
| 99 | Device protection (screw/jumper or software) may stop Developer mode being disabled; see device's own docs | Same note; these exceptions also mark the Chromebook record so it cannot look resale-ready until a person resolves it (through `_cb_resale_blockers`, not the UI) | Existing resale rule; any new blocker added only in SQL | Later |

## Notes for building this track
- Code location: the Chromebook script and station mode belong to the **eraser** code base (outside `agent-handoff/`),
  because the reset is a state-changing action; the existing read-only `agent-handoff/chromebook-discovery/` stays as is.
- Any change to the existing Chromebook track (e.g. a new event type in `chromebook_events`) is a change to an existing
  section and needs the owner's approval, a migration with undo file, and the Lovable prompt (step 18 plan).
- Needs physical Chromebooks (Intel and ARM, 2015+) in the test lab.
