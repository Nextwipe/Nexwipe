# Plan — Step 9 (extra) — Firmware commands (the drive erases itself)

Mirrors: research [09-erasure-standards/README.md](../../../research/blancco-drive-eraser/09-erasure-standards/README.md)
§9.2, §9.4, §9.5, §9.6, §9.7 (command names and fallback chains), plus the failure messages in
[11-errors-and-result/README.md](../../../research/blancco-drive-eraser/11-errors-and-result/README.md) §11.6 and the
"Configure firmware-based commands" setting in [08-erasure-settings/README.md](../../../research/blancco-drive-eraser/08-erasure-settings/README.md) §8.2

## In short
On SSD, NVMe and eMMC drives, writing from outside cannot reach the spare flash cells the drive keeps hidden; only the
drive's own built-in commands can. These commands are what make **NIST Purge** possible. NexWipe Eraser's firmware module
sends exactly the commands each standard lists, in the **same fallback order**, after checking the drive supports each one,
waits for the drive to finish (no pause or cancel), and records which command actually succeeded — that decides the
level the report states. Every Linux command below must be confirmed on a DISPOSABLE lab drive before it is used for real.

There is no separate Blancco research page for commands; this file lists every command named in the research chains and
says how NexWipe runs it. The Linux syntax is our engineering work, marked "(confirm in lab)" where not yet tested.

## Every command named in the research (§9.2 abbreviations, §9.4 chains, §9.7)

### ATA / SATA (laptop SATA SSDs and HDDs) — V1

| Research name | What the drive does | Support check | Linux command (confirm in lab) | Phase |
|---|---|---|---|---|
| SE (Secure Erase) | Erases the user area | `hdparm -I`: Security "supported", "not frozen"; time estimate "…min for SECURITY ERASE UNIT" | `hdparm --user-master u --security-set-pass <tmp> /dev/sdX` then `hdparm --user-master u --security-erase <tmp> /dev/sdX` | V1 |
| ESE (Enhanced Secure Erase) | Also erases reallocated areas (vendor-defined) | `hdparm -I`: "supported: enhanced erase" + time estimate | same set-pass, then `--security-erase-enhanced <tmp>` | V1 |
| SBE (Sanitize Block Erase) | Block-erases all flash incl. spare cells | `hdparm -I`: SANITIZE feature set, "BLOCK_ERASE_EXT" | `hdparm --yes-i-know-what-i-am-doing --sanitize-block-erase /dev/sdX` | V1 |
| Sanitize CE (Sanitize Crypto Erase) | Changes the internal encryption key | `hdparm -I`: "CRYPTO_SCRAMBLE_EXT" | `hdparm --yes-i-know-what-i-am-doing --sanitize-crypto-scramble /dev/sdX` | V1 |
| Sanitize OW / SOW (Sanitize Overwrite) | Drive overwrites itself (mainly HDDs) | `hdparm -I`: "OVERWRITE_EXT" | `hdparm --yes-i-know-what-i-am-doing --sanitize-overwrite hex:00000000 /dev/sdX` | V1 |
| Sanitize BE (in IEEE/NIST r2 chains) | Same as SBE | as SBE | as SBE | V1 |
| Sanitize status polling | Drive reports progress | — | `hdparm --sanitize-status /dev/sdX` every few seconds | V1 |
| TCG CE (TCG Crypto Erase) | Self-encrypting (Opal) drive regenerates its key | `sedutil-cli --scan` / `--query` shows Opal | `sedutil-cli --revertTPer <SID/MSID> /dev/sdX` when the drive still has its factory password; owned drives need PSID revert (plan step 7) | V1 |
| TCG Unmap, TCG RWP, TCG BE, TCG OW (IEEE/NIST r2 Clear chains) | As named in the research | Mapped from the public IEEE 2883-2022 text (confirm in lab) | Unmap ≈ `blkdiscard /dev/sdX` (TRIM); RWP ≈ `blkzone reset` on zoned drives only; BE/OW ≈ Sanitize Block Erase / Overwrite (confirm in lab) | V1 |
| Deallocation (GB46864-2025 SSD "mandatory deallocation step") | Tells the drive every block is unused | `hdparm -I`: "Data Set Management TRIM supported" | `blkdiscard /dev/sdX` | V1 |
| Remove HPA | Unhides sectors at the end | `hdparm -N /dev/sdX` | `hdparm -N p<native-max> --yes-i-know-what-i-am-doing /dev/sdX` (plan step 7) | V1 |
| Remove DCO | Restores factory-reported size/features | `hdparm --dco-identify /dev/sdX` | `hdparm --yes-i-know-what-i-am-doing --dco-restore /dev/sdX` | V1 |
| Remove AMA (Accessible Max Address) | Newer form of HPA | `hdparm -N` on drives with AMA (confirm in lab) | as HPA (confirm in lab) | V1 |
| Restore depopulated storage elements | Brings back disabled heads/areas | Detection (plan step 5) | ATA restore command (confirm in lab; mostly large HDDs) | V1 |

### NVMe (most modern laptops) — V1

