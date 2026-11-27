# Plan — Step 8 — Erasure settings the operator can choose

Mirrors: research [08-erasure-settings/README.md](../../../research/blancco-drive-eraser/08-erasure-settings/README.md)

## In short
Before pressing Erase, the technician (unless the company locked the settings on the **Prepare stick** page of the web
app) picks per drive or per group: the erasure standard, the verification level, and the same options Blancco offers —
erase remapped sectors, remove hidden areas, force the NexWipe SSD method on SSDs, partition handling and formatting
after erasure. The same combinations are blocked, by one rule table inside the eraser engine, so the screen can never
bypass it. The report always states the level actually reached (Purge or Clear), never more.

## 8.1 Where (§4.2.3.3, p.36–38)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Gear icon bottom-right (or Ctrl+G, KB) → submenus | Same place, same shortcut Ctrl+G | Settings panel on the laptop screen (kiosk web page) | V1 |
| 2 | Lock icon means settings were locked in CT; tooltip explains | Same: lock icon + tooltip "Locked by your company's stick setup" | `locked: true` per setting in signed `nexwipe-setup.json`; engine also refuses changes to locked settings | V1 |
| 3 | Standard, remapped sectors and verification can be set individually or per group (§4.2.3) | Same three, per drive or per selected group | Per-drive settings object in the engine | V1 |

## 8.2 All options

### Pre-processing

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Execute self-tests on drives (SMART) | Same option | `smartctl -t <type>`; NVMe `nvme device-self-test` | V1 |
| 2 | Short (< 2 min typical) | Same | `smartctl -t short`; NVMe short test | V1 |
| 3 | Conveyance (ATA only, several minutes) | Same, ATA only | `smartctl -t conveyance` | V1 |
| 4 | Extended (whole surface, minutes to hours) | Same | `smartctl -t long`; NVMe extended | V1 |
| 5 | "Fail Erasure if Unsuccessful" | Same option | Engine stops job; report Not erased with reason | V1 |
| 6 | Tests auto-fail if much longer than estimated | Same; limit = drive's own estimate × a factor (factor set in lab, start at 2×) | `smartctl -c` gives the estimate | V1 |
| 7 | ATA and SCSI | Same (NVMe too, because laptops use NVMe) | SCSI via `smartctl`/`sg_senddiag` | V1 (SCSI Later) |
| 8 | Also runnable without erasure via workflows (§7.30) | Same workflow step "Self-test only" | Workflow engine | V1 |

### In-process

| # | Option (Blancco) | Default | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|---|
| 1 | Erasure standard + verification level | from CT | Same, default from Prepare stick page (steps 9 and 10) | Standards table | V1 |
| 2 | Overwrite pattern type — only with NIST 800-88 Clear: Static (choose byte value) or Aperiodic random | — | Same two choices, only for NIST Clear | Engine pattern generator (static byte, or ChaCha20/AES-CTR stream = random that never repeats) | V1 |
| 3 | Erase remapped sectors — adds a firmware step for remapped (retired) sectors | **Off** | Same, **off** | See §8.3 | V1 |
| 4 | Fail erasure if unsuccessful — only with #3 | Off | Same, off | Engine rule | V1 |
| 5 | …On: drive with ≥1 remapped sector where erasure fails/unsupported → whole erasure fails at once, report says the drive doesn't support remapped-sector erasure | — | Same behaviour, own wording | Report reason | V1 |
| 6 | …Off: continues, same text as an exception | — | Same | Report exception | V1 |
| 7 | Remove hidden areas — HPA/DCO (step 7) | — | Same | `hdparm -N`, `--dco-restore` | V1 |
| 8 | Enforce Blancco SSD method on SSDs — all SSDs (incl. NVMe) get Blancco SSD Erasure; HDDs keep the selected standard | — | "Enforce NexWipe SSD method on SSDs" — same scope. NexWipe SSD method = strongest supported firmware purge → aperiodic random overwrite → second firmware erase if supported → verify ≥10% | Engine plan builder | V1 |
| 9 | Show drive partitions — listed and erasable separately | — | Same | §8.5 | V1 |
| 10 | Preserve recovery partition — GPT drives with Windows recovery partition partly erased, keeping it | — | Same | §8.5 | V1 |
| 11 | Use WRITE SAME command — faster periodic patterns, SCSI/SAS only | **On** | Same, **on** | `sg_write_same` / SCSI WRITE SAME from the engine | Later (SAS) |
| 12 | Configure firmware-based commands — untick individual commands to skip | — | Same tick list per command | Engine skips unticked commands; report lists skipped ones | V1 |
| 13 | If NVMe Format (Crypto Erase / User Data Erase) runs with IEEE 2883-2022 Purge, report says "Sanitization includes vendor-specific purge commands" — purge "might not be achieved", confirm with vendor | — | Same warning in report (own wording) | Report rule | V1 |

