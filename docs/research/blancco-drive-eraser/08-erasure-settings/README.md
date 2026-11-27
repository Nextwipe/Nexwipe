# Step 8 — Erasure settings the operator can choose

## In short
Before pressing Erase, the operator (unless CT locked the settings) picks per drive or per group: the erasure
standard, the verification level, and options such as erasing remapped sectors, removing hidden areas, forcing the
SSD method on SSDs, partition handling and post-erase formatting. Some combinations are blocked because they would
touch the whole drive while the user asked to keep part of it.

## 8.1 Where (§4.2.3.3, p.36–38)
Gear icon bottom-right (or Ctrl+G, KB) → submenus. A lock icon means settings were locked in CT; tooltip explains.
Standard, remapped sectors and verification "can also be defined individually or per group" (§4.2.3).

## 8.2 All options

### Pre-processing
- Drive self-tests (SMART): Execute self-tests on drives — Short (< 2 min typical), Conveyance (ATA only, several
  minutes), Extended (whole surface, minutes to hours); "Fail Erasure if Unsuccessful". Tests auto-fail if much longer
  than estimated. ATA and SCSI. Also runnable without erasure via workflows (§7.30).

### In-process
| Option | Default | Effect |
|---|---|---|
| Erasure standard + verification level | from CT | See steps 9 and 10 |
| Overwrite pattern type | — | Only with NIST 800-88 Clear: Static (choose byte value) or Aperiodic random |
| Erase remapped sectors | **Off** | Adds a firmware step to erase remapped (retired) sectors |
| Fail erasure if unsuccessful | Off | Only with the above. On: drive with ≥1 remapped sector where erasure fails/unsupported → whole erasure fails immediately, report "Drive doesn't support remapped sectors erasure". Off: continues, same text as exception |
| Remove hidden areas | — | Removes HPA/DCO (step 7) |
| Enforce Blancco SSD method on SSDs | — | All SSDs (incl. NVMe) get "Blancco SSD Erasure"; HDDs keep the selected standard |
| Show drive partitions | — | Partitions listed and erasable separately |
| Preserve recovery partition | — | GPT drives with a Windows recovery partition are partially erased, keeping that partition |
| Use WRITE SAME command | **On** | Faster periodic-pattern erasure, SCSI/SAS only |
| Configure firmware-based commands | — | Untick individual commands to skip them. If NVMe Format (Crypto Erase / User Data Erase) runs with IEEE 2883-2022 Purge, report says "Sanitization includes vendor-specific purge commands" — purge "might not be achieved" and should be confirmed by the vendor |

### Post-processing
- Format drives after erasure: NTFS, FAT32 or exFAT; for ATA, SCSI, SAS, NVMe, eMMC, USB. Turning this on disables
  Bootable asset report and Fingerprint even if enabled in CT.

## 8.3 Remapped sectors in detail (§7.8, p.83–84)
- Drives hide failing sectors by remapping them to a spare area; "The remapped sector may contain some of the user's data."
- With the option on, an extra firmware step is added only if the drive has ≥1 remapped sector and the standard has no
  firmware step. It is optional: failure doesn't fail the erasure (unless "Fail erasure if unsuccessful").
- Remapped-sector threshold in CT: if count before/after erasure ≥ threshold → erasure stopped and failed with message.
- Standards that include remapped-sector erasure *de facto*: (Extended) Firmware based erasure, BSI-GS/E, NIST 800-88
  Purge – ATA, Blancco SSD Erasure.
- Warnings: can also erase hidden areas; don't power off/disconnect/pause/cancel during it ("drive(s) may be damaged");
  disable BIOS HDD detection to avoid problems. Can be time-consuming.

## 8.4 SSD switch (§7.11, p.86)
For each SSD the default standard is switched to Blancco SSD Erasure; non-SSDs unaffected.

## 8.5 Partitions and recovery partition (§7.12, p.86–88)
- Show drive partitions: works with MBR and GPT; drive shown as a multi-select list of partitions (filesystem, label,
  size); partitions erased and reported individually.
- Preserve recovery partition: GPT only (Windows 7/8+); all partitions erased except the recovery partition, which can
  later reimage the machine; "RECOVERY" icon.
- Cases: 1 = some partitions selected; 2 = all partitions selected (overrides 1); 3 = preserve recovery + GPT recovery
  detected (overrides 2).

| Option | Case 1 | Case 2 | Case 3 |
|---|---|---|---|
| Normal overwriting | Allowed (a) | Allowed (c) | Allowed (d) |
| Firmware command | Not allowed (b) | Allowed (c) | Not allowed (b) |
| Remapped sectors erasure | Not allowed (b) | Allowed (c) | Not allowed (b) |
| Hidden area removal | Not allowed (b) | Allowed (c) | Not allowed (b) |
| Blancco SSD switch | Not allowed (b) | Allowed (c) | Not allowed (b) |
| Bootable asset report | Ignored (e) | Allowed (c) | Ignored (e) |
| Fingerprint | Ignored (e) | Allowed (c) | Ignored (e) |

(a) only selected partitions: content, label, filesystem erased; partition table untouched; reported individually with
exception "there is data left on the drive". (b) red "NOT ALLOWED" icon, error popup, erasure won't proceed — only
overwriting possible. (c) normal whole-drive erasure, report doesn't mention partitions. (d) with Show partitions: like
(a) with recovery greyed out; without: all but recovery erased in background, exception "data left on the drive".
(e) silently ignored.
- SSD method rule: "The whole drive should be erased, do not erase individual partitions" — firmware commands don't
  work on partitions (§16.1).

## 8.6 Fallback Purge → Clear (§7.28, p.99)
CT option "Enable fallback from NIST Purge to NIST Clear": if Purge isn't supported or fails, falls back to Clear.
Both standards must be enabled in CT. The Common Criteria report says users must understand the implications of this fallback.

## 8.7 Workaround when firmware commands fail (KB 11635720)
Errors such as "ENHANCED SECURE ERASE command failed", "SECURE ERASE command failed", "FORMAT UNIT command failed",
"BLOCK ERASE EXT command failed", "OVERWRITE EXT command failed", "Cryptographic erasure has failed". Cause: firmware
rounds are mandatory in some standards and the drive lacks the command or "might be in a locked state"; commands used
"are dependent on the details of the target drive, selected erasure settings and erasure standard". Workaround: in
Erasure Options disable "Enforce Blancco SSD method on SSD" and choose "NIST 800-88 Clear" → clear-level result.