| Research name | What the drive does | Support check | Linux command (confirm in lab) | Phase |
|---|---|---|---|---|
| NF(user data erase) / NF(UDE) | Format with secure erase setting 1 | `nvme id-ctrl`: Format NVM supported; `FNA` field | `nvme format /dev/nvme0n1 --ses=1` | V1 |
| NF(CE) (NVMe Format crypto erase) | Format with secure erase setting 2 | `nvme id-ctrl`: `FNA` crypto-erase bit | `nvme format /dev/nvme0n1 --ses=2` | V1 |
| SBE / Sanitize BE | Block erase of whole drive incl. spare | `nvme id-ctrl`: `SANICAP` block-erase bit | `nvme sanitize /dev/nvme0 --sanact=2` | V1 |
| Sanitize CE | Crypto erase of whole drive | `SANICAP` crypto bit | `nvme sanitize /dev/nvme0 --sanact=4` | V1 |
| Sanitize OW | Drive overwrites itself | `SANICAP` overwrite bit | `nvme sanitize /dev/nvme0 --sanact=3 --ovrpat=0` | V1 |
| Sanitize polling | Progress and estimated time | — | `nvme sanitize-log /dev/nvme0` (status, progress, estimated times) | V1 |
| TCG CE | Opal NVMe key change | `sedutil-cli --scan` | as ATA TCG CE | V1 |
| TCG Unmap / RWP / BE / OW | As named in the research | IEEE 2883-2022 mapping (confirm in lab) | Unmap ≈ `blkdiscard` (NVMe Deallocate); RWP ≈ `blkzone reset` on zoned namespaces only; BE/OW ≈ sanitize 2/3 (confirm) | V1 |
| HMB disable and overwrite | Stop the drive borrowing laptop RAM, then clear that RAM | `nvme get-feature /dev/nvme0 -f 0x0d` | `nvme set-feature /dev/nvme0 -f 0x0d -v 0`; clearing the released RAM needs a design (confirm in lab) | V1 |
| CMB overwrite | Clear the drive's controller memory buffer | `nvme show-regs`: CMBSZ non-zero | write through the CMB memory window (confirm in lab; rare on laptops) | V1 |
| Every namespace | Commands run per namespace / per controller as each requires | `nvme list-ns` | report lists namespaces not erased (plan step 11 §11.7) | V1 |

### eMMC (cheap Windows laptops and tablets) — V1

| Research name | What the drive does | Support check | Linux command (confirm in lab) | Phase |
|---|---|---|---|---|
| SA (Sanitize) | Physically erases unmapped areas | `mmc extcsd read /dev/mmcblk0`: sanitize supported | `mmc sanitize /dev/mmcblk0` | V1 |
| SE (eMMC Secure Erase) | Secure erase of the range | EXT_CSD secure features | `mmc erase secure-erase 0 <last-sector> /dev/mmcblk0` | V1 |

### SCSI / SAS (servers) — Later

| Research name | Linux command (confirm in lab) | Phase |
|---|---|---|
| FU (Format Unit) | `sg_format --format /dev/sgX` | Later |
| SBE / Sanitize BE | `sg_sanitize --block /dev/sgX` | Later |
| Sanitize CE | `sg_sanitize --crypto /dev/sgX` | Later |
| Sanitize OW | `sg_sanitize --overwrite --pattern=<file> /dev/sgX` | Later |
| TCG CE | `sedutil-cli` (SAS SED) | Later |
| TCG Unmap / RWP / BE / OW | `sg_unmap`, `sg_zone --reset-all`, sanitize (confirm) | Later |
| WRITE SAME (research step 8, default On) | `sg_write_same` (overwrite engine) | Later |

## Fallback chains (exactly as the research lists them)
The firmware module walks each chain left to right, **skips** a command the drive does not support (or the company
disabled), runs the **first** supported one, and records it. If none is supported the step fails (mandatory) and the
drive is Not erased — except where the chain itself ends in a "regular OW" (engine overwrite).

