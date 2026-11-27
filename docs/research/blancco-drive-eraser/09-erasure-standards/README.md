# Step 9 — Erasure standards and their exact steps

## In short
An erasure standard is a fixed recipe of steps: overwrite passes with given patterns, firmware commands the drive
executes itself, hidden-area removal and a verification. For flash drives (SSD/NVMe/eMMC) the firmware commands
matter most, and each standard lists them in **fallback order** — if the drive doesn't support one, the next is tried.
Which NIST level is actually reached depends on what the drive's firmware supports.

## 9.1 List of standards and rounds (§4.2.3.3.1, p.39–40)
"Blancco Drive Eraser supports more than 20 erasure standards." The list can be narrowed in CT.

| Standard | Overwriting rounds |
|---|---|
| Air Force System Security Instruction 5020 | 4 |
| Aperiodic random overwrite | 1 |
| Blancco SSD Erasure | 2+ * |
| Bruce Schneier's Algorithm | 7 |
| BSI-2011-VS | 1–2 * |
| BSI-GS | 1–2 * |
| BSI-GSE | 2–3 * |
| BSI-GSK | 1 |
| CESG CPA – Higher Level | 3 |
| Sanitize Cryptographic Erasure | 0 ** |
| GB46864-2025 | HDD 3, SSD 2 |
| DoD 5220.22-M | 3 |
| DoD 5220.22-M ECE | 7 |
| IEEE 2883-2022 Clear | 0–1 * |
| IEEE 2883-2022 Purge | 0 * |
| NIST 800-88 Clear *** | 0–1 * |
| NIST 800-88 Purge | 0 * |
| NIST 800-88 r2 Clear [only static pattern] | 0–1 * |
| NIST 800-88 r2 Purge | 0 * |
| NIST 800-88 | 0–1 * |
| Firmware Based Erasure | 0 * |
| Extended Firmware Based Erasure | 1 * |
| HMG Infosec Standard 5, Higher Standard | 3 |
| HMG Infosec Standard 5, Lower Standard | 1 |
| National Computer Security Center (NCSC-TG-025) | 4 |
| Navy Staff Office Publication (NAVSOP-5239-26) | 3 |
| NSA 130-1 | 3 |
| OPNAVINST 5239.1A | 3 |
| Peter Gutmann's Algorithm | 35 |
| U.S. Army AR380-19 | 3 |
| RCMP TSSIT OPS-II | 8 |
| Random byte overwrite (3x) | 3 |
| TCG Cryptographic Erasure | 1 |

\* includes a firmware-based erasure step. \** see Sanitize Cryptographic Erasure. \*** NIST Clear lets you pick
overwrite type Static or Aperiodic random.

## 9.2 Abbreviations (§18.1, p.189)
CE Crypto Erase · ESE Enhanced Secure Erase · SA Sanitize · SE Secure Erase · FU Format Unit · BE Block Erase ·
SBE Sanitize Block Erase · OW Overwrite (firmware command) · NF NVMe Format (user data erase or crypto erase, e.g. NF (CE)) ·
RWP Reset Write Pointers · → fallback order (e.g. ESE → SE).
"Verify data*" = verification at the user-chosen percentage. "All verification algorithms … are NIST-based."

## 9.3 Magnetic (overwrite) standards (§18.2, p.189–192)

| Standard | Steps |
|---|---|
| HMG IS5 Lower | 0x00 → verify |
| HMG IS5 Higher | 0xAA → 0x55 → random byte → verify |
| CESG CPA Higher Level | 0xAA → verify → 0x55 → verify → random byte → verify |
| GB46864-2025 (HDD) | 0x00 → random pattern → 0xFF → verify |
| GB46864-2025 (SSD) | mandatory deallocation step → ATA: SBE → SOW → ESE → SE → regular OW; SCSI: SBE → SOW → FU → regular OW; NVMe: NF(User Data) → SBE → SOW → regular OW → verify |
| DoD 5220.22-M | 0x55 → 0xAA → random byte → verify |
| DoD 5220.22-M ECE | 0x55 → 0xAA → random byte → aperiodic random → 0x55 → 0xAA → random byte → verify |
| Bruce Schneier | 0xFF → 0x00 → 5× aperiodic random → verify |
| NAVSOP-5239-26 | 0xFFFFFFFF → 0xFFFFFFE4 → aperiodic random → verify |
| NCSC-TG-025 | 0x35 → 0xCA → 0x97 → aperiodic random → verify |
| AFSSI 5020 | 0x00 → 0xFF → 0x00 → 0xAA → verify |
| U.S. Army AR380-19 | random byte → 0xAA → 0x55 → verify |
| OPNAVINST 5239.1A | 0xFF → 0x00 → random byte → verify |
| NSA 130-1 | aperiodic random → aperiodic random → 0x00 → verify |
| Peter Gutmann | 4× aperiodic random → 0x555555 → 0xAAAAAA → 0x924924 → 0x492492 → 0x249249 → 0x00 → 0x11 → 0x22 → 0x33 → 0x44 → 0x55 → 0x66 → 0x77 → 0x88 → 0x99 → 0xAA → 0xBB → 0xCC → 0xDD → 0xEE → 0xFF → 0x924924 → 0x492492 → 0x249249 → 0x6DB6DB → 0xB6DB6D → 0xDB6DB6 → 4× aperiodic random → verify (36 steps) |
| Aperiodic random overwrite | aperiodic random → verify |
| RCMP TSSIT OPS-II | 0x00 → 0xFF → 0x00 → 0xFF → 0x00 → 0xFF → random byte → verify |
| Random byte overwrite (3x) | 3× random byte → verify |

