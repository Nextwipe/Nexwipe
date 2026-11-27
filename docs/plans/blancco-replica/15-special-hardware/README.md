# Plan — Step 15 — Hardware that needs special handling

Mirrors: research [15-special-hardware/README.md](../../../research/blancco-drive-eraser/15-special-hardware/README.md)

## In short
NexWipe Eraser copies every special-case rule Blancco has: the same SSD guidelines, the same honest eMMC and hybrid-drive
warnings, the same NVMe heat, namespace and port-mapping behaviour, and the same boot limits for odd machines.
Windows laptops and desktops (Intel/AMD, SSD, NVMe, eMMC, hybrid drives, Surface, Dell, Lenovo) are **V1**. Servers,
RAID, NVMe over network, NVDIMM, port mapping for drive bays, Macs and Chromebooks are **Later**. Chromebooks have their
own plan: [chromebooks.md](chromebooks.md). Every warning Blancco puts in a report, NexWipe puts in the report too, and
the report always states the level actually reached (Purge or Clear) — never more.

Words used once: **firmware command** = asking the drive's own controller to erase itself; **Purge / Clear** (NIST
800-88) = recovery impossible even in a lab / impossible with normal software; **report exception** = a warning line
printed in the report next to the result.

## 15.1 Unsupported processors (§8.1, p.103)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | x86 (Intel, AMD) supported; other x86 vendors case by case | Same: x86-64 Intel and AMD supported; others tested case by case and listed in a compatibility list in the web app | Eraser image built for x86-64 | V1 |
| 2 | RISC, ARM etc. not supported directly → remove drives and erase them in an x86 "erasure station" | Same: ARM machines (incl. ARM Windows laptops) not supported for boot; the laptop screen and help say "Remove the drive and erase it in an x86 laptop/desktop running NexWipe Eraser" | Help text; drive erased as a loose drive (step 05 plan) | V1 (ARM boot support: Later) |
| 3 | Sun SPARC → Blancco's separate SPARC product | n/a for NexWipe — no SPARC product; SPARC servers are listed as "not supported" | — | Later |
| 4 | Most x86 tablets incl. Intel Atom boot; most Atom "Clover Trail" don't | Same expectation; Clover Trail listed as "usually doesn't boot" in the compatibility list. Many Atom tablets have 32-bit UEFI → NexWipe stick also ships a 32-bit UEFI boot loader (confirm in lab) | Boot loader files on stick (step 03 plan) | V1 |

## 15.2 SSDs (§8.2, §16.1)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 5 | SSD method only for ATA and SCSI SSDs with firmware erase commands | **NexWipe SSD method** (strongest supported firmware purge → aperiodic random overwrite → second firmware erase if supported → verify ≥ 10%) only on drives with a firmware erase command (ATA, SCSI, and NVMe per 15.5) | Command chain in engine (steps 08/09 plans) | V1 |
| 6 | Other standards allowed on SSDs; report notes an SSD was erased | Same: any overwrite standard can run; report adds "Device is an SSD" exception | Report builder | V1 |
| 7 | No firmware command → SSD method can't be used; UI says so | Same: method greyed out with reason "This drive has no firmware erase command" | Capability detection: `hdparm -I` (ATA security/sanitize), `sg_readcap`/`sg_opcodes` (SCSI), `nvme id-ctrl` (NVMe) | V1 |
| 8 | Freeze lock not removable → SSD method fails; report says so | Same: result Not erased with "Freeze lock could not be removed" | Freeze removal via sleep/wake `rtcwake -m mem -s 5` (step 07 plan) | V1 |
| 9 | Old SSDs (usually ≤ 64 GB): erase one per machine at a time | Same: engine queues SSDs ≤ 64 GB one at a time per laptop | Size check in scheduler | V1 |
| 10 | Erase the whole drive, not partitions | Same: SSD method only offered for the whole drive | — | V1 |
| 11 | No USB/FireWire docks or PATA/SATA/SCSI bridges | Same: drives behind USB/FireWire/bridges can't use the SSD method; warning shown | Bus detection from sysfs path (`usb`, `firewire`) | V1 |
| 12 | No RAID | Same: drives behind RAID not erased with SSD method (see 15.6) | Controller detection | V1 |
| 13 | Two SSDs attached → one at a time | Same: one SSD-method run at a time per machine | Scheduler | V1 |
| 14 | ATA SSD not shown / no firmware access → switch IDE/ATA to AHCI/SATA Native | Same advice on screen and in help (with step 02 BIOS-setup plan) | — | V1 |
| 15 | Update firmware for models that consistently fail (no guarantee) | Same advice, same "no guarantee" note; models that keep failing are recorded in the compatibility list | Web app compatibility list (new table, step 18 plan) | V1 |

