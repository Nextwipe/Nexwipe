# Plan — Step 7 — Removing locks and hidden areas before the wipe

Mirrors: research [07-removing-locks/README.md](../../../research/blancco-drive-eraser/07-removing-locks/README.md)

## In short
NexWipe Eraser removes the same locks Blancco removes, the same way: the BIOS **freeze lock** with a short sleep-wake
(`rtcwake`), **HPA/DCO** hidden areas with `hdparm`, locked self-encrypting drives with a **PSID Revert** (`sedutil-cli`),
**Block SID** and **TPM clear** by asking the BIOS through the TPM's Physical Presence Interface, and it detects and
reports the **Shadow MBR**. Drive passwords stay a BIOS job, as with Blancco. Anything that could not be unlocked is
reported honestly and the result is never better than what was actually reached.
All destructive tests in this step run only on DISPOSABLE lab drives ([test lab](../before-we-start/test-lab.md)).

## 7.1 Freeze lock (§7.14, p.88–89; §7.1; KB "Freeze Lock Removal")

"Freeze lock" = the BIOS tells SATA drives at start-up "refuse security commands until next power-off".

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | What: BIOS sets ATA drives "security frozen"; then hidden-area removal and firmware erase commands are impossible | Same detection and same consequence | `hdparm -I` → "frozen" in Security section | V1 |
| 2 | Standards/options that need FLR (freeze lock removal): Blancco SSD Erasure, NIST 800-88 Purge, Cryptographic Erasure, BSI-GS/E, BSI-2011-VS, and "Erase Remapped Sectors" on a drive with remapped sectors | Same list, with "NexWipe SSD method" in place of Blancco SSD Erasure | `needs_unfrozen: true` flag per standard/option (step 9) | V1 |
| 3 | How: machine put to sleep, locks removed, machine woken | Same | `rtcwake -m mem -s 5` (suspend-to-RAM, wake after ~5 s; confirm timing in lab) then re-check `hdparm -I` | V1 |
| 4 | Screen black a few seconds | Same; screen first shows "The screen will go black for a few seconds — do not touch" | Kiosk message before suspend | V1 |
| 5 | All locked drives at once | Same | One suspend for all frozen drives | V1 |
| 6 | At most once per session | Same: once per boot | Engine flag in RAM | V1 |
| 7 | When: during boot (default boot option "FLR during startup") | Same default boot menu entry "Unlock drives during start-up" | Runs before the kiosk graphics start (step 3) | V1 |
| 8 | Or right after pressing Erase (other boot options) | Same | Engine runs FLR at Erase if still needed | V1 |
| 9 | Timing also depends on Manual / Semi-automatic / Automatic process (KB) | Same three process modes (step 6) decide the moment | Process-mode setting | V1 |
| 10 | Failure mode 1: black screen while erasure continues in background | Same detection: engine keeps working; heartbeat file + laptop LED/beep if possible | Engine is independent of the screen | V1 |
| 11 | Failure mode 2: black screen, machine on, nothing running | Same; report records "freeze lock removal: session lost", erasure **Not erased** | Progress file on stick read at next boot | V1 |
| 12 | Failure mode 3: black screen and unresponsive — FLR paused or failed | Same handling as #11 | — | V1 |
| 13 | Remedy: press a key or hold power ~1 s | Same advice on screen and in help page | Help text | V1 |
| 14 | Remedy: dock/undock or cable manipulation | Same advice | Help text | V1 |
| 15 | Remedy: enable S3 in BIOS ("ACPI Standby State" → S3) | Same advice; engine checks `/sys/power/mem_sleep` shows `deep` and warns if only `s2idle` (modern standby may not cut drive power — confirm in lab) | Pre-check | V1 |
| 16 | Remedy: BIOS up/downgrade (examples in step 2) | Same advice, linked to NexWipe per-model notes (step 2) | Model notes in web app | V1 |
| 17 | Remedy: move the drive to another motherboard | Same advice | Help text | V1 |
| 18 | Last resort: disconnect drive signal then power cable while running — "not recommended … drive may result damaged" | **Not recommended by NexWipe either**; shown only as a described option with a damage warning, never as a prompt | Help text | V1 |
| 19 | Machines with no black screen that still fail firmware commands (e.g. Surface Pro 3) cannot use FLR | Same: engine marks the model "FLR not possible" after a failed re-check; per-model list in web app | Model list table | V1 |
| 20 | Forced FLR configurable in CT if auto-detection misses a lock | Same setting "Always run freeze lock removal" on Prepare stick page | `nexwipe-setup.json` | V1 |
| 21 | Avoid FLR entirely: boot with any option except "FLR during startup", choose a standard without firmware commands, disable remapped-sector erase, disable hidden-area removal, disable SSD-method enforcement | Same five conditions; the screen shows "No sleep-wake needed" when all are met | Engine rule | V1 |
| 22 | KB: FLR can be skipped when policy only needs NIST Clear | Same guidance | Help text | V1 |
| 23 | KB: …or when the drive is a healthy HDD without remapped sectors or hidden areas | Same guidance | Help text | V1 |
| 24 | KB: …or when data isn't sensitive | Same guidance | Help text | V1 |
| 25 | If a freeze lock can't be removed, Blancco's SSD erasure method fails (§16.1) | Same: NexWipe SSD method fails, report reason "drive still frozen" (or fallback to Clear only if enabled, step 8 §8.6) | Engine rule | V1 |

