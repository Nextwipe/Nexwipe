# Plan — Step 12 — Hardware tests (diagnostics for resale grading)

Mirrors: research [12-hardware-tests/README.md](../../../research/blancco-drive-eraser/12-hardware-tests/README.md)

**In short**
- NexWipe Eraser gets the same 21 hardware tests, with the same automatic/manual split, the same pass/fail rules and the
  same default thresholds. Results go into the same report as the erasure, so a laptop can be graded for resale.
- The admin chooses tests, thresholds and mandatory/optional on the **Prepare stick** page of the new NexWipe Eraser
  section in the web app; the choices are baked into the signed `nexwipe-setup.json` on the stick.
- The step is **off by default**; when on, it is the second step of the default flow. Phase **V1** for Windows laptops
  and desktops; Chromebook-only variants are **Later**.
- On the laptop the tests are pages of the full-screen NexWipe screen (Chromium kiosk); the eraser engine on 127.0.0.1
  reads the hardware. Reuse the rules already proven in `agent-handoff/station/nd_station/hwtest.py` (keyboard,
  display, webcam, microphone, speakers, touchpad, battery, Wi-Fi), but rebuild them in the graphical screen.
- No test ever touches a drive's data, and no test result ever says hardware is "verified".

Source kept from research: Blancco Drive Eraser User Manual v7.21.0, §4.3 (pp.47–49) and chapter 9 (pp.114–136).

Terms used below (NexWipe equivalents):

| # | Blancco term | NexWipe equivalent | Phase |
|---|---|---|---|
| T1 | BMP (Blancco Management Portal) | The NexWipe web app (reports, wipe credits, remote control) | V1 |
| T2 | CT (Configuration Tool) | **Prepare stick** page in the NexWipe Eraser section of the web app | V1 |
| T3 | UEFI (modern start-up firmware) | Same term; the eraser checks `/sys/firmware/efi` to know it booted in UEFI mode | V1 |
| T4 | p.p. (percentage points: the difference between two percentages) | Same unit, same wording on screen and in the report | V1 |

Common build notes for every test (apply to all rows below):
- **Where settings live:** each test has a block in `nexwipe-setup.json` (`hardware_tests.<test>`: `enabled`,
  `mandatory`, thresholds). Edited on the Prepare stick page; signed so the stick cannot be edited by hand.
- **Where results live:** a "Hardware tests" section of the eraser report (step 13), and one row per test in the new
  `eraser_hardware_test_results` table once the report reaches the web app (see step 18 table list).
- **Screens:** each test is a page in the kiosk app; the engine exposes `GET/POST 127.0.0.1/api/hwtest/<test>`.
- **Engine reads hardware** with standard Linux interfaces: `/sys/class/power_supply`, `/sys/class/hwmon`, evdev
  (`/dev/input/event*`), ALSA (`arecord`/`aplay`/`amixer`), V4L2 (camera), BlueZ, ModemManager (`mmcli`), `rfkill`,
  `iw`, `ip`, `ping`, `dmidecode`, `stress-ng`.

---

## 1. The Hardware tests step in the BDE screen (§4.3, pp.47–49)

### 1.1 Turning it on and where it sits (§4.3, p.47)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Step disabled by default; CT turns it on/off | Step off by default; switch "Hardware tests step" on the Prepare stick page | `hardware_tests.step_enabled = false` default in `nexwipe-setup.json` | V1 |
| 2 | When enabled it is the **second** default step; clicking it lists every available test in the work area | Second step in the left step list of the kiosk screen; clicking shows all enabled tests | Step order comes from the default workflow (step 06 plan) | V1 |

### 1.2 Tab colour and overall progress (§4.3.1, p.47)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 3 | No icon = not started ("manual tests not started") | No icon on the step tab until a test starts; hint "Tests not started" | Kiosk app state from engine | V1 |
| 4 | Green check mark = all tests successful | Green check on the tab when every included test is Successful | Same | V1 |
| 5 | Red "!" = at least one test failed | Red "!" when any included test is Failed | Same | V1 |
| 6 | Number of tests running and their status written under the tab label | Under the tab label: "2 running · 5 passed · 1 failed" style line | Same | V1 |
| 7 | Colour logic for all status icons: grey = not started/not defined, yellow = problem or not fully finished, green = successful, red = error/stopped/cancelled; hover shows more info | Same four colours with the same meanings everywhere in the kiosk screen; hover/focus shows a tooltip | One shared status-icon component in the kiosk app (also used by steps 04/05) | V1 |