## 15.3 eMMC (§8.2.1, p.103–104)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 16 | eMMC = embedded flash with own controller (internal wear levelling, bad-block management); shown as "eMMC" | Same label "eMMC" in the drive list | `/sys/block/mmcblk*`; `mmc extcsd read` (mmc-utils) | V1 |
| 17 | JEDEC Sanitize removes user-addressable and unmapped data; Secure Erase is for backward compatibility | Same order: Sanitize first, Secure Erase only if Sanitize missing | `mmc sanitize /dev/mmcblkN`; `mmc erase secure-erase …` (confirm in lab) | V1 |
| 18 | Retired sectors: some eMMCs erase defective regions before retiring, only if enabled beforehand and only for sectors retired after; otherwise retired sectors may survive Sanitize/Secure Erase | Same warning in report for every eMMC; engine reads whether the "secure bad-block" feature is on and reports it | EXT_CSD `SEC_FEATURE_SUPPORT` bits (confirm in lab) | V1 |
| 19 | Clear: overwrite first-to-last detected sector + verify | Same | Overwrite engine (step 08 plan) | V1 |
| 20 | Purge: Sanitize and Secure Erase in "NIST 800-88 Purge" and "Blancco SSD Erasure", but "no guarantees that the purge-level will be achieved in all situations" | Same in NIST Purge and the NexWipe SSD method; same "no guarantee" note in the report (own wording) | Report exception | V1 |
| 21 | Some eMMCs show an extra recovery partition after purge which may still contain data | Same: engine rescans after purge; any newly visible area is reported as an exception and offered for overwrite | Rescan `/sys/block/mmcblk*` (incl. `boot0/boot1`, `rpmb`) | V1 |

## 15.4 Hybrid drives / SSHD (§8.2.2, p.104–105)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 22 | Detected programmatically or via an embedded model list editable in CT | Same: detection + built-in model list, editable on the Prepare stick page | ATA IDENTIFY hybrid info (`hdparm -I`, confirm in lab) + `nexwipe-setup.json` list | V1 |
| 23 | Only the part presented to software (usually HDD) is processed; hidden flash can't be verified | Same | — | V1 |
| 24 | "No guarantees … against recovery using laboratory techniques"; only software-level non-invasive attacks covered | Same meaning in report; level reported as Clear, never Purge | Result rules (step 11 plan) | V1 |
| 25 | Report exception warns about it | Same exception on every hybrid drive | Report builder | V1 |
| 26 | Not enough research to say firmware erase (e.g. ATA Secure Erase) covers both parts | Same: NexWipe makes no claim that firmware erase reaches the flash part | Report wording | V1 |