## 9.4 Firmware and forced standards (§18.3, p.192–194)

| Standard | Steps |
|---|---|
| Sanitize Cryptographic Erasure | Sanitize CE → verify |
| Firmware Based Erasure | ATA: ESE → SE; SCSI: FU → verify (pattern verification) |
| Extended Firmware Based Erasure | overwrite 0xCB → ATA: ESE → SE; SCSI: FU → verify (pattern) |
| TCG Cryptographic Erasure | TCG CE → verify |
| BSI-2011-VS | BSI random pattern erasure → 100% verification for presence of BSI random pattern → ESE → SE → overwrite 0x00 → verify 5% (or more) → reset Master Boot Record |
| BSI-GS | remove HPA/DCO → aperiodic random → ATA: ESE → SE → 0x00; SCSI: FU → 0x00 → verify (pattern) |
| BSI-GSE | remove HPA/DCO → aperiodic random → aperiodic random → ATA: ESE → SE → 0x00; SCSI: FU → 0x00 → verify (pattern) |
| BSI-GSK | aperiodic random → verify |

### NIST 800-88 (r1 family)
| Standard | Step 1 | Step 2 | Step 3 |
|---|---|---|---|
| **NIST 800-88 Clear** | remove HPA/DCO (if existing) | ATA SSD: **SE → overwrite 0x00/configured pattern**; other drives: overwrite 0x00/configured pattern; removable flash: overwrite 0x00 **and** 0xFF | verify (pattern) |
| **NIST 800-88 Purge** | remove HPA/DCO | ATA SSD: **SBE → TCG CE → Sanitize CE**; ATA HDD: **TCG CE → Sanitize CE → Sanitize OW → ESE → SE**; SCSI SSD: SBE → TCG CE → Sanitize CE; SCSI HDD: TCG CE → Sanitize CE → Sanitize OW; **NVMe: NF(user data erase) → SBE → TCG CE → NF(CE) → Sanitize CE → Sanitize OW**; eMMC: SA → SE | verify |
| NIST 800-88 | remove HPA/DCO | same chains as Purge, each followed by **full overwrite** (eMMC: SA → SE → full overwrite) | verify |

### IEEE 2883-2022 and NIST 800-88 r2
| Step | IEEE 2883 Clear / NIST r2 Clear | IEEE 2883 Purge / NIST r2 Purge |
|---|---|---|
| 1 | remove HPA/DCO/AMA (if exists) | same |
| 2 | restore depopulated storage elements (if exist) | same |
| 3 | write random data samples for verification step | same |
| 4 ATA | TCG Unmap → TCG RWP → TCG BE → TCG OW → overwrite 0x00 → SE | TCG CE → Sanitize CE → Sanitize BE → Sanitize OW → ESE |
| 4 SCSI | TCG Unmap → TCG RWP → TCG BE → TCG OW → FU → overwrite 0x00 | TCG CE → Sanitize CE → Sanitize BE → Sanitize OW |
| 4 NVMe | TCG Unmap → TCG RWP → TCG BE → TCG OW → NF(user data erase) → overwrite 0x00 | IEEE: Sanitize CE → Sanitize BE → Sanitize OW → TCG CE → NF(CE); NIST r2: Sanitize CE → Sanitize BE → Sanitize OW → TCG CE |
| 5 | verify | verify |
| 6 | NVMe: disable and overwrite HMB (host memory buffer) if supported and enabled | same |
| 7 | NVMe: overwrite CMB (controller memory buffer) if supported | same |

