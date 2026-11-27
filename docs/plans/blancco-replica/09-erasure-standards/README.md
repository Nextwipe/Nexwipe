# Plan — Step 9 — Erasure standards and their exact steps

Mirrors: research [09-erasure-standards/README.md](../../../research/blancco-drive-eraser/09-erasure-standards/README.md)

## In short
NexWipe Eraser ships the **same 33 standards** with the **same steps in the same order** as Blancco. Each standard is a
small data file (`standards/<id>.yaml` inside the eraser) that the engine runs step by step — no standard is hand-coded.
Overwrite passes are run by the overwrite engine ([overwrite-engine.md](overwrite-engine.md)); firmware commands (the
drive erasing itself) and their fallback chains are run by the firmware module ([firmware-commands.md](firmware-commands.md)).
The report always states the NIST level **actually reached** (Purge / Clear / none), never more.

Jargon used here: **overwrite pass** = writing a pattern over every sector; **firmware command** = an instruction the
drive's own controller executes (it can reach spare flash cells software can't); **fallback order** = "if the drive
doesn't support command A, try B"; **HPA/DCO/AMA** = hidden areas at the end of a drive that hide sectors from the computer.

Every standard below is phase **V1** (it runs on the SATA/NVMe/eMMC drives found in Windows laptops and desktops).
The **SCSI/SAS** branches inside a standard are **Later** (server drives), but the standard file contains them from day one
so the step list is identical to Blancco's.

## 9.1 List of standards and rounds (§4.2.3.3.1, p.39–40)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "Supports more than 20 erasure standards" | Same 33 standards, listed below | One YAML file per standard in the eraser image; a unit test per file checks the exact step list per drive type | V1 |
| List can be narrowed in CT | Same: company ticks which standards technicians may see | Stick setup page (Prepare stick section) → "Allowed standards" checklist → baked into signed `nexwipe-setup.json`; eraser hides the rest | V1 |

| # | Standard (Blancco) | Rounds | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| 1 | Air Force System Security Instruction 5020 | 4 | `afssi-5020.yaml`, 4 rounds (steps in 9.3) | V1 |
| 2 | Aperiodic random overwrite | 1 | `aperiodic-random.yaml`, 1 round | V1 |
| 3 | Blancco SSD Erasure | 2+ * | **NexWipe SSD method** (`nexwipe-ssd.yaml`), 2+ rounds incl. firmware step (see 9.5) | V1 |
| 4 | Bruce Schneier's Algorithm | 7 | `schneier.yaml`, 7 rounds | V1 |
| 5 | BSI-2011-VS | 1–2 * | `bsi-2011-vs.yaml`, 1–2 rounds incl. firmware step | V1 |
| 6 | BSI-GS | 1–2 * | `bsi-gs.yaml`, 1–2 rounds incl. firmware step | V1 |
| 7 | BSI-GSE | 2–3 * | `bsi-gse.yaml`, 2–3 rounds incl. firmware step | V1 |
| 8 | BSI-GSK | 1 | `bsi-gsk.yaml`, 1 round | V1 |
| 9 | CESG CPA – Higher Level | 3 | `cesg-cpa-higher.yaml`, 3 rounds | V1 |
| 10 | Sanitize Cryptographic Erasure | 0 ** | `sanitize-crypto.yaml`, 0 rounds (firmware only, see 9.6) | V1 |
| 11 | GB46864-2025 | HDD 3, SSD 2 | `gb46864-2025.yaml`, HDD branch 3 rounds, SSD branch 2 | V1 |
| 12 | DoD 5220.22-M | 3 | `dod-5220-22-m.yaml`, 3 rounds | V1 |
| 13 | DoD 5220.22-M ECE | 7 | `dod-5220-22-m-ece.yaml`, 7 rounds | V1 |
| 14 | IEEE 2883-2022 Clear | 0–1 * | `ieee-2883-clear.yaml`, 0–1 rounds incl. firmware step | V1 |
| 15 | IEEE 2883-2022 Purge | 0 * | `ieee-2883-purge.yaml`, 0 rounds, firmware step | V1 |
| 16 | NIST 800-88 Clear *** | 0–1 * | `nist-clear.yaml`, 0–1 rounds incl. firmware step; overwrite type Static or Aperiodic random | V1 |
| 17 | NIST 800-88 Purge | 0 * | `nist-purge.yaml`, 0 rounds, firmware step | V1 |
| 18 | NIST 800-88 r2 Clear [only static pattern] | 0–1 * | `nist-r2-clear.yaml`, 0–1 rounds, static pattern only | V1 |
| 19 | NIST 800-88 r2 Purge | 0 * | `nist-r2-purge.yaml`, 0 rounds, firmware step | V1 |
| 20 | NIST 800-88 | 0–1 * | `nist-800-88.yaml` (Purge chain + full overwrite), 0–1 rounds | V1 |
| 21 | Firmware Based Erasure | 0 * | `firmware-based.yaml`, 0 rounds, firmware step | V1 |
| 22 | Extended Firmware Based Erasure | 1 * | `firmware-based-extended.yaml`, 1 round + firmware step | V1 |
| 23 | HMG Infosec Standard 5, Higher Standard | 3 | `hmg-is5-higher.yaml`, 3 rounds | V1 |
| 24 | HMG Infosec Standard 5, Lower Standard | 1 | `hmg-is5-lower.yaml`, 1 round | V1 |
| 25 | National Computer Security Center (NCSC-TG-025) | 4 | `ncsc-tg-025.yaml`, 4 rounds | V1 |
| 26 | Navy Staff Office Publication (NAVSOP-5239-26) | 3 | `navsop-5239-26.yaml`, 3 rounds | V1 |
| 27 | NSA 130-1 | 3 | `nsa-130-1.yaml`, 3 rounds | V1 |
| 28 | OPNAVINST 5239.1A | 3 | `opnavinst-5239-1a.yaml`, 3 rounds | V1 |
| 29 | Peter Gutmann's Algorithm | 35 | `gutmann.yaml`, 35 rounds | V1 |
| 30 | U.S. Army AR380-19 | 3 | `army-ar380-19.yaml`, 3 rounds | V1 |
| 31 | RCMP TSSIT OPS-II | 8 | `rcmp-tssit-ops-ii.yaml`; picker shows 8 rounds as Blancco lists it, engine runs the 7 overwrites listed in 9.3 (see note) | V1 |
| 32 | Random byte overwrite (3x) | 3 | `random-byte-3x.yaml`, 3 rounds | V1 |
| 33 | TCG Cryptographic Erasure | 1 | `tcg-crypto.yaml`, 1 round as Blancco lists it (steps in 9.4) | V1 |

