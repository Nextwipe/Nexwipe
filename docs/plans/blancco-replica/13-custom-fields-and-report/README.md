# Plan — Step 13 — The report (proof of erasure)

Mirrors: research [13-custom-fields-and-report/README.md](../../../research/blancco-drive-eraser/13-custom-fields-and-report/README.md)

## In short
Same as Blancco: before erasure the report is a hardware (asset) report; after erasure it becomes the erasure report, the
proof the erasure started and finished. NexWipe Eraser signs it digitally, saves it as XML or XML+PDF to a USB stick and/or
sends it to the NexWipe web app, backs it up automatically, and can write an optional fingerprint or bootable report onto
the wiped drive. A signature proves the report wasn't changed — not that the wipe was correct (that is steps 10, 11, 17).
Custom fields and per-drive reports: [custom-fields-and-per-device-reports.md](custom-fields-and-per-device-reports.md).

## 13.1 Report step (§4.5, p.51–53)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Fourth and final default step; viewable before, during and after erasure | Same: "Report" is the 4th tab on the laptop screen, always viewable | Kiosk screen renders the live report from the engine | V1 |
| Tab colour: grey not started, blue ongoing, green successful, red failed | Same four colours | Screen | V1 |
| Can be saved, sent, or both | Same: Save (USB), Send (web app), or both | Buttons | V1 |
| States: viewable not backed up / being saved / being sent / saved / sent / save failed / send failed | Same 7 states shown under the tab label | Report state machine in the engine | V1 |
| Standard vs **Advanced** report (Advanced adds SMART info) | Same two views | Screen | V1 |
| Toggle with button or Ctrl+M | Same button, same Ctrl+M | Screen keyboard handler | V1 |
| Advanced can be default in CT | Same option on the Stick setup page | `nexwipe-setup.json` | V1 |
| The view chosen determines which type is saved as PDF | Same | PDF renderer uses the current view | V1 |

## 13.2 Contents (§4.5.2.1, p.53–54)

| Blancco report part | NexWipe report (same) | Phase |
|---|---|---|
| Licensee / Customer / Operator information | Company (licensee), customer, technician (operator) | V1 |
| Hardware information (asset report of the host machine; step 5) | Same hardware report (plan step 5) | V1 |
| Custom fields | Same ([custom-fields-and-per-device-reports.md](custom-fields-and-per-device-reports.md)) | V1 |
| Erasure result information per drive | Same, per drive: identity, standard, every step with start/end/result, firmware command that succeeded, errors, hidden areas, verification % and result, **level reached**, final status, exceptions (plan steps 9–11) | V1 |
| Hardware test results | Same (plan step 12) | V1 |
| Report information (about the report file itself) | Same: report ID (UUID), NexWipe Eraser version, created time and time source, signature details | V1 |
| IPMI MAC/IP (XML only) | Same field, XML only | Later (servers) |
| Blog: "what asset was erased, the erasure method used, what type of data was erased, and the level of erasure" | Same four facts on page 1 of the PDF | V1 |
| Support docs: drive serial number, erasure status, unique report ID, digital signature | Same four items on every report | V1 |
| Extra XML fields: TCG/Shadow MBR/Block SID fields | Same (plan step 7) | V1 |
| Extra XML fields: fingerprint sector and status | Same (13.7) | V1 |
| Extra XML fields: NBP/RPMB status | Same (NVMe boot partitions / replay-protected memory block status; plan steps 5 and 16) | V1 |
| Extra XML fields: persistent software | Same (persistent firmware software such as Computrace; plan step 7 §7.9) | V1 |
| Extra XML fields: TPM | Same (`tpm2-tools`; plan step 7) | V1 |
| Extra XML fields: drive life estimate, health percentage | Same (`smartctl`, `nvme smart-log`) | V1 |