### 1.3 Work area (§4.3.2, p.47)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 8 | Work area lists the available tests and their states; the set is chosen in the CT | Same list; set chosen on the Prepare stick page | List built from `hardware_tests.*.enabled` | V1 |

### 1.4 Available tests (§4.3.2.1, p.48)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 9 | Each test described in chapter 9 | All 21 tests, described in sections 2 and 3 below | — | V1 |

### 1.5 Running tests and the Test button (§4.3.2.2, pp.48–49)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 10 | Select the tests to run; some run automatically | Tick boxes per test; automatic tests (Battery Capacity at boot) start by themselves | Engine starts auto tests when the session begins | V1 |
| 11 | Click **Run selected tests** or **Ctrl+T** | Button "Run selected tests" and shortcut **Ctrl+T** | Kiosk key handler | V1 |
| 12 | Results column right of each test name | Results column right of each test name | — | V1 |
| 13 | State **Not performed** = not run yet | Same state and wording "Not performed" | Result enum `not_performed` | V1 |
| 14 | State **Successful** = ran, hardware worked | Same "Successful" | `successful` | V1 |
| 15 | State **Failed** = ran, hardware did not work | Same "Failed" | `failed` | V1 |
| 16 | State **Cannot be performed** = can't run on this hardware | Same "Cannot be performed" (e.g. no webcam found) | `cannot_be_performed` | V1 |

### 1.6 General rules for all tests (§9, p.114)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 17 | Two kinds: **Automatic** (no user action) and **Manual** (user input; selected then run) | Same two kinds; each test row shows "Automatic" or "Manual" | `kind` field per test in the engine's test catalogue | V1 |
| 18 | Manual says "three possible end results" but lists four: Successful, Failed, Not Performed, Not Available | NexWipe has exactly four end results and says "four". "Not Available" in Blancco's chapter 9 = "Cannot be performed" in §4.3; NexWipe uses one name, "Cannot be performed", to avoid two words for one state | Same enum as rows 13–16 | V1 |
| 19 | Unticked test is **not included in the report** | Same: unticked = left out of the report entirely | Report builder skips unticked tests | V1 |
| 20 | CT: each test enabled or disabled | Same per-test "Enabled" switch | `hardware_tests.<test>.enabled` | V1 |
| 21 | CT: **mandatory** = cannot be unticked | Same "Mandatory" switch; box greyed and locked on the laptop | `mandatory: true` | V1 |
| 22 | CT: **optional** = can be unticked | Same; default for every test is optional | `mandatory: false` | V1 |

### 1.7 Common pattern in manual tests

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 23 | Most manual tests end with a dialog with a free-text notes field | Same end dialog with "Notes" text field; notes go into the report next to the result | Shared dialog component | V1 |
| 24 | **Pass** sets Successful | Same | — | V1 |
| 25 | **Fail** sets Failed | Same | — | V1 |
| 26 | **Skip** leaves current status unchanged | Same | — | V1 |
| 27 | Dialog used for Display, Keyboard, PC speaker, Pointing devices, SIM card presence, Speaker, USB ports, Webcam; PC speaker has only Pass and Fail | Same tests use the dialog; PC speaker dialog shows only Pass and Fail | Dialog takes a `buttons` list | V1 |

---

## 2. Summary of all tests (§9.1–9.21, pp.114–136)

Same 21 tests, same types, same rules, same defaults. "How" is the Linux source the engine reads.

