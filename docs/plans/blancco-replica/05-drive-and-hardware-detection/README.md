# Plan — Step 5 — Detecting drives and hardware

Mirrors: research [05-drive-and-hardware-detection/README.md](../../../research/blancco-drive-eraser/05-drive-and-hardware-detection/README.md)

## In short
After the NexWipe Eraser boots on the laptop, its engine (Rust or Go program, runs in RAM) scans every drive it can reach
and shows the same list Blancco shows: vendor, model, type, size, serial, bay position, plus one icon for every thing that
could hide data or block a full wipe. It also builds a hardware (asset) report of the whole machine. Every field records
**where it came from** (which Linux tool) and says "unknown — reason" when it could not be read; we never guess.
The list is shown on the laptop screen (local web app in full-screen Chromium talking to the engine on 127.0.0.1).

Words used below: **sysfs** = the folder tree (`/sys`) where Linux describes every device; **SMART** = the drive's own
health counters; **NVMe** = the fast SSD type that plugs into an M.2 slot; **TCG** = the standard used by
self-encrypting drives.

## 5.1 Which drives (§1, p.14; §8.7)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Detects SATA drives | Same | Linux kernel `ahci`/`libata`; list from `/sys/block` + udev; details `hdparm -I`, `smartctl -i` | V1 |
| 2 | Detects SCSI/SAS drives | Same | `sg3_utils` (`sg_inq`, `sg_readcap`), `smartctl -i` | Later (servers) |
| 3 | Detects Fibre Channel drives | Same | Kernel FC drivers in the image; same `sg3_utils` path | Later (servers) |
| 4 | Detects USB drives | Same | `usb-storage`/`uas` drivers; `sg_inq` through the bridge, `smartctl -d sat` where the bridge allows (confirm in lab) | V1 |
| 5 | Detects eMMC (soldered flash in cheap laptops) | Same | `mmcblk*` devices; `mmc-utils` (`mmc extcsd read`) | V1 |
| 6 | Detects NVMe drives | Same | `nvme-cli` (`nvme list`, `nvme id-ctrl`, `nvme id-ns`) | V1 |
| 7 | Detects removable flash (SD cards, USB sticks) | Same | sysfs `removable=1`, `mmcblk` with SD type, USB mass storage | V1 |
| 8 | Removable flash **hidden by default**; showing it must be enabled in the Configuration Tool | Same default: hidden. Setting "Show removable flash media" on the **Prepare stick** page of the web app, baked into signed `nexwipe-setup.json` | Engine filters them out of the list unless the setting is on | V1 |
| 9 | Removable flash can only be **cleared** (no purge) | Same: only overwrite standards offered; report level is at most **Clear** | Engine refuses firmware/purge steps on removable flash | V1 |
| 10 | A popup warns about removable flash at startup | Same: popup on the laptop screen at startup listing them and saying "clear-level only" | Kiosk dialog, own wording | V1 |
| 11 | Any stick labelled `BLANCCO` is always excluded | Any stick labelled `NEXWIPE` is always excluded — plus the stick we booted from is found by device ancestry and a marker file and can never be selected (see [safety rules](../before-we-start/safety-rules.md)) | Filesystem label via `blkid`; boot device from `/proc/cmdline` + sysfs parent chain | V1 |
| 12 | SAN (storage area network) endpoint devices visible by default | Same default | FC/iSCSI devices listed like other drives | Later (servers) |
| 13 | SAN devices can be hidden via the Configuration Tool; then they appear neither in the screen nor in asset reports (§7.6) | Same setting on the Prepare stick page; hidden devices left out of screen **and** report (report header notes "SAN devices hidden by setting" so nobody thinks they were checked) | Engine filter by transport type | Later (servers) |
| 14 | HDD size found by "hardware level detection", regardless of faulty/incorrect BIOS-set values, so overwriting reaches the whole surface (§7.5, p.82) | Same: size taken from the drive itself, not BIOS | ATA: `hdparm -N` native max address (and IDENTIFY total sectors); NVMe: `nvme id-ns` NSZE; SCSI: `sg_readcap -l`. If current < native, raise the "hidden area" icon (step 7) | V1 |
| 15 | Hybrid drives (SSHD = spinning disk with a small flash cache): programmatic detection first, then an embedded model list editable in the Configuration Tool (§8.2.2) | Same two-stage detection | First ATA IDENTIFY fields (`hdparm -I` "Hybrid Information" / NV cache — confirm in lab); then a built-in model list, editable on the Prepare stick page and stored in `nexwipe-setup.json` | V1 |