| Footnote (Blancco) | NexWipe builds (same) | Phase |
|---|---|---|
| \* includes a firmware-based erasure step | Same marker in the standard picker (an icon "includes drive's own erase command") | V1 |
| \** see Sanitize Cryptographic Erasure | Same link to the 9.6 explanation in the picker's help text | V1 |
| \*** NIST Clear lets you pick overwrite type Static or Aperiodic random | Same choice on the NIST Clear row (default Static 0x00); stored in the standard's options | V1 |

Notes: Blancco's table lists Gutmann as 35 rounds while its step list (9.3) has 36 steps (35 overwrites + verify) —
NexWipe shows the same "35" and runs the same list. RCMP is listed as 8 rounds but its step list has 7 overwrites + verify —
NexWipe shows "8" and runs the listed steps; what Blancco counts as the 8th round is to be confirmed in lab.

## 9.2 Abbreviations (§18.1, p.189)

| Blancco abbreviation | NexWipe uses (same meaning) | Plain English | Phase |
|---|---|---|---|
| CE Crypto Erase | `CE` | drive throws away its internal encryption key, so old data becomes unreadable | V1 |
| ESE Enhanced Secure Erase | `ESE` | ATA command; drive erases user area and (vendor-defined) reallocated areas | V1 |
| SA Sanitize | `SA` | eMMC sanitize command | V1 |
| SE Secure Erase | `SE` | ATA (or eMMC) secure erase command | V1 |
| FU Format Unit | `FU` | SCSI/SAS low-level format | Later |
| BE Block Erase | `BE` | erase all flash blocks | V1 |
| SBE Sanitize Block Erase | `SBE` | sanitize variant that block-erases all flash incl. spare cells | V1 |
| OW Overwrite (firmware command) | `OW` / `SOW` | the drive overwrites itself (Sanitize Overwrite) | V1 |
| NF NVMe Format (user data erase or crypto erase, e.g. NF (CE)) | `NF(UDE)`, `NF(CE)` | NVMe Format with secure-erase setting 1 or 2 | V1 |
| RWP Reset Write Pointers | `RWP` | reset zones on zoned drives | V1 (rare on laptops) |
| → fallback order (e.g. ESE → SE) | Same arrow, same meaning; the engine tries left to right and stops at the first supported one | V1 |
| "Verify data*" = verification at the user-chosen percentage | Same; uses the verification slider (plan step 10) | V1 |
| "All verification algorithms … are NIST-based." | Same: NexWipe uses NIST sampling everywhere (plan step 10 §10.4) | V1 |