## 7.2 Hidden areas — HPA, DCO, AMA (§7.9, p.84–85)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Hidden areas in ATA drives (HDD, SSD) not visible via OS or BIOS | Same detection | Compare current vs native max (step 5) | V1 |
| 2 | **HPA (Host Protected Area)** — often holds OS recovery part, can contain sensitive data | Detect and remove | Detect `hdparm -N`; remove `hdparm -N p<native_max>` (`p` = permanent) | V1 |
| 3 | **DCO (Device Configuration Overlay)** — reduces visible size; risk unless detected, extended and erased | Detect, restore, then erase full size | `hdparm --dco-identify`, `hdparm --dco-restore` (needs drive not frozen) | V1 |
| 4 | ACS-3 **Max Address Configuration** (AMA) areas detected and removed (shown as HPA) | Same, shown as HPA | Newer drives answer `hdparm -N` via the AMA command set (confirm in lab) | V1 |
| 5 | Setting "Remove hidden areas" (or preset in CT) | Same setting on laptop screen, preset on Prepare stick page | `nexwipe-setup.json` | V1 |
| 6 | If on: extra removal step added only if drive has one **and** the standard has no removal step | Same rule | Engine plan builder | V1 |
| 7 | Extra step is **optional**: failure doesn't fail the erasure | Same; report lists it as an exception "hidden area could not be removed — data may remain" | Report | V1 |
| 8 | Mandatory removal in NIST 800-88 Clear/Purge/NIST 800-88, IEEE 2883, NIST r2, BSI-GS/GSE (step 9) | Same list; failure there fails the erasure | `hidden_area_removal: mandatory` in standards table | V1 |
| 9 | Warning: drives with HPA/DCO not removed should not be erased with NIST Clear, NIST Purge-ATA, BSI-GS/E, (Extended) Firmware based erasure, Blancco SSD Erasure, or any standard with "Erase remapped sectors" — these could end up erasing such areas | Same warning, same list (NexWipe SSD method in place of Blancco SSD Erasure) | Warning dialog before Erase | V1 |
| 10 | Removal "is not reliable" through an adapter (e.g. external USB enclosure); connect directly | Same; NexWipe refuses hidden-area removal on USB-attached drives and says "connect directly" | Transport check | V1 |
| 11 | Erasing remapped sectors can also erase hidden areas (§7.8) | Same note in report/help | Help text | V1 |

## 7.3 ATA drive passwords (§8.6, §16.2.2, §4.2.3.6)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Password must be entered before boot; then only overwriting is possible | Same | Detect `hdparm -I` locked/enabled; offer overwrite only | V1 |
| 2 | For Purge, remove the password in BIOS/UEFI | Same instruction on screen | Help text | V1 |
| 3 | ATA Master Password on an SSD blocks firmware erase and writes; if it can't be removed, drive can't be erased | Same; report "cannot erase — master password" | Report reason | V1 |