| # | § / page | Test | Type (same) | Pass/fail rule (same) | Settings (same default) | How | Phase |
|---|---|---|---|---|---|---|---|
| 28 | 9.1, p.114 | Battery Capacity | Manual and automatic; runs at boot | Pass if capacity ≥ threshold; always fails if voltage < ~75% of minimum design voltage | Threshold **60%** | `/sys/class/power_supply/BAT*` | V1 |
| 29 | 9.2, p.115 | Battery Discharge | Automatic | Fails if drop > threshold within time limit, or charge ≤ 10%; won't start < 50% (20% on Chromebooks) | **50 p.p.**, **10 min** | `power_supply` + `stress-ng` load | V1 (Chromebook 20%: Later) |
| 30 | 9.3, p.116 | BIOS logo | Manual | Operator S / F / P | — | ACPI BGRT image | V1 |
| 31 | 9.4, p.117 | Bluetooth | Detection automatic, operator verdict | Operator passes/fails | — | BlueZ | V1 |
| 32 | 9.5, p.118 | CPU Basic | Automatic | Successful/Failed | — | Engine self-check calculations | V1 |
| 33 | 9.6, p.118 | CPU Stress | No label (behaves automatic) | Fails if temperature > threshold | Threshold (Blancco gives no default); °C/°F (Ctrl+M); **3 min** | `stress-ng` + hwmon | V1 |
| 34 | 9.7, p.118 | Display | Manual | Pass / Fail / Skip | — | Kiosk colour pages | V1 |
| 35 | 9.8, p.120 | Keyboard | Manual | Pass / Fail / Skip; optional required-keys % before Pass | Required-keys %, layout, Full Size/Compact | evdev | V1 |
| 36 | 9.9, p.122 | Memory | Automatic | Successful/Failed | Passes, up to **99** | Pattern test in engine | V1 |
| 37 | 9.10, p.123 | Microphone | Automatic | Not stated by Blancco | Master volume **70%**; no mic sensitivity | ALSA | V1 |
| 38 | 9.11, p.123 | Motherboard | Automatic | Successful "if any of the tests are successful"; CMOS battery fails if clock > 365 days behind | 365 days | RTC, CMOS, efivars, DMI | V1 |
| 39 | 9.12, p.124 | Network | Automatic | Pass if port has IP or configured IPs answer ping; auto-fail cases | Extra IPs to ping | `ip`, `ping` | V1 |
| 40 | 9.13, p.125 | Optical devices | Manual | Successful if attempted sub-tests finish without errors | Default sub-test set | `xorriso` (confirm in lab) | V1 |
| 41 | 9.14, p.126 | PC speaker | No label, operator confirms | Pass / Fail | — | `pcspkr` input device | V1 |
| 42 | 9.15, p.127 | Pointing devices / Touchpad | Manual | Pass / Fail / Skip | — | Kiosk pointer events | V1 |
| 43 | 9.16, p.129 | SIM card presence | Manual | Pass / Fail / Skip | — | ModemManager | V1 |
| 44 | 9.17, p.130 | Speaker | No label, operator confirms | Pass / Fail / Skip | Volume slider | ALSA | V1 |
| 45 | 9.18, p.131 | Touchscreen | Manual | Operator decides | — | Kiosk touch events | V1 |
| 46 | 9.19, p.132 | USB ports | Manual | Pass / Fail / Skip | Read and write sub-tests optional | sysfs USB + timed I/O | V1 |
| 47 | 9.20, p.133 | Webcam | Manual | Pass / Fail / Skip | — | Kiosk camera / V4L2 | V1 |
| 48 | 9.21, p.134 | Wi-Fi adapters | Automatic | Auto pass/fail if SSID set; otherwise operator decides when no networks found | SSID (optional) | `rfkill`, `iw`, DHCP | V1 |

---

## 3. Each test in detail

### 9.1 Battery Capacity (pp.114–115)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 49 | Checks charge capacity and charge cycles of **every** battery; labelled manual and automatic; compares current maximum capacity with maker's design maximum ("battery health") | Same, for every battery found; shows capacity % and cycle count per battery | `energy_full / energy_full_design` (or `charge_full / charge_full_design`) × 100; `cycle_count` from `/sys/class/power_supply/BAT*` | V1 |
| 50 | Runs automatically at boot; also via workflow, or re-run from the screen | Same: auto at session start, workflow action "Run hardware test: Battery Capacity", Re-run button | Engine start hook + workflow action (step 06) | V1 |
| 51 | New battery ≈ 100%, worn-out ≈ 0% | Same scale; help text on screen explains it | — | V1 |
| 52 | Current charge level does not matter | Same: uses full-charge capacity, never current charge | — | V1 |
| 53 | Default threshold **60%**, changeable; ≥ threshold = Successful, below = Failed | Same default 60%, editable on Prepare stick page; ≥ = Successful | `hardware_tests.battery_capacity.threshold_pct = 60` | V1 |
| 54 | Fails regardless of capacity if voltage < discharge cut-off (~**75%** of minimum design voltage); error shows current and minimum design voltage | Same rule and same error content (current voltage, minimum design voltage) | `voltage_now < 0.75 × voltage_min_design` (confirm which sysfs fields each maker fills, in lab) | V1 |
| 55 | Battery not listed = BDE could not read charge/max capacity; some makers don't follow standards; "nothing BDE can do" | Same: battery shown as "Battery could not be read — the battery does not report standard values" and test = Cannot be performed | Missing sysfs fields | V1 |