"The newer NIST 800-88r2 standards are similar to the IEEE 2883-2022 standards." NIST r2 Clear allows only a static pattern.
If NVMe Format commands run under IEEE 2883-2022 Purge, the report says "Sanitization includes vendor-specific purge
commands" and purge "might not be achieved" — confirm with the drive vendor (§4.2.3.3).

## 9.5 Blancco SSD Erasure (§18.4, §16, §17.4)
- Steps: **"Proprietary process" — "Contact Blancco for more information."** (p.194). Rounds "2+", includes firmware step.
- Recommended by Blancco for SSDs and NVMe (§8.3); designed for ATA and SCSI SSDs "that … support the firmware based
  erasure commands" (§16.1). Older KB: "ATA or SAS based interface".
- Includes remapped-sector erasure de facto (§7.8).
- If the drive doesn't support the firmware command → can't be used (shown in UI). Freeze lock not removable → fails.
- Choosing another standard for an SSD is allowed, but the report gets a message that an SSD was erased.
- NIST compliance depends on firmware:
  - SSDs supporting Sanitize → Purge; report "Exceeds NIST 800-88 Purge" (ATA/SCSI via Sanitize or TCG).
  - Older SSDs with only Secure Erase → Clear; report "Exceeds NIST 800-88 Clear".
  - NVMe → "Exceeds NIST 800-88 Purge". eMMC via MMC Sanitize → "Exceeds NIST 800-88 Purge".
  - HDD → no extra message; works but other standards should be preferred for magnetic drives.

## 9.6 Sanitize Cryptographic Erasure (§7.24, p.95–96)
- Introduced in 6.1.1. Only on drives supporting the command.
- The drive "self-generates a new media encryption key"; old data not overwritten, just undecipherable.
- Manual's caveat: "mistakes in the implementation of the crypto-system or future advances in technology could allow
  for the reconstruction of data by recovering the key or breaking the encryption algorithm."
- Report exception: "Device has been cryptographically erased, see manual for more information."
- Verified by writing a known pattern at pseudo-random spots before the command and checking it's gone after (1–100%, default 1%).
- Very fast (minutes even on large drives). Blancco recommends it for quick redeployment inside the same company
  (same or higher security level) or before shipping somewhere for a traditional erasure.

## 9.7 What NIST requires and what BDE supports (§17, p.186–187)

### SSDs
| Drive | Clear | Purge |
|---|---|---|
| ATA | normal overwrite or Secure Erase — Yes (SE attempted by default, overwrite if unsupported) | Block Erase or Crypto Erase — Yes, only with ATA SANITIZE Block Erase, ATA SANITIZE Crypto Erase and/or TCG Crypto Erase, in "NIST 800-88 Purge" |
| SCSI/SAS | normal overwrite — Yes | Block Erase or Crypto Erase — Yes with SCSI SANITIZE BE/CE and/or TCG CE |
| NVMe | normal overwrite — Yes | Format Unit or Crypto Erase — Yes with NVMe Format User Data Erase, NVMe Format Crypto Erase, NVMe SANITIZE Block Erase / Crypto Erase / Overwrite and/or TCG CE |
| eMMC | normal overwrite — Yes | Sanitize or Secure Erase — Yes, depends on host hardware and manufacturer |

### HDDs
| Drive | Clear | Purge |
|---|---|---|
| ATA | normal overwrite — Yes | firmware overwrite / crypto erase / Secure Erase — Yes with ATA SANITIZE Overwrite, ATA SANITIZE Crypto Erase, ATA (Enhanced) Secure Erase and/or TCG CE |
| SCSI/SAS | normal overwrite — Yes | Yes with SCSI SANITIZE Overwrite, SCSI SANITIZE CE and/or TCG CE |

- Whenever Purge is reached on SSD/eMMC/NVMe via NIST Purge or Blancco SSD Erasure → no special exception.
- If success is via a clear-level standard → exception "Device is SSD/eMMC/NVMe, see manual for more information".
- Corner case: TCG Crypto Erasure with 10%+ verification on an SSD reaches Purge but the exception is still shown.

## 9.8 Resume after interruption (§7.10, p.86)
CT feature; needs a non-full USB stick plugged in during erasure (a few KB per drive). Resumes at the start of the
step where it was interrupted (e.g. Gutmann step 7 at 50% → restart step 7). **Only magnetic standards.**
Warning (§1): shutting down, exiting, disconnecting or pausing/cancelling during NIST Purge-ATA, BSI-GS/E,
(Extended) Firmware based erasure or Blancco SSD Erasure can damage the drive.