## 5.2 The drive list (§4.2.3, p.32–35)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | List view (default) | Same: list view is the default | Laptop screen web page (React, like the website) | V1 |
| 2 | Grid view (Ctrl+W) | Same, same shortcut Ctrl+W | Keyboard handler in the kiosk page | V1 |
| 3 | Grid view shows some info only on mouse hover | Same, plus the info is also reachable by keyboard focus (accessibility) | Tooltip on hover/focus | V1 |
| 4 | Erasure standard names shortened in progress view (e.g. "HMG Lower") | Same: each standard has a short name used in progress view | `short_name` field in the standards table (step 9) | V1 |
| 5 | Search bar (Ctrl+F) | Same, Ctrl+F | Kiosk page | V1 |
| 6 | Searches number, vendor, model, type, size, serial, status | Same fields | Client-side filter over the engine's drive list | V1 |
| 7 | Searches CPU type for Chromebooks | Same (Chromebook track only) | Field added when Chromebook support exists | Later (Chromebooks) |
| 8 | Accepts regular expressions | Same | JavaScript `RegExp`; invalid pattern = plain text search | V1 |
| 9 | Not case-sensitive | Same | `i` flag | V1 |
| 10 | Status search `!` = everything | Same | Search parser | V1 |
| 11 | `!s` / `!successful` = successful | Same | Search parser | V1 |
| 12 | `!c` = cancelled | Same | Search parser | V1 |
| 13 | `!f` = failed | Same | Search parser | V1 |
| 14 | "Show empty slots" (Ctrl+M) toggles visible empty bays | Same, Ctrl+M | Empty ports from sysfs (AHCI ports with no link, empty NVMe slots are not visible — show only what Linux can see; confirm in lab) | V1 |
| 15 | Shows number of drives | Same | Count in list header | V1 |
| 16 | Shows vendor/model | Same | From item 5.1 tools | V1 |
| 17 | Shows type (SATA, SPI, SSD…) | Same (SATA, SAS, NVMe, eMMC, USB, SSD/HDD) | Transport from sysfs; SSD vs HDD from `rotational` flag + rotation rate | V1 |
| 18 | Shows size in GB | Same, GB (decimal, as drive makers label) | Native size from 5.1 #14 | V1 |
| 19 | Shows serial number | Same | `hdparm -I`, `nvme id-ctrl`, `sg_inq -p 0x80` | V1 |
| 20 | Running ID and bay ID `X (Y-Z)`: X running ID, Y controller ID, Z controller port | Same format `X (Y-Z)` | Controller = PCI address order; port = from sysfs path (`ata<N>`, NVMe PCI slot) (confirm in lab) | V1 |
| 21 | **Black** bay ID: controller supports port mapping, remembered between boots, consistent | Same meaning; shown in normal text **and** with the word "fixed" in the tooltip (not colour alone) | Port number read from sysfs path is stable | V1 |
| 22 | **Yellow** bay ID: no port mapping — numbering by detection order, "changes between boots" | Same meaning; yellow + tooltip "order may change after restart" | Used when no stable port is found (e.g. USB) | V1 |
| 23 | "Locate drive" Ctrl+L (one), Ctrl+Alt+L (all) | Same shortcuts | Kiosk page → engine `locate` call | V1 |
| 24 | Blinks LED for 30 s or until stopped / erasure starts | Same: 30 s, stop button, auto-stop when erasure starts | Engine timer | V1 |
| 25 | Uses a supported enclosure LED, otherwise reads the drive in a distinguishable pattern | Same | `ledmon`'s `ledctl locate=/dev/X` for enclosures/backplanes; otherwise on/off read pattern (read 1 s, pause 1 s) to flash the activity LED | V1 (enclosures Later) |
| 26 | Disabled while a drive is erasing (not when paused) | Same | Button disabled for drives in Ongoing states | V1 |
| 27 | No limit on number of drives blinking | Same | — | V1 |
| 28 | Hex viewer shows raw sector contents (hex + ASCII), before or after erasure (§4.2.3.4) | Same: read-only hex viewer per drive | Engine reads chosen sector with direct I/O (`O_DIRECT`, bypasses cache so it shows what is really on the drive); page shows hex + ASCII | V1 |