## 7.4 Self-encrypting drives — TCG (§7.25, p.95–98)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | TCG SSC specs: **Enterprise** (data centre) | Detect and report | `sedutil-cli --query` Level 0 discovery | V1 detect, Later erase |
| 2 | **Opal** (client devices) | Detect, report, erase | Same | V1 |
| 3 | Opalite, Pyrite, Ruby | Detect and report | Same | V1 |
| 4 | Matrix — Opal: CE (crypto erase) reporting & erasure on ATA, SCSI/SAS, NVMe; BE (block erase), OW (overwrite command) N/A | Same | `sedutil-cli` revert/GenKey (confirm exact command in lab) | V1 (SCSI/SAS Later) |
| 5 | Enterprise: CE reporting & erasure on ATA and SCSI/SAS; NVMe CE N/A | Same | Enterprise SSC commands (tool to confirm in lab) | Later (data centre) |
| 6 | Opalite: CE reporting & erasure on all three | Same | Same as Opal path | Later (after lab proof) |
| 7 | Pyrite: CE reporting & erasure; BE, OW reporting | Same | Same | Later (after lab proof) |
| 8 | Manual inconsistency: icon text says Opalite/Pyrite/Ruby CE "not supported yet"; table says supported | NexWipe follows the cautious reading: V1 only claims CE on Opal; others reported but not used for CE until lab-proved | Engine capability table | V1 |
| 9 | TCG commands used in "NIST 800-88 Purge" and "TCG Cryptographic Erasure" | Same two standards | Standards table | V1 |
| 10 | TCG Crypto Erase first reverts the drive to factory default, then replaces the key and scrambles data | Same order | `sedutil-cli` revert then key change (confirm in lab) | V1 |
| 11 | **PSID Revert** for drives "TCG locked" or "TCG password" | Same | `sedutil-cli --PSIDrevert <PSID> <drive>` | V1 |
| 12 | PSID = 32-character password, usually on drive sticker | Same explanation on screen | — | V1 |
| 13 | Click lock icon or Ctrl+J → "Enter PSID" → OK | Same, Ctrl+J; input checks 32 characters | Kiosk dialog | V1 |
| 14 | Green "PSID" label after entry | Same | — | V1 |
| 15 | On erasure, PSID revert step runs **before** all others | Same order | Engine plan builder | V1 |
| 16 | Resets to factory settings, removes locks/passwords, destroys data | Same; confirmation text says data is destroyed | — | V1 |
| 17 | Shown in the report | Same: "PSID revert performed: yes/failed". The PSID itself is **never stored** in the report or sent to the web app | RAM only | V1 |
| 18 | Authorisation failure → error popup | Same | `sedutil-cli` exit code | V1 |
| 19 | Also via workflow | Same workflow step "PSID revert" (PSID typed on the laptop) | Workflow engine | V1 |
| 20 | KB (as of 6.18.0): SEDs (ATA, SCSI/SAS, NVMe) erasable by overwriting or Sanitize Crypto Erase | Same capability (Blancco version number n/a for NexWipe) | `hdparm --sanitize-crypto-scramble`, `nvme sanitize --sanact=4` | V1 (SCSI/SAS Later) |
| 21 | TCG/Opal locked drives by overwriting or TCG Crypto Erase | Same | After unlock/revert | V1 |
| 22 | Locked drives via PSID Revert | Same | #11 | V1 |

## 7.5 Block SID Authentication (§7.29, p.99–100)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | TCG feature that blocks authenticating the SID authority (stops takeover of a drive whose SID is still default MSID); disabling it allows firmware erase needed for purge | Same explanation; detection | Level 0 discovery Block SID feature (confirm in lab) | V1 |
| 2 | Yellow "SID Blocked" mark | Same mark with text | — | V1 |
| 3 | If machine supports **PPI** (Physical Presence Interface = a way to ask the BIOS to do something at next boot), clicking opens disable dialog (only if no erasure running) | Same | `/sys/class/tpm/tpm0/ppi/tcg_operations` lists supported requests | V1 |
| 4 | Otherwise "Cannot be disabled" | Same | — | V1 |
| 5 | Hotkey Ctrl+Alt+S on Erase view | Same | Kiosk | V1 |
| 6 | Dialog can also be shown right after boot via CT (default button and timeout configurable) | Same settings on Prepare stick page | `nexwipe-setup.json` | V1 |
| 7 | Not shown if erasure managed by BMP | Same: not shown when the job is managed from the NexWipe web app | Engine mode | V1 |
| 8 | In Workflow/Auto/Semi-auto, process doesn't start until dialog closed with "No, skip" | Same | Engine waits | V1 |
| 9 | "Yes, proceed" → PPI request to BIOS → reboot → operator accepts on PPI screen | Same | Write request to `/sys/class/tpm/tpm0/ppi/request` (operation number for disabling Block SID from TCG PPI 1.3 spec — confirm in lab), then reboot | V1 |
| 10 | After success, on shutdown/restart (Shutdown or F10) suggests re-enabling Block SID | Same, Shutdown and F10 | PPI enable request | V1 |
| 11 | XML fields `…disks.disk.tcg_block_sid_authentication_supported` and `…_enabled` | Same two fields in NexWipe JSON (`disks[].tcg_block_sid_authentication_supported` / `_enabled`) | Report | V1 |