### Post-processing

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Format drives after erasure: NTFS, FAT32 or exFAT | Same three | `mkfs.ntfs` (ntfs-3g), `mkfs.vfat -F 32`, `mkfs.exfat` — run only by the engine on the drive just erased | V1 |
| 2 | For ATA, SCSI, SAS, NVMe, eMMC, USB | Same list | — | V1 (SCSI/SAS Later) |
| 3 | Turning it on disables Bootable asset report and Fingerprint even if enabled in CT | Same rule | Engine rule | V1 |

## 8.3 Remapped sectors in detail (§7.8, p.83–84)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Drives remap failing sectors to a spare area; remapped sector may contain user data | Same explanation on screen | — | V1 |
| 2 | Extra firmware step added only if drive has ≥1 remapped sector and the standard has no firmware step | Same rule | SMART attr 5 count + standards table | V1 |
| 3 | Optional: failure doesn't fail erasure (unless "Fail erasure if unsuccessful") | Same | Engine rule | V1 |
| 4 | Remapped-sector threshold in CT: count before/after ≥ threshold → stopped and failed with message | Same threshold setting on Prepare stick page | Engine compares before/after | V1 |
| 5 | Standards that include it de facto: (Extended) Firmware based erasure, BSI-GS/E, NIST 800-88 Purge – ATA, Blancco SSD Erasure | Same list (NexWipe SSD method in place of Blancco SSD Erasure) | Standards table | V1 |
| 6 | Warning: can also erase hidden areas | Same | Help text | V1 |
| 7 | Don't power off/disconnect/pause/cancel during it — drives may be damaged | Same; pause/cancel removed during firmware step | Engine state "Ongoing firmware command" | V1 |
| 8 | Disable BIOS HDD detection to avoid problems | Same advice | Help text | V1 |
| 9 | Can be time-consuming | Same note | Help text | V1 |

## 8.4 SSD switch (§7.11, p.86)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | For each SSD the default standard switches to Blancco SSD Erasure; non-SSDs unaffected | Same with NexWipe SSD method | SSD = sysfs `rotational=0` or NVMe | V1 |

## 8.5 Partitions and recovery partition (§7.12, p.86–88)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Show drive partitions works with MBR and GPT | Same | `lsblk -J -o NAME,FSTYPE,LABEL,SIZE,PARTTYPE`, `sfdisk -J` | V1 |
| 2 | Drive shown as multi-select list of partitions (filesystem, label, size) | Same | Kiosk list | V1 |
| 3 | Partitions erased and reported individually | Same | Report per partition | V1 |
| 4 | Preserve recovery partition: GPT only (Windows 7/8+) | Same | GPT type GUID of Windows recovery (step 5) | V1 |
| 5 | All partitions erased except recovery; can later reimage the machine | Same | Engine writes only outside the recovery partition's sector range | V1 |
| 6 | "RECOVERY" icon | Same meaning, own icon | — | V1 |
| 7 | Case 1 = some partitions selected | Same | Engine rule table | V1 |
| 8 | Case 2 = all partitions selected (overrides 1) | Same | Same | V1 |
| 9 | Case 3 = preserve recovery + GPT recovery detected (overrides 2) | Same | Same | V1 |