Exact Linux tool for each command: [firmware-commands.md](firmware-commands.md).

## 9.3 Magnetic (overwrite) standards (§18.2, p.189–192)
Each row is the exact pass list the engine runs (pattern generation and pass mechanics in [overwrite-engine.md](overwrite-engine.md)).
"verify" = final verification at the chosen percentage (plan step 10).

| Standard | Blancco steps | NexWipe builds (same steps) | Phase |
|---|---|---|---|
| HMG IS5 Lower | 0x00 → verify | same | V1 |
| HMG IS5 Higher | 0xAA → 0x55 → random byte → verify | same | V1 |
| CESG CPA Higher Level | 0xAA → verify → 0x55 → verify → random byte → verify | same (three verifications) | V1 |
| GB46864-2025 (HDD) | 0x00 → random pattern → 0xFF → verify | same | V1 |
| GB46864-2025 (SSD) | mandatory deallocation step → ATA: SBE → SOW → ESE → SE → regular OW; SCSI: SBE → SOW → FU → regular OW; NVMe: NF(User Data) → SBE → SOW → regular OW → verify | same; deallocation = TRIM/Deallocate over the whole drive (`blkdiscard`, confirm in lab); "regular OW" = engine overwrite used only if no firmware command in the chain is supported. ATA and NVMe branches V1; SCSI branch Later | V1 / Later (SCSI) |
| DoD 5220.22-M | 0x55 → 0xAA → random byte → verify | same | V1 |
| DoD 5220.22-M ECE | 0x55 → 0xAA → random byte → aperiodic random → 0x55 → 0xAA → random byte → verify | same | V1 |
| Bruce Schneier | 0xFF → 0x00 → 5× aperiodic random → verify | same | V1 |
| NAVSOP-5239-26 | 0xFFFFFFFF → 0xFFFFFFE4 → aperiodic random → verify | same (4-byte patterns repeated) | V1 |
| NCSC-TG-025 | 0x35 → 0xCA → 0x97 → aperiodic random → verify | same | V1 |
| AFSSI 5020 | 0x00 → 0xFF → 0x00 → 0xAA → verify | same | V1 |
| U.S. Army AR380-19 | random byte → 0xAA → 0x55 → verify | same | V1 |
| OPNAVINST 5239.1A | 0xFF → 0x00 → random byte → verify | same | V1 |
| NSA 130-1 | aperiodic random → aperiodic random → 0x00 → verify | same | V1 |
| Peter Gutmann | 4× aperiodic random → 0x555555 → 0xAAAAAA → 0x924924 → 0x492492 → 0x249249 → 0x00 → 0x11 → 0x22 → 0x33 → 0x44 → 0x55 → 0x66 → 0x77 → 0x88 → 0x99 → 0xAA → 0xBB → 0xCC → 0xDD → 0xEE → 0xFF → 0x924924 → 0x492492 → 0x249249 → 0x6DB6DB → 0xB6DB6D → 0xDB6DB6 → 4× aperiodic random → verify (36 steps) | same 36 steps (3-byte patterns repeated) | V1 |
| Aperiodic random overwrite | aperiodic random → verify | same | V1 |
| RCMP TSSIT OPS-II | 0x00 → 0xFF → 0x00 → 0xFF → 0x00 → 0xFF → random byte → verify | same | V1 |
| Random byte overwrite (3x) | 3× random byte → verify | same | V1 |

## 9.4 Firmware and forced standards (§18.3, p.192–194)
Command-by-command Linux detail, support checks and polling: [firmware-commands.md](firmware-commands.md).