## 5.3 Drive progress states (§4.2.3.5, p.42–43)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Not started | Same state | Engine job state machine | V1 |
| 2 | Ongoing: percentage, remaining time, write speed, standard | Same four values | Engine reports bytes written per second; time = remaining bytes ÷ recent speed | V1 |
| 3 | **Ongoing firmware command** (looped animation; e.g. ATA secure erase, SCSI format unit, Sanitize, TCG) | Same state with looped animation | Engine marks state while `hdparm`/`nvme`/`sg_format`/`sedutil-cli` command runs | V1 |
| 4 | Firmware command shows percentage if available | Same | ATA Sanitize status (`hdparm --sanitize-status`), NVMe `sanitize-log` progress; else animation only | V1 |
| 5 | Firmware command **cannot be paused or cancelled** | Same: Pause/Cancel buttons hidden + on-screen "Do not power off" | Engine rejects pause/cancel in this state | V1 |
| 6 | Locate button off during firmware command | Same | — | V1 |
| 7 | Paused | Same | Engine stops issuing writes, keeps position | V1 |
| 8 | Completed | Same | Only after verification passes (step 10) | V1 |
| 9 | Canceled | Same; report says **Not erased** | — | V1 |
| 10 | Failed (e.g. read/write errors) | Same; report says **Not erased** with reason | — | V1 |
| 11 | Buttons Pause, Resume, Cancel; select one or several drives | Same, multi-select | Checkbox list | V1 |
| 12 | Tab colour grey = not started | Same | CSS token | V1 |
| 13 | Dark blue = ongoing | Same | CSS token | V1 |
| 14 | Green = successful | Same | CSS token | V1 |
| 15 | Red = failed or cancelled | Same | CSS token | V1 |
| 16 | Blue = paused | Same, plus text label on every tab (colour is never the only signal) | CSS token | V1 |
| 17 | Tab shows percentage and remaining time | Same | — | V1 |

## 5.4 Every drive info icon (§4.2.3.6, p.43–46)