Rule table — NexWipe copies it exactly (one table inside the engine, used for every caller):

| # | Option | Case 1 | Case 2 | Case 3 | Phase |
|---|---|---|---|---|---|
| 10 | Normal overwriting | Allowed (a) | Allowed (c) | Allowed (d) | V1 |
| 11 | Firmware command | Not allowed (b) | Allowed (c) | Not allowed (b) | V1 |
| 12 | Remapped sectors erasure | Not allowed (b) | Allowed (c) | Not allowed (b) | V1 |
| 13 | Hidden area removal | Not allowed (b) | Allowed (c) | Not allowed (b) | V1 |
| 14 | NexWipe SSD switch (Blancco SSD switch) | Not allowed (b) | Allowed (c) | Not allowed (b) | V1 |
| 15 | Bootable asset report | Ignored (e) | Allowed (c) | Ignored (e) | V1 |
| 16 | Fingerprint | Ignored (e) | Allowed (c) | Ignored (e) | V1 |

| # | Blancco note | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 17 | (a) only selected partitions: content, label, filesystem erased; partition table untouched; reported individually with exception "there is data left on the drive" | Same; report result can never say the whole drive is erased | Report rule | V1 |
| 18 | (b) red "NOT ALLOWED" icon, error popup, erasure won't proceed — only overwriting possible | Same | Engine refuses; kiosk shows popup | V1 |
| 19 | (c) normal whole-drive erasure, report doesn't mention partitions | Same | — | V1 |
| 20 | (d) with Show partitions: like (a) with recovery greyed out; without: all but recovery erased in background, exception "data left on the drive" | Same | — | V1 |
| 21 | (e) silently ignored | Same, but NexWipe writes one line in the detail log ("ignored because partition erasure") so the owner can trace it | Detail log | V1 |
| 22 | SSD method rule: erase the whole drive, not partitions — firmware commands don't work on partitions (§16.1) | Same rule for NexWipe SSD method | Engine rule (#14) | V1 |

## 8.6 Fallback Purge → Clear (§7.28, p.99)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | CT option "Enable fallback from NIST Purge to NIST Clear": if Purge unsupported or fails, falls back to Clear | Same option on Prepare stick page; report says **Clear** reached (never Purge) and why Purge failed | Engine + report rule | V1 |
| 2 | Both standards must be enabled in CT | Same validation on Prepare stick page | Web app form check + engine check | V1 |
| 3 | Common Criteria report says users must understand the implications | NexWipe has no Common Criteria evaluation (that is V2). V1 shows the same caution text next to the option | Help text | V1 (evaluation V2) |

## 8.7 Workaround when firmware commands fail (KB 11635720)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Error "ENHANCED SECURE ERASE command failed" | Same error case, own wording | `hdparm --security-erase-enhanced` exit/status | V1 |
| 2 | Error "SECURE ERASE command failed" | Same | `hdparm --security-erase` | V1 |
| 3 | Error "FORMAT UNIT command failed" | Same | `sg_format` | Later (SAS) |
| 4 | Error "BLOCK ERASE EXT command failed" | Same | `hdparm --sanitize-block-erase` | V1 |
| 5 | Error "OVERWRITE EXT command failed" | Same | `hdparm --sanitize-overwrite` | V1 |
| 6 | Error "Cryptographic erasure has failed" | Same | `hdparm --sanitize-crypto-scramble`, `nvme sanitize`/`nvme format --ses=2`, `sedutil-cli` | V1 |
| 7 | Cause: firmware rounds mandatory in some standards and the drive lacks the command or "might be in a locked state" | Same cause shown, with the lock found in step 5/7 if known | Report reason | V1 |
| 8 | Commands depend on target drive, selected settings and standard | Same; report lists exactly which commands were sent | Detail log | V1 |
| 9 | Workaround: disable "Enforce Blancco SSD method on SSD" and choose "NIST 800-88 Clear" → clear-level result | Same workaround offered as a button ("Retry as NIST Clear"); result labelled **Clear** | Kiosk + engine | V1 |