| Standard | Blancco steps | NexWipe builds (same steps) | Phase |
|---|---|---|---|
| Sanitize Cryptographic Erasure | Sanitize CE → verify | same; verify = crypto-erase marker method (plan step 10 §10.5) | V1 |
| Firmware Based Erasure | ATA: ESE → SE; SCSI: FU → verify (pattern verification) | same | V1 / Later (SCSI) |
| Extended Firmware Based Erasure | overwrite 0xCB → ATA: ESE → SE; SCSI: FU → verify (pattern) | same | V1 / Later (SCSI) |
| TCG Cryptographic Erasure | TCG CE → verify | same; TCG CE via `sedutil-cli` on self-encrypting (Opal) drives | V1 |
| BSI-2011-VS | BSI random pattern erasure → 100% verification for presence of BSI random pattern → ESE → SE → overwrite 0x00 → verify 5% (or more) → reset Master Boot Record | same 7 steps; the first verify is fixed at 100% regardless of slider; second verify uses slider with 5% minimum; "reset MBR" = write an empty partition table to sector 0 (confirm exact content in lab) | V1 |
| BSI-GS | remove HPA/DCO → aperiodic random → ATA: ESE → SE → 0x00; SCSI: FU → 0x00 → verify (pattern) | same; hidden-area removal from plan step 7/8 | V1 / Later (SCSI) |
| BSI-GSE | remove HPA/DCO → aperiodic random → aperiodic random → ATA: ESE → SE → 0x00; SCSI: FU → 0x00 → verify (pattern) | same | V1 / Later (SCSI) |
| BSI-GSK | aperiodic random → verify | same | V1 |

### NIST 800-88 (r1 family)

| Standard | Blancco step 1 | Blancco step 2 | Blancco step 3 | NexWipe builds (same) | Phase |
|---|---|---|---|---|---|
| **NIST 800-88 Clear** | remove HPA/DCO (if existing) | ATA SSD: **SE → overwrite 0x00/configured pattern**; other drives: overwrite 0x00/configured pattern; removable flash: overwrite 0x00 **and** 0xFF | verify (pattern) | same 3 steps; "configured pattern" = Static/Aperiodic choice from 9.1 footnote; removable flash only if the company shows removable media (hidden by default; boot stick never) | V1 |
| **NIST 800-88 Purge** | remove HPA/DCO | ATA SSD: **SBE → TCG CE → Sanitize CE**; ATA HDD: **TCG CE → Sanitize CE → Sanitize OW → ESE → SE**; SCSI SSD: SBE → TCG CE → Sanitize CE; SCSI HDD: TCG CE → Sanitize CE → Sanitize OW; **NVMe: NF(user data erase) → SBE → TCG CE → NF(CE) → Sanitize CE → Sanitize OW**; eMMC: SA → SE | verify | same chains, same order; SCSI chains Later | V1 / Later (SCSI) |
| NIST 800-88 | remove HPA/DCO | same chains as Purge, each followed by **full overwrite** (eMMC: SA → SE → full overwrite) | verify | same; full overwrite = engine pass 0x00 over every sector (confirm pattern choice: research says "full overwrite" only) | V1 / Later (SCSI) |

### IEEE 2883-2022 and NIST 800-88 r2

| Step | Blancco: IEEE 2883 Clear / NIST r2 Clear | Blancco: IEEE 2883 Purge / NIST r2 Purge | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| 1 | remove HPA/DCO/AMA (if exists) | same | same; AMA = ATA Accessible Max Address, removed like HPA (plan step 7) | V1 |
| 2 | restore depopulated storage elements (if exist) | same | same; detect "storage element depopulation" (plan step 5) and restore via the drive's restore command (confirm in lab; rare in laptops) | V1 |
| 3 | write random data samples for verification step | same | same: write marker samples before the firmware step (plan step 10 §10.3) | V1 |
| 4 ATA | TCG Unmap → TCG RWP → TCG BE → TCG OW → overwrite 0x00 → SE | TCG CE → Sanitize CE → Sanitize BE → Sanitize OW → ESE | same order; exact command behind each "TCG Unmap/RWP/BE/OW" name taken from the public IEEE 2883-2022 text (confirm in lab) | V1 |
| 4 SCSI | TCG Unmap → TCG RWP → TCG BE → TCG OW → FU → overwrite 0x00 | TCG CE → Sanitize CE → Sanitize BE → Sanitize OW | same | Later |
| 4 NVMe | TCG Unmap → TCG RWP → TCG BE → TCG OW → NF(user data erase) → overwrite 0x00 | IEEE: Sanitize CE → Sanitize BE → Sanitize OW → TCG CE → NF(CE); NIST r2: Sanitize CE → Sanitize BE → Sanitize OW → TCG CE | same, including the one difference (IEEE Purge ends with NF(CE), NIST r2 Purge does not) | V1 |
| 5 | verify | verify | same | V1 |
| 6 | NVMe: disable and overwrite HMB (host memory buffer) if supported and enabled | same | same; HMB = part of the laptop's RAM the NVMe drive borrows; disable via NVMe Set Features (feature 0x0D) then overwrite (confirm in lab) | V1 |
| 7 | NVMe: overwrite CMB (controller memory buffer) if supported | same | same; CMB rare on laptop drives (confirm in lab) | V1 |