## 15.5 NVMe (§8.3, p.105–111)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 27 | Shown as "NVMe" | Same label | `nvme list` | V1 |
| 28 | TCG Opal, Enterprise, Opalite, Pyrite, Ruby detected and reported | Same five types detected and reported | `sedutil-cli --query`; NVMe security receive (Level 0 discovery) | V1 |
| 29 | Heat: erasure → throttling or overheating; temperature shown in UI | Same: live drive temperature on each drive card | `nvme smart-log` composite temperature | V1 |
| 30 | Screensaver flashes near the Critical Composite Temperature Threshold | Same: screensaver flashes when temperature nears the drive's critical threshold | Threshold `cctemp` from `nvme id-ctrl` | V1 |
| 31 | Pause until it cools, or add external cooling | Same advice; Pause allowed during overwrite only, never during a firmware command | Engine pause (step 08 plan) | V1 |
| 32 | NVMe Sanitize supported since 6.17 (used in Sanitize Cryptographic Erasure, IEEE 2883 Purge, NIST Purge) | NVMe Sanitize from the first version (Blancco version 6.17: n/a for NexWipe), used in the same three standards | `nvme sanitize -a <crypto/block/overwrite>` | V1 |
| 33 | Blancco recommends "Blancco SSD Erasure" for NVMe | NexWipe recommends the NexWipe SSD method for NVMe (default choice on Prepare stick page) | — | V1 |
| 34 | NVMe support began in 6.1 (early limits: no hotplug, no partition detection) | n/a for NexWipe — Blancco version history; NexWipe has hotplug and partition detection from V1 | — | V1 |
| 35 | Namespaces and unallocated space shown as separate cards | Same | `nvme list-ns -a`, `nvme id-ns`, unallocated = `tnvmcap − sum(ns)` | V1 |
| 36 | Merge manually (DET/UNL icons) | Same, with NexWipe's own icons for "detached namespace" and "unallocated space" | Kiosk UI | V1 |
| 37 | Merge automatically (CT "Automatically merge multiple namespaces into one") | Same setting on Prepare stick page | `nvme delete-ns` + `create-ns` + `attach-ns` (confirm in lab) | V1 |
| 38 | 1 licence per drive | 1 wipe credit per drive regardless of namespaces (no charge in V1; payment Later) | Credit ledger (step 18 plan) | V1 |
| 39 | Show namespaces in colour (Ctrl+N) | Same toggle, Ctrl+N | Kiosk key map | V1 |
| 40 | Namespaces of a drive being erased can't be selected | Same | — | V1 |
| 41 | Namespaces erased but detached namespaces/unallocated space not → report disclaimer (whole drive not erased) | Same disclaimer; result for the drive is not "whole drive erased" | Report builder | V1 |
| 42 | Namespaces and RAID metadata region reported separately, numbered | Same numbering | — | V1 (RAID metadata: Later) |
| 43 | NVMe-oF / FC-NVMe: erase remote NVMe enclosures (e.g. HPE Alletra 2240) over 100 Gb Ethernet using RDMA (RoCEv2) or TCP | Same capability | `nvme discover` / `nvme connect -t rdma|tcp` | Later |
| 44 | Configure DHCP and MTU (Alletra 9000) | Same network settings on Prepare stick page | `ip link set mtu` | Later |
| 45 | NVMe-oF: only overwriting standards and NIST Purge | Same limit | Standard filter | Later |
| 46 | Port mapping learned gradually as drives are connected | Same | Saved map keyed by controller + port | Later |
| 47 | Fill all slots then boot for a reliable map | Same advice | — | Later |
| 48 | Order: NVMe first, SAS/SATA/FC by PCI bus, then USB/eMMC, then NVMe-oF; unknown last | Same order | Sort by sysfs PCI path | Later (simple list order on laptops: V1) |
| 49 | Each NVMe is its own controller (1-1, 2-1, …) | Same numbering | — | Later |
| 50 | Worked example in manual (4 slots, drives A–E) | Same example turned into an automated test case | Unit test | Later |
| 51 | Port aliases up to 255 characters (Ctrl+Alt+A) | Same limit and shortcut | Saved in port map | Later |
| 52 | Reports use original port numbers | Same | — | Later |
| 53 | Custom drive order (drag or Ctrl+arrows) | Same | Kiosk UI | Later |
| 54 | Saved on installed BDE or with a Blancco stick connected | Saved on the NexWipe stick (writable data partition) or in the web app per station | `eraser_port_maps` table (step 18 plan) | Later |
| 55 | Reset button | Same | — | Later |
| 56 | Orange ports are not part of the mapping | Same colour meaning | — | Later |
| 57 | Hybrid appliances, e.g. 4 NVMe + 8 SAS/SATA slots | Same support | — | Later |
| 58 | Removed NVMe controller kept as dummy (not reported) | Same | — | Later |
| 59 | NVMe controller always 1 bay | Same | — | Later |
| 60 | HPE SR932i-p Gen11: no bay numbering (yellow) | Same known limit in compatibility list | — | Later |
| 61 | HPE SR932i-p: only first NVMe namespace visible | Same | — | Later |
| 62 | HPE SR932i-p: no NVMe self-tests (§15.3) | Same | — | Later |