## 13.3 Saving to USB (§4.5.2.2, p.54–55)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Plug a stick, Save (Ctrl+S), choose drive, file name, format | Same flow, same Ctrl+S | Screen dialog; engine mounts the chosen stick (never a drive being erased) | V1 |
| Default name `Date(yyyymmdd)_Time(hh24miss)_report`, e.g. `20210527_115442_report`; editable; max 255 characters | Same default pattern, editable, max 255 | Dialog validation | V1 |
| Formats: **XML** (importable to BMP) or **XML + PDF** | Same two choices; XML importable into the NexWipe web app | XML from the signed report; PDF rendered by Chromium print | V1 |
| Failure causes: not enough space, device disconnected, same file name exists, invalid characters, faulty device | Same five failure messages | Engine save routine | V1 |
| Stick should be FAT32, single partition, non-empty name (a-zA-Z0-9 preferred), in good condition | Same advice shown in the dialog; NexWipe also saves to the NEXWIPE stick itself if no other stick is plugged in | Help text | V1 |

## 13.4 Sending to BMP (§4.5.2.3, p.56)
BMP → the NexWipe web app.

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Send (Ctrl+N) | Same, Ctrl+N | Eraser posts the signed report to the agent API (`src/server/agent-api/`, route `/api/public/agent/v1/…`) using the stick's key | V1 |
| "Only one report per BDE session is kept in BMP" — the latest replaces earlier ones | Same: one current report per eraser session; earlier versions kept as history (append-only) but only the latest shown as current | SQL RPC; reports table append-only | V1 |
| Missing BMP settings → error popup showing one missing parameter at a time | Same: popup naming the first missing setting (e.g. "Web app address missing") | Screen | V1 |
| Wrong/missing credentials → prompt | Same: prompt to re-link the stick (sign-in code) | Stick enrolment flow | V1 |

## 13.5 Automatic report backup (§7.4, p.81–82)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Manual process only (other processes already send automatically); CT option | Same: option on the Stick setup page, applies to Manual mode | `nexwipe-setup.json` | V1 |
| Sent to BMP when each drive's erasure finishes, fails or is cancelled | Same: sent to the web app at each of those moments | Engine event | V1 |
| If BMP unreachable → saved to **all** connected USB sticks; saved when a stick is later connected | Same; also always written to the NEXWIPE stick's state partition | Engine watches for new sticks (`udev`) | V1 |
| Not an official report yet: no session ID until custom fields are done and the report is sent/saved | Same: backup marked "backup — not final" until then | Report flag | V1 |
| File named by report UUID, e.g. `<uuid>_report.xml` | Same naming | Engine | V1 |
| Each USB save writes all reports in memory; a new stick gets old ones too | Same | Engine | V1 |
| **Reports disappear if the machine is shut down or restarted** | Same for RAM; but NexWipe's copy on the NEXWIPE stick's state partition survives, so a report is not lost if the stick stays plugged in | State partition write after each drive | V1 |
| When BMP comes back, all saved reports are sent | Same | Retry queue | V1 |
| If BMP is changed, only unsent reports go to the new BMP; reports are sent once unless updated | Same | "sent to" record per report | V1 |
| Mandatory custom fields validation skipped in backups | Same | Engine | V1 |
| Always XML, even if PDF+XML configured | Same | Engine | V1 |
| Re-running an erasure updates and replaces the report; one report per entity | Same (old versions kept as history in the web app) | Report UUID reused | V1 |
| Updated after custom-field changes | Same | Engine | V1 |
| With "Report per Connected Device" → one report per drive; otherwise one per session | Same | Plan [custom-fields-and-per-device-reports.md](custom-fields-and-per-device-reports.md) Part B | V1 |
| UI messages like "Backup to BMP/USB completed"; Report tab colour doesn't change for backups | Same: "Backup to web app/USB completed"; tab colour unchanged | Screen toast | V1 |
| "A report has to always be backed up before the machine shuts down or restarts!" (§7.2) | Same rule, enforced: automatic shutdown/restart is blocked until the report is saved or sent; a manual shutdown asks for confirmation | Plan step 14 | V1 |