| Standard | Interface | Chain (→ = fallback) | Phase |
|---|---|---|---|
| GB46864-2025 (SSD) | ATA | SBE → SOW → ESE → SE → regular OW | V1 |
| GB46864-2025 (SSD) | SCSI | SBE → SOW → FU → regular OW | Later |
| GB46864-2025 (SSD) | NVMe | NF(User Data) → SBE → SOW → regular OW | V1 |
| Sanitize Cryptographic Erasure | any | Sanitize CE | V1 |
| Firmware Based Erasure | ATA / SCSI | ESE → SE / FU | V1 / Later |
| Extended Firmware Based Erasure | ATA / SCSI | ESE → SE / FU (after 0xCB overwrite) | V1 / Later |
| TCG Cryptographic Erasure | any SED | TCG CE | V1 |
| BSI-2011-VS | ATA | ESE → SE | V1 |
| BSI-GS / BSI-GSE | ATA / SCSI | ESE → SE / FU (each followed by 0x00) | V1 / Later |
| NIST 800-88 Clear | ATA SSD | SE (then overwrite) | V1 |
| NIST 800-88 Purge | ATA SSD | SBE → TCG CE → Sanitize CE | V1 |
| NIST 800-88 Purge | ATA HDD | TCG CE → Sanitize CE → Sanitize OW → ESE → SE | V1 |
| NIST 800-88 Purge | SCSI SSD | SBE → TCG CE → Sanitize CE | Later |
| NIST 800-88 Purge | SCSI HDD | TCG CE → Sanitize CE → Sanitize OW | Later |
| NIST 800-88 Purge | NVMe | NF(user data erase) → SBE → TCG CE → NF(CE) → Sanitize CE → Sanitize OW | V1 |
| NIST 800-88 Purge | eMMC | SA → SE | V1 |
| NIST 800-88 | all | Purge chains above, each followed by full overwrite (eMMC: SA → SE → full overwrite) | V1 / Later (SCSI) |
| IEEE 2883 Clear / NIST r2 Clear | ATA | TCG Unmap → TCG RWP → TCG BE → TCG OW → overwrite 0x00 → SE | V1 |
| IEEE 2883 Clear / NIST r2 Clear | SCSI | TCG Unmap → TCG RWP → TCG BE → TCG OW → FU → overwrite 0x00 | Later |
| IEEE 2883 Clear / NIST r2 Clear | NVMe | TCG Unmap → TCG RWP → TCG BE → TCG OW → NF(user data erase) → overwrite 0x00 | V1 |
| IEEE 2883 Purge / NIST r2 Purge | ATA | TCG CE → Sanitize CE → Sanitize BE → Sanitize OW → ESE | V1 |
| IEEE 2883 Purge / NIST r2 Purge | SCSI | TCG CE → Sanitize CE → Sanitize BE → Sanitize OW | Later |
| IEEE 2883 Purge | NVMe | Sanitize CE → Sanitize BE → Sanitize OW → TCG CE → NF(CE) | V1 |
| NIST r2 Purge | NVMe | Sanitize CE → Sanitize BE → Sanitize OW → TCG CE | V1 |
| NexWipe SSD method (replaces Blancco SSD Erasure) | ATA / NVMe / eMMC | 1st: SBE → Sanitize CE → TCG CE → NF(CE) → NF(UDE) / eMMC SA; 2nd (after aperiodic overwrite): same chain again if supported | V1 |

Open question to confirm in lab: whether the IEEE/NIST r2 Clear chains stop at the first supported command or run several
in sequence (the research shows the arrows but not this detail). Until confirmed, NexWipe treats → as fallback everywhere,
which is the meaning §9.2 gives.

## Rules the firmware module follows

| Rule | Source | NexWipe builds | Phase |
|---|---|---|---|
| Never send an unsupported command | §9.2 "→ fallback order"; §9.5 "can't be used (shown in UI)" | Support check per command (tables above) before the chain starts; result shown per drive | V1 |
| Company can untick individual commands | Research step 8 "Configure firmware-based commands" | Same checklist on the Stick setup page; unticked commands are skipped in every chain | V1 |
| NVMe Format under IEEE Purge → "vendor-specific purge commands" note | §9.4 | Same rule, own wording (README §9.4) | V1 |
| No pause, cancel, shutdown or disconnect during firmware commands — drive may be damaged | §9.8 warning | Buttons disabled; full-screen "Do not switch off" banner; mains power required, refuse on low battery | V1 |
| Freeze lock must be removed first or SE/ESE fail | §9.5 | Sleep-and-wake unfreeze with `rtcwake -m mem -s 5` (plan step 7) | V1 |
| Wait for completion | — (our engineering) | Timeout = drive's own estimate (`hdparm -I` minutes, NVMe sanitize-log estimate) + margin; exceeding it = fail | V1 |
| Temporary ATA password removed afterwards | — (our engineering; a leftover password locks the drive) | Re-read `hdparm -I`: Security "not enabled"; else `--security-disable <tmp>` and report | V1 |
| Drive must respond and stay operational | Research §11.3 | Re-identify drive, same size and serial, before verification | V1 |
| Every command logged | — (our engineering) | Command, parameters, start/end, status code → report detail log | V1 |

## Failure messages (research §11.6, own wording)

| Blancco message | NexWipe message | Phase |
|---|---|---|
| "ENHANCED SECURE ERASE command failed" | "Drive's enhanced secure erase failed" | V1 |
| "SECURE ERASE command failed" | "Drive's secure erase failed" | V1 |
| "FORMAT UNIT command failed" | "Drive's format unit failed" | Later |
| "BLOCK ERASE EXT command failed" | "Drive's sanitize block erase failed" | V1 |
| "OVERWRITE EXT command failed" | "Drive's sanitize overwrite failed" | V1 |
| "Cryptographic erasure has failed" | "Drive's cryptographic erase failed" | V1 |

## How we test
On every lab SSD/NVMe/eMMC/HDD (DISPOSABLE drives only): run each supported command alone, then our verification (plan
step 10), then the independent marker search (plan step 17). Record per drive model which commands worked into a
"command support table". Deliberately test frozen and password-locked drives. USB-to-SATA adapters: follow plan step 8's
adapter rules.