## 15.6 RAID controllers with SAS/SATA (§8.4) — see step 7.10.

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 63 | RAID handling described in step 7.10 | Same, planned in [07-removing-locks](../07-removing-locks/README.md) §7.10 (vendor tools such as `storcli`, `ssacli`; licence check before shipping) | — | Later |

## 15.7 NVDIMM (§8.5, p.111–112)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 64 | Raw and sector modes (set with NDCTL) | Same | `ndctl create-namespace --mode=raw|sector` | Later |
| 65 | NVDIMM-N: clear only | Same | — | Later |
| 66 | NVDIMM-Optane: clear; purge possible depending on host and raw mode | Same | `ipmctl` | Later |
| 67 | Regions/namespaces must exist (BIOS; NDCTL or ipmctl) or capacity shows 0 bytes | Same | — | Later |
| 68 | Exception "NVDIMM data backup is not armed, check backup battery" | Same meaning (own wording) | `ndctl list --health` | Later |
| 69 | Exception "NVDIMM has invalid or missing configuration" | Same meaning (own wording) | — | Later |
| 70 | Reported as NVDIMM | Same | — | Later |

## 15.8 Password-locked drives (§8.6) — only overwrite; remove password in BIOS for purge.

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 71 | Password-locked drives: only overwrite | Same | `hdparm -I` shows "enabled/locked" | V1 |
| 72 | Remove the password in BIOS for purge | Same advice on screen | Help text (step 07 plan §7.3) | V1 |

## 15.9 Removable flash (§8.7) — hidden by default, clear only, "BLANCCO"-labelled sticks excluded.

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 73 | Hidden by default | Same; showing them is a Prepare stick setting | `removable=1` / USB bus | V1 |
| 74 | Clear only | Same | Standard filter | V1 |
| 75 | "BLANCCO"-labelled sticks excluded | Sticks labelled `NEXWIPE` excluded, and the boot stick is also excluded by device ancestry + marker file even if relabelled | Safety rules (before-we-start/safety-rules.md) | V1 |

## 15.10 Chromebooks (§8.8) — two ways: boot generic BDE on Intel Chromebooks (most have locked bootloaders), or the recommended "modern" network process for Intel and ARM. Full detail: [chromebooks.md](chromebooks.md).

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 76 | Way 1: boot generic eraser on Intel Chromebooks (most have locked bootloaders) | Same: allowed only where the Chromebook boots it; not the recommended path. Must respect AGENTS.md: devices with `device_class = 'chromebook'` never get drive-erasure jobs, so this path needs an owner decision first | — | Later |
| 77 | Way 2 (recommended): "modern" network process for Intel and ARM | Same, planned in [chromebooks.md](chromebooks.md) | — | Later |