## 13.6 Digital signature (manual §1; blog; Common Criteria)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Signature = a hash of the report content, unique per report; "changes completely if any change is made" | Same: SHA-256 hash of the canonical report, signed | Ed25519 signature over canonical JSON (our choice); XML/PDF carry the same signature and report ID | V1 |
| Default: signed with "a private key unique to the Blancco product", public key "stored in the Blancco Management Console" | Same idea: each stick gets its own private key at enrolment (kept in the stick's encrypted state area); the public key is stored in the web app. On arrival the web app checks it and **adds its own server signature** | Stick enrolment RPC; `report_signatures` table | V1 |
| Custom: own RSA key pair; BDE 6.12+ and CT 2.12+ | Same option: company uploads its own public key on the Stick setup page and the stick signs with the matching private key (RSA or Ed25519) | Stick setup page | V1 |
| Releases < 4.8.0 incompatible due to updated signature | n/a for NexWipe — Blancco version history; NexWipe stores a signature-format version in every report so future changes stay verifiable | Report field | V1 |
| BMP / Blancco Blue verifies: a single changed comma is detected | Same: public "Check a report" page in the web app (upload file or enter report ID → valid / changed / unknown) | Public route, server function | V1 |
| Tampered reports remain viewable with a notification — detection, not prevention | Same: a changed report still opens, with a red "This report was changed after signing" banner | Report page | V1 |
| Common Criteria: reports "protected from tampering"; ANSSI target mentions a verification tool; BMC not mandatory for erasure | Same: offline verification tool (command-line + the public page); web app not needed to erase | Small verify CLI in the eraser repo | V1 |
| Not stated publicly: hash algorithm, key sizes, key protection | NexWipe states them publicly (SHA-256, Ed25519/RSA key size, where keys live) | Docs | V1 |
| **The signature proves the report wasn't changed after signing; it does not by itself prove the wipe was correct.** | Same honest statement on the report and Check page | Text | V1 |

Database: reports, per-drive results, signatures and stick public keys need tables with `org_id`, composite FKs,
append-only for app users, RLS per company → **migration needed** (with undo file, rehearsed locally, applied by the owner
in Lovable).

## 13.7 Digital Fingerprint (§7.20, p.92–93)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Small summary written on the erased drive, "further proof", usable for auditing | Same | Engine writes one sector after successful verification | V1 |
| **Off by default** (CT Report > Fingerprint settings) | Same default Off, same place (Stick setup → Report → Fingerprint) | `nexwipe-setup.json` | V1 |
| One sector, default **sector 67000**, configurable; if beyond capacity, last sector | Same | Engine | V1 |
| English/ASCII only | Same | Engine | V1 |
| Fields (spaces/semicolons): customer name ("Licensed to", non-ASCII as "?") | Same | Engine | V1 |
| Completion date/time `yyyy-mm-dd hh:mm:ss` | Same | Engine | V1 |
| Software version | Same (NexWipe Eraser version) | Engine | V1 |
| Drive serial | Same | Engine | V1 |
| Status "Successful"/"Failed"/"Cancelled" | Same three values | Engine | V1 |
| Report UUID (`Asset:<uuid>`; `Per-drive:<uuid>`) | Same two forms | Engine | V1 |
| Sector and status in XML | Same | Report | V1 |
| Disabled by "Format drives after erasure" | Same | Plan step 8 | V1 |

## 13.8 Bootable Asset Report (§7.21, p.93)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Splash screen shown when booting a successfully erased drive; basic computer info. **Off by default** | Same, default Off; shows "Erased with NexWipe, <date>, report <id>" + basic hardware info | Tiny boot image written by the engine | V1 |
| Conditions: enabled in CT, drive erased successfully at least once, report saved to USB or sent to BMP at least once | Same three conditions | Engine checks before writing | V1 |
| Writes the first **200 sectors (BIOS)** or **67000 sectors (UEFI)** — different pattern, not leftover data | Same sizes; hex viewer labels them (plan step 10 §10.7) | Engine | V1 |
| "Does not replace the Blancco erasure report which is the real proof" | Same statement on the splash: "This is not the erasure report" | Text | V1 |
| Uses: fast visual proof, auditing, showing hardware info to second-hand buyers | Same uses listed in help | Help text | V1 |
| Usually overwritten by an OS install | Same note | Help text | V1 |

## 13.9 Report Issue and crash reports

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Crash reporter (§7.3): on freeze/crash, a crash report with system info and logs is copied to all connected USB sticks (or later when one is connected) | Same; also sent to the web app when online | Watchdog service on the eraser; logs bundled with `journalctl` | V1 |
| Report Issue button (step 4) creates an issue report for support | Same button (plan step 4), goes to NexWipe support | Screen + web app | V1 |