## 7.6 Shadow MBR (§7.9.1, p.85)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Special TCG area ≥128 MB with pre-boot unlock screen | Same detection | Level 0 discovery Locking feature | V1 |
| 2 | Can't be removed by overwriting or firmware erase; needs PSID Revert or admin password | Same rule; if neither, report "Shadow MBR area may contain data" | Report exception | V1 |
| 3 | State Disabled (no risk) | Same | — | V1 |
| 4 | Enabled and active (drive shows only Shadow MBR until password) | Same | — | V1 |
| 5 | Enabled and inactive (user area erasable, Shadow MBR untouched; becomes active at next boot, may show previous owner's name/logo) | Same warning | — | V1 |
| 6 | Inactive and not enabled but still accessible → icon still shown | Same | — | V1 |
| 7 | XML check: `tcg_locking == enabled` and `tcg_shadow_mbr_supported == true` | Same rule in NexWipe JSON | Report | V1 |
| 8 | From BDE 7.1.0: icon + fields `tcg_shadow_mbr_supported`, `_enabled`, `_active`, usable in workflows | Same icon and three fields, usable in workflows, from NexWipe Eraser's first version (Blancco version n/a) | Workflow variables | V1 |

## 7.7 TPM (§7.26–7.27, p.98)

TPM = small security chip on the motherboard that stores keys (e.g. for BitLocker).

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | TPM detected and reported if present and enabled in BIOS | Same | `/sys/class/tpm`, `tpm2_getcap` | V1 |
| 2 | Workflow variable `tpm_devices` | Same | Workflow engine | V1 |
| 3 | "Clear TPM" (CT Security settings) clears during startup | Same setting on Prepare stick page | PPI Clear request (operation number to confirm in lab) + reboot | V1 |
| 4 | Popup asks whether to clear, may need reboot | Same meaning, own wording | Kiosk dialog | V1 |
| 5 | Timeout 0 → clears or skips automatically | Same | Setting | V1 |
| 6 | Warning: data cannot be recovered; may reboot | Same warning | — | V1 |

## 7.8 Software encryption (BitLocker etc.)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Erases these drives without a problem since it overrides the original OS | Same: NexWipe boots its own Linux, so BitLocker/software encryption doesn't block erasure; the drive is erased as raw sectors | Normal erasure path | V1 |

## 7.9 Persistent firmware software — Computrace (§7.15, p.89)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Software in BIOS/UEFI that survives sanitisation | Same explanation | — | V1 |
| 2 | Detectable via CT (Security → Security options → Device enrollment detection → Persistent software) | Same setting on Prepare stick page | `nexwipe-setup.json` | V1 |
| 3 | Report field "Persistent Software" | Same field | Report | V1 |
| 4 | Computrace (Absolute Software) is the most common | Same focus | ACPI WPBT table + firmware vendor strings (confirm in lab) | V1 |
| 5 | BIOS "Active"/"Enabled" doesn't prove it works — only installing Windows and checking for the process does | Same caveat printed in report | Report text | V1 |
| 6 | Detects and reports; doesn't claim to remove | Same: never claims removal | — | V1 |

## 7.10 RAID and controller modes (§7.22, §8.4)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | RAID dismantling (CT, off by default) | Same setting, off by default | Vendor CLIs (confirm per controller in lab) | Later (servers) |
| 2 | Adaptec/IBM ServeRAID | Same support target | `arcconf` (confirm) | Later |
| 3 | DAC960/AcceleRAID/eXtremeRAID | Same | Confirm tool in lab | Later |
| 4 | LSI MegaRAID/Dell PERC/Intel RAID | Same | `storcli`/`perccli` (confirm) | Later |
| 5 | HP Smart Array | Same | `ssacli` (confirm) | Later |
| 6 | Dell BOSS (e.g. BOSS-S1) | Same | Confirm tool | Later |
| 7 | Dell PERC H965i | Same | `perccli` (confirm) | Later |
| 8 | LSI 9305-16i/24i | Same | `storcli`/`sas3ircu` (confirm) | Later |
| 9 | HPE SR932i-p Tri-Mode | Same | `ssacli` (confirm) | Later |
| 10 | HPE NS204i (NVMe erased separately; firmware erase if image removes the logical disk) | Same | Confirm in lab | Later |
| 11 | Otherwise dismantle manually in RAID BIOS or set JBOD; update RAID firmware | Same advice | Help text | Later |
| 12 | MegaRAID depends on OEM firmware: LSI (SAS and SATA) | Same | — | Later |
| 13 | Dell (SAS and SATA; SATA plain overwrite only) | Same | — | Later |
| 14 | HP/Intel case by case | Same | — | Later |
| 15 | Multi-mode controllers: suggests switching mode (esp. for NIST Purge); CT Security > Storage controller options | Same suggestion and setting. Laptop case in V1: Intel RST/"RAID On" SATA mode hides NVMe drives from Linux — NexWipe detects it and tells the operator to set AHCI in BIOS (step 2) | PCI ID of Intel RST/VMD controller; settings for others Later | V1 (laptop RST advice), Later (controller switching) |
| 16 | Warning: irreversible data loss, may prevent recovery, may reboot | Same warning | Dialog | Later |