### 9.2 Battery Discharge (pp.115–116)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 56 | Checks how fast the battery drains; labelled automatic | Same | Engine samples `capacity` every few seconds | V1 |
| 57 | Device must be **unplugged**; charge should be ≥ 50% to reduce freeze risk | Same instructions on screen; refuses to start while charger is online | `/sys/class/power_supply/AC*/online` (or `ADP*`) must be 0 | V1 |
| 58 | Cannot start below **50%**; on Chromebooks minimum **20%** | Same: 50% on laptops/desktops (start minimum configurable like Blancco's "initial charge", default 50) | `hardware_tests.battery_discharge.min_start_pct = 50` | V1 (20% Chromebook rule: Later) |
| 59 | Stops automatically when the drop reaches the threshold or charge goes **below 10%** ("minimum security charge", built in) | Same: stops at threshold drop or at ≤ 10%; 10% is fixed, not configurable | Hard-coded constant in engine | V1 |
| 60 | Limits exist so a sudden shutdown does not lose **both licence(s) and report** | Same reason: the report lives in RAM until saved/sent (step 13) and the wipe credit would be spent | — (wipe credits: no charge in V1; payment Later) | V1 |
| 61 | Fails if loss > pass threshold within the time limit; defaults **50 p.p.** and **10 min**, both changeable | Same defaults, editable | `threshold_pp = 50`, `time_limit_min = 10` | V1 |
| 62 | p.p. explained: 25 p.p. from 80% fails below 55% | Same explanation shown as help text | — | V1 |
| 63 | Case 1: at 40% → does not start | Same; automated unit test for this case | Engine rule + test case | V1 |
| 64 | Case 2: 60% start, 40 p.p. → passes if end > 20% | Same; unit test | — | V1 |
| 65 | Case 3: 75% start, 70 p.p. → would pass above 5%, but fails if charge reaches ≤ 10% at any point | Same; unit test | — | V1 |
| 66 | Report shows e.g. `10m1s, 100%->91% (9/50)` | Same format: duration, start→end %, (drop/threshold) | Report formatter | V1 |
| 67 | Puts CPU under heavy load; on a poor battery this can make an erasure fail and may corrupt the drive; consider external cooling if CPU overheats | Same warning on screen before start; NexWipe also refuses to run this test while an erasure is running on the same laptop (safety rule: firmware commands must not lose power) | `stress-ng --cpu 0`; engine lock between erasure and discharge test | V1 |
| 68 | Laptops with more than one battery are seen as one | Same: combined into one figure, note in report "2 batteries measured together" | Sum `energy_now` across BAT* | V1 |
| 69 | Hot-swapping batteries not supported | Same: if the battery list changes mid-test → test stops, "Cannot be performed — battery changed during the test" | udev power_supply events | V1 |

### 9.3 BIOS logo (pp.116–117)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 70 | Checks whether the logo is the maker's or customised (e.g. corporate branding); manual | Same | — | V1 |
| 71 | Shown only on UEFI machines; Apple MacBooks show no image | Same: non-UEFI → Cannot be performed; Macs show no image | `/sys/firmware/acpi/bgrt/image` exists only when firmware provides it | V1 (Macs: Later) |
| 72 | Displays current BIOS logo if available | Same | Engine serves the BGRT bitmap to the kiosk page | V1 |
| 73 | Ends with **Esc**, or **S** Skip, **F** Fail, **P** Pass, or buttons | Same keys and buttons | Kiosk key handler | V1 |

### 9.4 Bluetooth (p.117)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 74 | Detects and diagnoses Bluetooth adapters automatically | Same | `/sys/class/bluetooth/hci*`; power on adapter and run a short scan with BlueZ (`bluetoothctl`) | V1 |
| 75 | Adapters shown on screen and in the Hardware report; usually a MAC address, sometimes a name | Same | Adapter address and name from BlueZ | V1 |
| 76 | Operator must pass or fail when finished | Same | End dialog | V1 |

### 9.5 CPU Basic (p.118)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 77 | Checks the processor calculates correctly; automatic | Same | Engine runs fixed calculations (integer, floating point, SIMD) on every core and compares with known answers | V1 |
| 78 | Result Successful or Failed | Same | — | V1 |

### 9.6 CPU Stress (p.118)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 79 | Measures CPU temperature against a threshold | Same | `stress-ng --cpu 0 --timeout <dur>`; temperature from `/sys/class/hwmon` (`coretemp`/`k10temp`) or thermal zones | V1 |
| 80 | Failed if above threshold, Successful if it stays below | Same | Max reading during the run | V1 |
| 81 | °C/°F toggle or **Ctrl+M** | Same toggle and Ctrl+M | — | V1 |
| 82 | Duration settable, default **3 minutes** | Same default 3 min | `hardware_tests.cpu_stress.duration_min = 3` | V1 |
| 83 | No default temperature threshold given | Same: NexWipe ships **no** default; enabling the test on the Prepare stick page requires the admin to type a threshold (help text suggests checking the CPU maker's maximum) | Form validation | V1 |

### 9.7 Display (pp.118–120)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 84 | Tests colour reproduction and screen condition; colours chosen so dead pixels stand out (RGB); manual | Same | Full-screen kiosk pages | V1 |
| 85 | Screens in order: red, green, blue, black, white (colour name in slowly flashing letters), then a grid of horizontal/vertical lines | Same order and same grid | CSS full-screen fills + CSS animation for the name | V1 |
| 86 | **Space** next, **Backspace** previous, **Esc** exits early | Same keys | — | V1 |
| 87 | End: notes, Pass / Fail; Skip leaves status | Same dialog | — | V1 |

### 9.8 Keyboard (pp.120–122)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 88 | Tests the keyboard works; manual | Same | Engine reads keys from evdev (kernel input), not from the browser, so keys the browser would swallow are still seen (rule already used in `hwtest.py`) | V1 |
| 89 | Layout from Settings; dropdown US, FI, DE, BE, FR, JP | Same six layouts, default from the screen language setting | Layout maps in kiosk app | V1 |
| 90 | Colours: red not pressed (default), yellow pressed, green released | Same | — | V1 |
| 91 | Key staying yellow = probably stuck | Same hint text | — | V1 |
| 92 | Key staying red with no sign of press = may not work | Same hint text | — | V1 |
| 93 | Full Size / Compact (no number pad) switch | Same | — | V1 |
| 94 | CT: percentage of keys that must be pressed before Pass | Same setting (no default given by Blancco; NexWipe default 0% = no minimum, same as "not set") | `required_keys_pct` | V1 |
| 95 | Windows/Command, AltGr and some Japanese keys stay red even if they work; any key press flashes the picture background white→grey instead | Same behaviour; the flash happens for every evdev key event | — | V1 |
| 96 | Scroll/Caps/Num Lock toggle during test, testing their indicator lights; leave them sensible | Same; engine sets the LEDs via evdev so lights change; reminder text at the end | evdev LED events (confirm in lab) | V1 |
| 97 | Fn toggles, usually no flash; may be needed for Num Lock / number pad; leave sensible | Same | Fn is often handled in firmware and never reaches Linux; same "may not flash" note | V1 |
| 98 | Shortcuts during the test use Alt (Alt+F, Alt+P, Alt+S, Alt+Tab, Alt+Esc); **Alt+Esc ends the test** | Same Alt shortcuts; Alt+Esc ends | Kiosk key handler | V1 |
| 99 | End: notes, Pass / Fail / Skip | Same | — | V1 |

### 9.9 Memory (pp.122–123)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 100 | Checks low and extended RAM; each pattern written, read back, verified; automatic | Same write/read/verify pattern method on all RAM the running Linux can lock. Honest limit: memory used by the running eraser itself cannot be tested from inside Linux; the report states how much was tested (e.g. "15.2 of 16 GB") | Engine locks free RAM (`mlock`) and runs memtester-style patterns (confirm coverage in lab) | V1 |
| 101 | Time depends on memory size and CPU speed | Same; progress bar with time estimate | — | V1 |
| 102 | Successful or Failed | Same | — | V1 |
| 103 | Number of passes changeable in CT 2.12 or newer | Passes setting on the Prepare stick page from day one (CT 2.12 version note: n/a for NexWipe — no older setup tool exists) | `hardware_tests.memory.passes` | V1 |
| 104 | Fast test; for thorough use Memtest86+, memtester (Chromebooks), or up to **99** passes | Same note; max 99 passes. NexWipe may add a separate Memtest86+ boot-menu entry on the stick (decide at step 03 plan; GPL licence check) | — | V1 (memtester on Chromebooks: Later) |

### 9.10 Microphone (p.123)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 105 | Record and play back a **5-second** sample; labelled automatic | Same 5 s record and playback | `arecord -d 5` then `aplay` (or browser audio) | V1 |
| 106 | Amplitude meters for input and output | Same two level bars | RMS level from samples (rule in `hwtest.py`) | V1 |
| 107 | Master volume **70%** default, slider | Same | `amixer set Master 70%` | V1 |
| 108 | Mic sensitivity cannot be adjusted | Same: no sensitivity control | — | V1 |
| 109 | Manual does not say how pass/fail is decided | Blancco gives no rule. NexWipe choice (clearly ours, not Blancco's): after playback the operator presses Pass or Fail; the recorded input level is saved in the report as a measurement | End dialog | V1 |

### 9.11 Motherboard (pp.123–124)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 110 | Checks CMOS checksum where available | Same | Read CMOS bytes via `/dev/nvram` and recompute checksum (confirm per maker in lab; many modern boards don't expose it → part "not available") | V1 |
| 111 | Checks CMOS battery | Same, via the clock rule (row 116) and `/proc/driver/rtc` `batt_status` where shown | — | V1 |
| 112 | Checks RTC | Same: clock readable and ticking | `/dev/rtc0` read twice, seconds advance | V1 |
| 113 | Checks UEFI | Same: booted in UEFI mode and variables readable | `/sys/firmware/efi/efivars` | V1 |
| 114 | Checks DMI | Same: firmware hardware table readable (model, serial) | `dmidecode` | V1 |
| 115 | "If any of the tests are successful, then the result will be Successful. Otherwise Failed." | Same rule exactly, and the report lists each sub-check's own result so a reader sees which parts failed | — | V1 |
| 116 | Clock **behind** reference by > **365 days** → fails with "Internal clock is off, check CMOS battery"; no other parts reported | Same rule and same meaning of message (own wording: "Internal clock is more than a year behind — check the CMOS battery"); no other sub-checks reported | Reference time = web app server time (HTTPS) or NTP | V1 |
| 117 | After time sync with BMP, a cold reboot/shutdown is needed before the CMOS test can run again | Same: after the eraser sets the hardware clock from the web app, the test shows "Cannot be performed — power the laptop fully off and start again" for that session | Engine flag set when `hwclock --systohc` runs | V1 |

### 9.12 Network (p.124)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 118 | Detects network connection, Successful/Failed; automatic | Same | `ip -j addr`, `/sys/class/net/*/carrier` | V1 |
| 119 | One test per Ethernet port | Same | One row per wired interface (skip wireless and virtual) | V1 |
| 120 | CT: extra IPs to ping, space-separated; succeeds if they answer | Same setting, same format | `hardware_tests.network.ping_ips = "10.0.0.1 10.0.0.2"`; `ping -c 3 -I <iface>` | V1 |
| 121 | Auto pass: port has an IP | Same | — | V1 |
| 122 | Auto fail: interface looping in progress | Same; Blancco does not define "looping" — NexWipe treats the link repeatedly going up/down during the test as this case (confirm meaning in lab) | carrier change counter | V1 |
| 123 | Auto fail: interface turned off | Same | operstate down / admin down | V1 |
| 124 | Auto fail: no cable | Same | `carrier = 0` | V1 |
| 125 | Auto fail: no IP found, or none of the configured IPs answer, even with interface on and cable in | Same | — | V1 |
| 126 | "End test" button counts down and ends the test at zero | Same countdown button | — | V1 |

### 9.13 Optical devices (pp.125–126)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 127 | Tests CD/DVD drives: reading, writing, blanking; manual | Same three sub-tests | `xorriso`/`cdrskin` for write and blank, timed read for read (confirm in lab) | V1 |
| 128 | CT: default sub-test set (only write, write+read, only read, write+read+blank …) | Same choice list | `hardware_tests.optical.default_set` | V1 |
| 129 | All optical drives shown with capabilities; offered tests depend on what each drive can do | Same | Drive capability query | V1 |
| 130 | CD-RW/DVD-RW: write, read, then blank at the end | Same | — | V1 |
| 131 | –R disc: must already carry the Blancco pattern; only reading possible; other tests show error pop-ups | Same rule with the **NexWipe test pattern** disc | — | V1 |
| 132 | Drive that cannot write: only reading with a pattern disc | Same | — | V1 |
| 133 | Blancco test CD image download link | NexWipe publishes its own test CD image (known pattern + checksum) for download in the NexWipe Eraser section | Static file + SHA-256 | V1 |
| 134 | Blancco test DVD image download link | Same for a NexWipe test DVD image | Same | V1 |
| 135 | Start-up can take up to a few minutes | Same "This can take a few minutes" spinner | — | V1 |
| 136 | Attempted tests complete and OK → Successful | Same | — | V1 |
| 137 | Complete with errors → Failed | Same | — | V1 |
| 138 | Skipped or could not run (tray open, –R disc for write) → Not performed | Same | — | V1 |

### 9.14 PC speaker (pp.126–127)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 139 | "Play sound" button or **Space** beeps; user confirms hearing it | Same | Load `pcspkr` module; send beep through its input device (EV_SND) (confirm in lab) | V1 |
| 140 | **Esc** ends early | Same | — | V1 |
| 141 | PC speaker ≠ normal speakers; many modern devices have none | Same note; no beeper device found → Cannot be performed | — | V1 |
| 142 | End: notes, Pass or Fail | Same, two buttons only | — | V1 |

### 9.15 Pointing devices / Touchpad (pp.127–129)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 143 | Tests mouse, trackball, touchpad or other pointing device; manual | Same | Kiosk pointer events; engine evdev as backup (rule in `hwtest.py`) | V1 |
| 144 | User clicks right, left, middle buttons and circled areas on right and left of screen | Same targets | — | V1 |
| 145 | Button colours red not pressed, yellow pressed, green released | Same | — | V1 |
| 146 | **Esc** exits early | Same | — | V1 |
| 147 | Two-button touchpads: press both for middle | Same hint | Linux middle-button emulation (confirm per touchpad in lab) | V1 |
| 148 | Screenshots of start and partly done states | Same two states exist in NexWipe's screen design | — | V1 |
| 149 | End: notes, Pass / Fail / Skip | Same | — | V1 |

### 9.16 SIM card presence (pp.129–130)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 150 | Finds the cellular modem and checks for a SIM; manual | Same | ModemManager `mmcli -L`, `mmcli -m <n>` | V1 |
| 151 | Modem in report under `cellular_modems`, detected as PCIe or USB | Same report field name `cellular_modems` with bus type | sysfs device path | V1 |
| 152 | Only modems with Linux drivers; Windows-only modems not supported | Same limit, same note | — | V1 |
| 153 | Empty SIM slot without a modem does nothing; BDE cannot detect a SIM in it | Same note; no modem → Cannot be performed | — | V1 |
| 154 | Test button checks for SIM; MCC/MNC shown; shown on the test icon if found | Same | `mmcli -i <sim>` operator id (MCC+MNC) | V1 |
| 155 | End: notes, Pass / Fail / Skip | Same | — | V1 |

### 9.17 Speaker (pp.130–131)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 156 | "Play sound" or **Space** plays samples; user confirms | Same | `aplay` per channel (or browser audio) | V1 |
| 157 | 3.5 mm headset can be tested too | Same | ALSA routes to jack when plugged | V1 |
| 158 | Order left, right, both; amplitude meter; volume slider | Same order, meter and slider | — | V1 |
| 159 | Not the PC speaker test | Same note | — | V1 |
| 160 | **Esc** ends early | Same | — | V1 |
| 161 | End: notes, Pass / Fail / Skip | Same | — | V1 |

### 9.18 Touchscreen (p.131)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 162 | Red grid squares turn green when touched; manual | Same | Kiosk touch events | V1 |
| 163 | User decides pass/fail by touching/painting | Same Pass/Fail | — | V1 |
| 164 | Not detected/missing → pop-up says so | Same pop-up; result Cannot be performed | No touchscreen in evdev list | V1 |

### 9.19 USB ports (pp.132–133)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 165 | USB storage device (preferably a stick) plugged into each port; manual | Same. Safety: only a dedicated test stick; the NexWipe boot stick (label `NEXWIPE`) is never written | udev block events | V1 |
| 166 | **Detection** (mandatory): stick shown | Same, always on | — | V1 |
| 167 | **Read** (optional): read speed shown | Same | Timed direct read of a fixed amount | V1 |
| 168 | **Write** (optional): write speed shown | Same. Writes one temporary file on the test stick's own file system and deletes it — never raw writes to the stick | Timed write with `O_DIRECT`/fsync | V1 |
| 169 | Port type from connection speed (USB 2.0 stick in 3.0 port reports 2.0); use newest-standard stick | Same rule and same advice | `/sys/bus/usb/devices/*/speed` (480 = USB 2.0, 5000 = 3.x Gen 1, 10000 = Gen 2 …) | V1 |
| 170 | Every port with a stick is tested; **Esc** when done opens the dialog | Same | — | V1 |
| 171 | End: notes, Pass / Fail / Skip | Same | — | V1 |
| 172 | Repeated write tests can wear out a stick (esp. without wear levelling) | Same warning in help text | — | V1 |

### 9.20 Webcam (pp.133–134)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 173 | Takes a snapshot and shows it; manual | Same | Kiosk camera access (kiosk pre-grants permission, so no pop-up) or V4L2 frame from engine | V1 |
| 174 | A few snapshots (**Space**); **Esc** exits | Same keys | — | V1 |
| 175 | End: notes, Pass or Fail; Skip leaves status | Same | Snapshots are **not** stored in the report (privacy) — only the result | V1 |

### 9.21 Wi-Fi adapters (pp.134–136)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 176 | Tests every detected Wi-Fi adapter; automatic | Same | `iw dev` | V1 |
| 177 | Runs in background, no user action; Wi-Fi need not be configured first; can test an adapter already connected to BMP | Same, including an adapter currently connected to the web app | — | V1 |
| 178 | Checks software lock and unlocks it; hardware lock (switch) → fails with error; also for USB Wi-Fi | Same | `rfkill list`: "Soft blocked" → `rfkill unblock wifi`; "Hard blocked" → Failed "Wi-Fi is switched off by a hardware switch" | V1 |
| 179 | Some makers need extra firmware; test may fail though hardware is fine; BDE can't detect this | Same note. NexWipe reduces it by shipping the full `linux-firmware` package on the stick | Image build (step 03 plan) | V1 |
| 180 | Scans in listening mode, no passwords, no connecting or traffic; needs one dummy access point broadcasting any SSID | Same: passive scan, no connection; same lab advice | `iw dev <if> scan passive` (confirm in lab) | V1 |
| 181 | Cannot tell 2.4 GHz from 5 GHz; test AP must use a supported band; all hardware supports 2.4 GHz | Same: result does not claim a band; help text says use a 2.4 GHz test AP. (Linux does report frequency; NexWipe still makes no band claim, to match the same behaviour) | — | V1 |
| 182 | No networks found → user passes or fails | Same | Dialog | V1 |
| 183 | SSID configured → auto pass if reachable **and** IP obtained; otherwise fails | Same; SSID (and optional password) set on the Prepare stick page | `iwd`/`wpa_supplicant` + DHCP client | V1 |
| 184 | Results per adapter in report section "Wi-Fi Adapter"; fail reason in comment | Same section and comment | Report builder | V1 |
| 185 | **Scan networks** rescans; else ends when **End test** countdown runs out | Same buttons and countdown | — | V1 |

---

## 4. Keyboard shortcuts in this step

| # | Shortcut | Where | Action (same) | Phase |
|---|---|---|---|---|
| 186 | Ctrl+T | Hardware tests step | Run selected tests | V1 |
| 187 | Esc | BIOS logo, Display, PC speaker, Pointing devices, Speaker, USB ports, Webcam | End or exit the test | V1 |
| 188 | S / F / P | BIOS logo | Skip / Fail / Pass | V1 |
| 189 | Ctrl+M | CPU Stress | °C ↔ °F | V1 |
| 190 | Space / Backspace | Display | Next / previous screen | V1 |
| 191 | Alt+F, Alt+P, Alt+S, Alt+Tab, Alt+Esc | Keyboard | Shortcuts during the test; Alt+Esc ends it | V1 |
| 192 | Space | PC speaker, Speaker | Play sound | V1 |
| 193 | Space | Webcam | Take a snapshot | V1 |

All shortcuts live in one key map in the kiosk app; the engine forwards evdev keys so they work even when the page has no focus.

## 5. Points of interest for NexWipe

| # | Research observation | NexWipe plan | Phase |
|---|---|---|---|
| 194 | Many tests are operator judgement; only battery, CPU, memory, motherboard, network and Wi-Fi with SSID are measured | Same split. The report marks each result "Measured" or "Operator judgement" and records who pressed the button (technician name from the stick session), so a buyer knows which is which | V1 |
| 195 | All thresholds set centrally by the admin, not the technician (60%; 50 p.p./10 min; 3 min; up to 99 passes; 365 days) | Same: thresholds only editable on the Prepare stick page by owner/admin (AAL2 session); the laptop screen shows them read-only | V1 |
| 196 | Safety rules protect licence and report from power-off: no discharge test below 50% (20% Chromebooks), hard stop at 10% | Same rules (rows 58–60); wipe credits play the licence role (no charge in V1; payment Later) | V1 (Chromebook: Later) |

## Build order and checks
1. Port the existing rules from `hwtest.py` (keyboard, display, webcam, mic, speakers, touchpad, battery, Wi-Fi) into the
   engine + kiosk pages. 2. Add the remaining tests (discharge, BIOS logo, Bluetooth, CPU basic/stress, memory,
   motherboard, network, optical, PC speaker, SIM, touchscreen, USB ports). 3. Prepare stick page settings. 4. Report
   section + `eraser_hardware_test_results` table (migration with undo file, through Lovable; step 18 plan).
- One small `test_*.py`/engine unit test per measured rule: battery capacity/voltage, the three discharge cases,
  the 365-day clock rule, the "any sub-check successful" motherboard rule, network pass/fail cases.
- Done when all 21 tests run on the lab laptops (Windows laptops of several makers) and results appear in the report.