NexWipe draws its own icons (not Blancco's) with a short tooltip. Each icon is also a field in the report.

| # | Blancco icon | NexWipe builds (same meaning) | How it is detected | Phase |
|---|---|---|---|---|
| 1 | Standby mode — inactive 5 minutes and spun down (configurable in Settings/CT) | Same, default 5 min, setting on laptop Settings and Prepare stick page | `hdparm -S` to set timer; `hdparm -C` to read power state | V1 |
| 2 | Remapped sectors count — may update after erasure | Same; re-read after erasure | SMART attribute 5 (`smartctl -A`); SCSI grown defect list `sg_logs`/`smartctl`; NVMe has no count → shows spare % instead, labelled so | V1 |
| 3 | Error count — read/write errors during erasure, live | Same, live | Engine counters | V1 |
| 4 | Hidden areas — DCO, HPA or both; may disappear after removal | Same | `hdparm -N` (HPA), `hdparm --dco-identify` (DCO) | V1 |
| 5 | Password protected drive — cannot be erased unless password entered before boot | Same | `hdparm -I` Security section "enabled / locked" | V1 |
| 6 | Erasure option not supported (e.g. standard needs firmware erase the drive lacks; "Erase remapped sectors" unsupported) | Same | Engine compares chosen standard's steps with drive capabilities | V1 |
| 7 | Erasure standard has a fallback (e.g. firmware step → normal overwrite) | Same, and report states the level actually reached | Same comparison | V1 |
| 8 | GPT recovery partition detected | Same | Partition type GUID `de94bba4-06d1-4d40-a16a-bfd50179d6ac` (Windows recovery) via `lsblk -o PARTTYPE` / `sgdisk` | V1 |
| 9 | Erasure not allowed — preserve recovery partition / show partitions on and user tries whole-drive options | Same rule (see [step 8](../08-erasure-settings/README.md) §8.5) | Engine rule table | V1 |
| 10 | Drive temperature (NVMe and SATA only) | Same, NVMe and SATA | `nvme smart-log`, `smartctl -A` (attr 194/190) | V1 |
| 11 | Self-tests — option on and drive supports them | Same | `smartctl -c` capabilities; NVMe `id-ctrl` OACS self-test bit | V1 |
| 12 | TCG Cryptographic Erasure supported (used in "TCG Cryptographic Erasure" and "NIST 800-88 Purge") | Same | `sedutil-cli --query` (TCG "Level 0 discovery" = drive lists its security features) | V1 |
| 13 | TCG Enterprise — same, drive is Enterprise SSC compliant | Same | Level 0 discovery Enterprise feature | Later (data centre) |
| 14 | TCG Opalite / Pyrite / Ruby — detected and reported; crypto erasure "not supported yet", planned | Same: detect and report all three; crypto erase for them **not** in V1 (same as Blancco's icon text; see step 7 note about manual inconsistency) | Level 0 discovery feature codes | V1 detect, Later erase |
| 15 | TCG Locked — fully read/write locked by BIOS/UEFI or OS; unlock with password or PSID Revert | Same | Level 0 Locking feature "Locked" bit | V1 |
| 16 | Password Locked TCG Drive — readable/writable but TCG erase needs unlocking | Same | Locking enabled but not locked | V1 |
| 17 | Thunderbolt — green supported and in use; yellow supported but not in use (check port/cable) | Same two states | `/sys/bus/thunderbolt/devices`; drive's sysfs path passes through a Thunderbolt domain = in use (confirm in lab) | V1 |
| 18 | Security Freeze Lock (FL) — set by UEFI/BIOS; firmware erase may be blocked | Same | `hdparm -I` "frozen" | V1 |
| 19 | PSID — a PSID has been entered for a locked drive (click lock icons or Ctrl+J) | Same, Ctrl+J | Kiosk dialog; PSID kept in RAM only (step 7) | V1 |
| 20 | Shadow MBR area detected | Same (see step 7 §7.6) | Level 0 discovery Locking feature MBR bits | V1 |
| 21 | SID block enabled — offers to disable via BIOS (PPI) with reboot | Same (step 7 §7.5) | Level 0 discovery Block SID feature (confirm code in lab) | V1 |
| 22 | RAID metadata (RMTD) — recommends another standard; metadata may remain with clear-level erasure | Same | `mdadm --examine` signatures (Intel RST/IMSM on laptops, DDF); vendor signatures Later | V1 (laptop RST), Later (server RAID) |
| 23 | Storage Element Depopulation — depopulated areas not erased, may hold data; restoration only in IEEE Clear and Purge | Same | ATA/SCSI depopulation feature fields (confirm in lab) | Later (data centre HDDs) |
| 24 | NVMe detached namespaces — or without a block device, may hold data | Same | `nvme list-ns -a` vs `nvme list-ns` vs `/dev/nvme*n*` | V1 |
| 25 | Unallocated space — click to try attaching it | Same: click offers to create+attach a namespace over the space | `nvme id-ctrl` `unvmcap`; `nvme create-ns`/`attach-ns` (confirm in lab) | V1 detect, Later attach |
| 26 | Namespaces with Key Value IO Command Set | Same | `nvme id-ns` command set ID | Later (data centre) |
| 27 | Persistent Memory Region (PMR) | Same | NVMe controller register PMRCAP (`nvme show-regs`) | Later (data centre) |
| 28 | Persistent Reservations (PR) — shown if auto-clear off but reservation active; click to clear; red if restricting | Same incl. auto-clear setting on Prepare stick page | `nvme resv-report` / `resv-release`; SCSI `sg_persist` | Later (servers) |
| 29 | NVMe Boot Partitions (NBP) — outside user space, writable only with firmware download; report says empty or verification failed; if presence unknown may still hold system data | Same three report outcomes: empty / verification failed / presence unknown — may hold system data | `nvme id-ctrl` BPINFO / CAP BPS; read with `nvme boot-part-log` (confirm in lab) | V1 |
| 30 | Namespace Write Protection — erasure not supported | Same | NVMe namespace write-protect feature (`nvme get-feature` — confirm in lab) | V1 |
| 31 | Replay Protected Memory Block (RPMB) — cannot be removed; not for user data; report says empty or not | Same | NVMe `id-ctrl` RPMBS; eMMC `mmc extcsd read` RPMB size | V1 |
| 32 | Zoned Storage Device — erasure "often not compatible" | Same warning | sysfs `queue/zoned` | Later (data centre) |
| 33 | With "Report per connected device" or drive-level workflows, each drive shows extra report/custom-field icons (step 13, chapter 10) | Same icons when NexWipe workflows / per-drive reports are on | Laptop screen + workflow engine (step 13) | V1 |

## 5.5 Hardware (asset) report contents (§4.5.2.1, p.53–54)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Before erasure the report is "simply an asset report" | Same: before erasure the report is an asset report, titled so (never says "Erased") | Report JSON with `erasure: none` | V1 |
| 2 | Licensee / customer / operator information | Same: company (organisation), customer, technician | From the web app account + stick setup + login on laptop | V1 |
| 3 | Hardware: CPU, memory, drives, etc. | Same | `/proc/cpuinfo`, `dmidecode -t processor,memory`, step 5.1 drives, `dmidecode` system/baseboard | V1 |
| 4 | USB devices listed; internal vs external USB cannot be distinguished | Same, and report says so | `lsusb` / `/sys/bus/usb/devices` | V1 |
| 5 | USB hubs and HASP sticks (Blancco licence dongles) filtered out | Hubs filtered out (USB class 09). HASP filter n/a for NexWipe — no licence dongle; our own boot stick is also filtered out | Class filter | V1 |
| 6 | Bluetooth devices shown separately | Same | `/sys/class/bluetooth`, `bluetoothctl` | V1 |
| 7 | Screen resolution only on laptops, current resolution only, first display only | Same three limits | Chassis type from `dmidecode -t chassis`; current mode from DRM `/sys/class/drm/*/modes` / kiosk display | V1 |
| 8 | SMART attributes for ATA | Same | `smartctl -A -j` | V1 |
| 9 | Log pages for SCSI/SAS | Same | `sg_logs`, `smartctl -x` | Later (servers) |
| 10 | Battery charge level | Same | `/sys/class/power_supply/BAT*/capacity` | V1 |
| 11 | HDDs: nominal rotation rate (RPM) and form factor (in XML, CSV, PDF) | Same fields, in NexWipe's JSON, CSV and PDF reports | `hdparm -I` / `smartctl -i` "Rotation Rate", "Form Factor" | V1 |
| 12 | BIOS password "Enabled"/"Disabled" (or "Unknown"/"Not implemented") | Same four values | `dmidecode -t 24` (Hardware Security) "Administrator Password Status" | V1 |
| 13 | IPMI network data (MAC, IP) auto-detected at boot, XML only | Same, in JSON only | `ipmitool lan print` | Later (servers) |
| 14 | TPM devices (if present and enabled in BIOS) | Same | `/sys/class/tpm`, `tpm2_getcap properties-fixed` | V1 |
| 15 | Workflow variable `tpm_devices` (§7.26) | Same variable name in NexWipe workflows | Workflow engine | V1 |
| 16 | Persistent software (e.g. Computrace) if detection enabled (§7.15) | Same, off unless enabled on Prepare stick page (see step 7 §7.9) | ACPI WPBT table (`/sys/firmware/acpi/tables/WPBT`) + firmware strings (confirm in lab) | V1 |
| 17 | Drive self-tests | Same (step 8 pre-processing) | `smartctl -t`, `nvme device-self-test` | V1 |
| 18 | Drive life remaining estimate (SMART, plus Seagate FARM — worse value used) | Same: both sources, worse value wins | `smartctl -A` + `smartctl -l farm` (Seagate field log, smartmontools 7.4+) | V1 |
| 19 | Warning if health bad or < 90 days | Same: warning under 90 days or bad health | Report rule | V1 |
| 20 | Drive health percentage (Basic or Strict) (§7.30–7.31) | Same two modes. Blancco's exact formula is not public, so NexWipe writes and documents its own Basic/Strict formula | SMART/NVMe health log | V1 |
| 21 | TCG fields, Shadow MBR fields, Block SID fields (step 7) | Same fields (NexWipe names, e.g. `tcg_shadow_mbr_enabled`) | Level 0 discovery | V1 |
| 22 | Small asset report viewable from the notification area (step 4) | Same on the laptop screen's notification area | Kiosk page | V1 |