## 15.11 Apple

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 78 | T2 chip controls internal SSD access | Same understanding | Kernel with Apple T2 support (`apple-bce` driver, confirm in lab) | Later |
| 79 | T2 boot and erase supported from 6.12.0 | T2 support as one feature (Blancco version: n/a for NexWipe) | — | Later |
| 80 | KB: 6.12.0 needed manual GRUB edits; 6.13.0+ boots and erases T2 | NexWipe target = boots with no manual edits (like 6.13.0+) | Boot menu (step 03 plan) | Later |
| 81 | Procedure: USB Creator stick | NexWipe Stick Creator stick | — | Later |
| 82 | Startup Security Utility → Secure Boot "No Security" | Same instruction | Help page | Later |
| 83 | External Boot "Allow booting from external media" | Same instruction | Help page | Later |
| 84 | External keyboard needed | Same note | Help page | Later |
| 85 | Factory-reset device needs activation for admin access | Same note | Help page | Later |
| 86 | MacBookPro16,1 (late 2019) booted ~2 of 3 attempts, else reboot and repeat | Same known issue in compatibility list | — | Later |
| 87 | Black screen but booted → erase via automatic process or BMP remote control | Same: automatic process (workflow) or remote control from the web app (step 06 plan) | — | Later |
| 88 | Older KB: NVMe not visible on T2, pointed to LUN Eraser (outdated) | n/a for NexWipe — outdated Blancco product advice | — | Later |
| 89 | Intel Macs: only Intel (x86) Macs (Apple KB, 6.1.2+) | Same | — | Later |
| 90 | No PXE on Macs | Same | — | Later |
| 91 | Some won't boot USB → CD | Same: NexWipe also offers an ISO for CD | ISO build (step 01 plan) | Later |
| 92 | Remove Thunderbolt and other peripherals (FLR issue) | Same advice | Help page | Later |
| 93 | Secure Boot "No Security" | Same | Help page | Later |
| 94 | Purge shows "NOT SUPPORTED" on some models (MacBookPro11,1 with OWC Aura SSD, MacBookAir6,1, MacBook9,1, MacBook8,1, MacBookAir7,1); "cannot be fixed" | Same five models listed; purge shown as not supported on them | Compatibility list | Later |
| 95 | Use Aperiodic Random Overwrite or HMG Lower with 100% verification for clear-level | Same two standards suggested on those models | Standards (step 09 plan) | Later |
| 96 | NVMe in MacBookAir7,1, MacBook8,1, MacBook9,1: overwrite with 6.2.0+ | Same: overwrite supported (Blancco version: n/a) | — | Later |
| 97 | Give family and serial to support | NexWipe issue report includes Mac model family and serial automatically | Issue report (step 13 plan) | Later |
| 98 | Apple Silicon (M1+): not Drive Eraser | Same: NexWipe Eraser does not boot on Apple Silicon | — | Later |
| 99 | "Mobile Diagnostics and Erasure on Mac" 4.10 covers T2 and M1 | n/a for NexWipe — Blancco product; NexWipe equivalent to be researched (e.g. Apple's own "Erase All Content and Settings" triggered and recorded — recorded as Apple's reset, not as a NexWipe erasure) | — | Later |
| 100 | Drive Eraser for Mac (based on LUN Eraser) supports M1 and T2 | n/a for NexWipe — Blancco product; same research item as row 99 | — | Later |

## 15.12 Microsoft Surface

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 101 | Surface Pro 4: Secure Boot "Microsoft & 3rd party CA" | Same instruction; NexWipe's shim is signed through Microsoft's 3rd-party UEFI CA, so this setting is needed | Help page + compatibility list | V1 |
| 102 | Surface Pro 3: no FLR black screen, but firmware commands fail — FLR unusable | Same known limit (FLR = Blancco's freeze-lock removal by sleep/wake); falls back as step 07 plan says | Compatibility list | V1 |
| 103 | Surface 3: BIOS version matters for FLR | Same note | Compatibility list | V1 |

## 15.13 Dell / Lenovo specifics (KB)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 104 | Dell Latitude 3480/5480: disable "Block Sleep (S3 State)" | Same instruction | Compatibility list + help | V1 |
| 105 | Dell Latitude 9430: sluggish UI with FLR boot — use safe resolution (§15.4) | Same: boot-menu entry "Safe resolution" (step 03 plan) | Kernel option `nomodeset` (confirm in lab) | V1 |
| 106 | Lenovo X1 Tablet 20GHS0S100: BIOS ≤ 1.55 supports S3, ≥ 1.57 doesn't | Same note | Compatibility list | V1 |

**Compatibility list:** one list in the web app, by manufacturer + model + firmware version, holding every model note
above and every model the NexWipe lab tests (new table `eraser_model_notes`, see step 18 plan). The laptop screen shows
the note for the detected model (from `dmidecode -s system-product-name`).