| Blancco note | NexWipe builds (same) | Phase |
|---|---|---|
| "The newer NIST 800-88r2 standards are similar to the IEEE 2883-2022 standards." | Same: shared step files, differing only where the table differs | V1 |
| NIST r2 Clear allows only a static pattern | Same: r2 Clear hides the Aperiodic option | V1 |
| If NVMe Format commands run under IEEE 2883-2022 Purge, report says "Sanitization includes vendor-specific purge commands" and purge "might not be achieved" — confirm with vendor (§4.2.3.3) | Same rule, own wording: report note "Purge used NVMe Format, whose strength is vendor-defined; Purge may not be reached — confirm with the drive maker"; level shown as "Purge (vendor-dependent)" | V1 |

## 9.5 Blancco SSD Erasure (§18.4, §16, §17.4)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Steps: "Proprietary process" — "Contact Blancco for more information." Rounds "2+", includes firmware step | **NexWipe SSD method**, built only from public steps, 2+ rounds incl. firmware step: (1) remove hidden areas → (2) strongest supported firmware purge (SBE → Sanitize CE → TCG CE → NF(CE) → NF(UDE)) → (3) one aperiodic random overwrite of the whole drive → (4) second firmware erase if supported → (5) verify ≥10% | `nexwipe-ssd.yaml`; steps published in our docs (no secret recipe) | V1 |
| Recommended by Blancco for SSDs and NVMe (§8.3) | Same: marked "Recommended for SSD/NVMe" in the picker | Picker label | V1 |
| Designed for ATA and SCSI SSDs "that … support the firmware based erasure commands" (§16.1); older KB: "ATA or SAS based interface" | Same: ATA and NVMe in V1; SAS later | Support check before start | V1 / Later (SAS) |
| Includes remapped-sector erasure de facto (§7.8) | Same: the firmware step counts as remapped-sector erasure; no extra step added (plan step 8 §8.3) | Flag in standard file | V1 |
| If the drive doesn't support the firmware command → can't be used (shown in UI) | Same: method greyed out on that drive with the reason | Detection result (plan step 5) | V1 |
| Freeze lock not removable → fails | Same: Not erased with reason "Freeze lock could not be removed" | Freeze-lock removal (plan step 7) | V1 |
| Choosing another standard for an SSD is allowed, but the report gets a message that an SSD was erased | Same, own wording: "Flash drive (SSD/eMMC/NVMe) erased with a Clear-level standard" | Exception catalogue (plan step 11 §11.7) | V1 |
| NIST compliance depends on firmware | Same: level computed from which command actually succeeded | Result rules (plan step 11) | V1 |
| SSDs supporting Sanitize → Purge; report "Exceeds NIST 800-88 Purge" (ATA/SCSI via Sanitize or TCG) | Same level, honest wording: "NIST 800-88 Purge level reached" (we don't say "exceeds") | Report | V1 |
| Older SSDs with only Secure Erase → Clear; report "Exceeds NIST 800-88 Clear" | Same: "NIST 800-88 Clear level reached (drive supports only Secure Erase)" | Report | V1 |
| NVMe → "Exceeds NIST 800-88 Purge" | Same rule when a Sanitize/Format-crypto command succeeded: "NIST 800-88 Purge level reached"; if only NF(UDE) succeeded, add the vendor-dependent note from 9.4 | Report | V1 |
| eMMC via MMC Sanitize → "Exceeds NIST 800-88 Purge" | Same: "NIST 800-88 Purge level reached (eMMC Sanitize)" | Report | V1 |
| HDD → no extra message; works but other standards should be preferred | Same: no extra message on HDDs; picker hint "for spinning drives prefer an overwrite standard" | Picker hint | V1 |

## 9.6 Sanitize Cryptographic Erasure (§7.24, p.95–96)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Introduced in 6.1.1 | n/a for NexWipe — Blancco release number; NexWipe has it from V1 | — | V1 |
| Only on drives supporting the command | Same: offered only if detection shows Sanitize Crypto support | Detection (plan step 5) | V1 |
| Drive "self-generates a new media encryption key"; old data not overwritten, just undecipherable | Same behaviour, explained in plain words in the picker help | Firmware module | V1 |
| Caveat: implementation mistakes or future advances could allow reconstruction by recovering the key or breaking the encryption | Same caveat, own wording, in help and in the report note | Help text | V1 |
| Report exception: "Device has been cryptographically erased, see manual for more information." | Same exception, own wording: "Drive was cryptographically erased — see the NexWipe guide" | Exception catalogue | V1 |
| Verified by writing a known pattern at pseudo-random spots before, checking it's gone after (1–100%, default 1%) | Same method, same 1–100% range, same default 1% | Plan step 10 §10.5 | V1 |
| Very fast (minutes even on large drives) | Same; progress shows "usually a few minutes" | UI | V1 |
| Recommended for quick redeployment inside the same company or before shipping for a traditional erasure | Same recommendation in help text | Help text | V1 |

## 9.7 What NIST requires and what BDE supports (§17, p.186–187)

### SSDs
| Drive | Blancco Clear | Blancco Purge | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| ATA | normal overwrite or Secure Erase — Yes (SE attempted by default, overwrite if unsupported) | Block Erase or Crypto Erase — Yes, only with ATA SANITIZE Block Erase, ATA SANITIZE Crypto Erase and/or TCG Crypto Erase, in "NIST 800-88 Purge" | Same: Clear tries SE first then overwrite; Purge only via those three commands | V1 |
| SCSI/SAS | normal overwrite — Yes | Block Erase or Crypto Erase — Yes with SCSI SANITIZE BE/CE and/or TCG CE | Same | Later |
| NVMe | normal overwrite — Yes | Format Unit or Crypto Erase — Yes with NVMe Format User Data Erase, NVMe Format Crypto Erase, NVMe SANITIZE Block Erase / Crypto Erase / Overwrite and/or TCG CE | Same | V1 |
| eMMC | normal overwrite — Yes | Sanitize or Secure Erase — Yes, depends on host hardware and manufacturer | Same; report notes that eMMC Purge depends on the host and maker | V1 |

### HDDs
| Drive | Blancco Clear | Blancco Purge | NexWipe builds (same) | Phase |
|---|---|---|---|---|
| ATA | normal overwrite — Yes | firmware overwrite / crypto erase / Secure Erase — Yes with ATA SANITIZE Overwrite, ATA SANITIZE Crypto Erase, ATA (Enhanced) Secure Erase and/or TCG CE | Same | V1 |
| SCSI/SAS | normal overwrite — Yes | Yes with SCSI SANITIZE Overwrite, SCSI SANITIZE CE and/or TCG CE | Same | Later |

| Blancco rule | NexWipe builds (same) | Phase |
|---|---|---|
| Purge reached on SSD/eMMC/NVMe via NIST Purge or Blancco SSD Erasure → no special exception | Same: Purge via NIST Purge or NexWipe SSD method → no flash exception | V1 |
| Success via a clear-level standard → exception "Device is SSD/eMMC/NVMe, see manual for more information" | Same exception, own wording (see 9.5) | V1 |
| Corner case: TCG Crypto Erasure with 10%+ verification on an SSD reaches Purge but the exception is still shown | Same behaviour kept for parity, plus a note "Purge level reached by TCG crypto erase with ≥10% verification" so the report is not misleading | V1 |

## 9.8 Resume after interruption (§7.10, p.86)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| CT feature | Same: "Resume after interruption" switch on the Stick setup page | `nexwipe-setup.json` | V1 |
| Needs a non-full USB stick plugged in during erasure (a few KB per drive) | Same idea: progress file (a few KB per drive) written to the NEXWIPE stick's state partition — no second stick needed; if the state area is full, resume is off and the screen says so | Engine writes `resume/<drive-serial>.json` after each step starts | V1 |
| Resumes at the start of the step where it was interrupted (e.g. Gutmann step 7 at 50% → restart step 7) | Same | Engine reads the progress file at boot, matches drive serial + standard, asks the technician to resume | V1 |
| **Only magnetic standards** | Same: resume only for the 9.3 overwrite standards (not GB46864 SSD branch) | Flag in standard file | V1 |
| Warning (§1): shutting down, exiting, disconnecting or pausing/cancelling during NIST Purge-ATA, BSI-GS/E, (Extended) Firmware based erasure or Blancco SSD Erasure can damage the drive | Same warning on screen for NIST Purge (ATA), BSI-GS, BSI-GSE, Firmware Based, Extended Firmware Based and NexWipe SSD method; Pause/Cancel buttons disabled while a firmware command runs | Safety rules ([safety-rules.md](../before-we-start/safety-rules.md) rule 5) | V1 |
