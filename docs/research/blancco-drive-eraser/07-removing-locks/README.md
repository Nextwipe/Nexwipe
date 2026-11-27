# Step 7 — Removing locks and hidden areas before the wipe

## In short
Many drives in laptops are locked in ways that block a full wipe. BDE removes the BIOS **freeze lock** with a
sleep-wake cycle, removes **HPA/DCO** hidden areas so the full capacity is reachable, unlocks self-encrypting drives
with a **PSID Revert**, asks the BIOS to turn off **Block SID**, detects the **Shadow MBR**, and can clear the **TPM**.
Drive passwords must be dealt with in the BIOS.

## 7.1 Freeze lock (§7.14, p.88–89; §7.1; KB "Freeze Lock Removal")
- What: BIOS sets ATA drives "security frozen". Then "removal of the drive's hidden areas or issuing the firmware based
  erasure commands is not possible".
- Which standards/options need FLR (KB): Blancco SSD Erasure, NIST 800-88 Purge, Cryptographic Erasure, BSI-GS/E,
  BSI-2011-VS, and "Erase Remapped Sectors" on a drive that has remapped sectors.
- How: "power cycling the machine: the machine is put to sleep, the drives' locks are removed and the machine is woken
  up". Screen black a few seconds. All locked drives at once, "at most once per session".
- When: during boot (default option "FLR during startup") or right after pressing Erase (other boot options);
  timing also depends on Manual/Semi-automatic/Automatic process (KB).
- Failure modes (KB): (1) black screen while erasure continues in background; (2) black screen, machine on, nothing
  running; (3) black screen and unresponsive — FLR paused or failed.
- Remedies (KB): press a key or hold power ~1 s; dock/undock or cable manipulation; enable S3 in BIOS ("ACPI Standby
  State" → S3); BIOS up/downgrade (examples in step 2); move the drive to another motherboard; last resort disconnect
  the drive's signal then power cable while running — "not recommended by Blancco, as the drive may result damaged".
- Machines with no black screen that still fail firmware commands (e.g. Surface Pro 3) cannot use FLR (KB).
- Forced FLR can be configured in CT if auto-detection misses a lock (search result).
- How to avoid FLR entirely (§7.14): boot with any option except "FLR during startup", then choose a standard with no
  firmware commands, disable remapped-sector erase, disable hidden-area removal, disable SSD-method enforcement.
- KB: FLR can be skipped when policy only needs NIST Clear, when the drive is a healthy HDD without remapped sectors or
  hidden areas, or when data isn't sensitive.
- SSD method: if a freeze lock can't be removed, "the erasure using Blancco's SSD erasure method will fail" (§16.1).

## 7.2 Hidden areas — HPA, DCO, AMA (§7.9, p.84–85)
- "Hidden areas in an ATA storage device (HDD, SSD) which cannot be seen or accessed via the O.S. or the BIOS":
  - **HPA (Host Protected Area)** — "commonly used to store the recovery part of the operating system and can contain sensitive data".
  - **DCO (Device Configuration Overlay)** — reduces the visible size via a hidden partition; risk of leftover data
    unless the product can detect, extend and erase it.
  - ACS-3 **Max Address Configuration** areas are also detected and removed (shown as HPA).
- Setting "Remove hidden areas" (or preset in CT). If on: an extra step removing hidden areas is added only if the drive
  has one **and** the standard has no hidden-area removal step. This extra step is **optional**: failure doesn't fail the erasure.
- Standards that include removal as a mandatory step: NIST 800-88 Clear/Purge/NIST 800-88, IEEE 2883, NIST r2, BSI-GS/GSE (step 9).
- Warning: drives with HPA/DCO not removed should not be erased with NIST Clear, NIST Purge-ATA, BSI-GS/E,
  (Extended) Firmware based erasure, Blancco SSD Erasure or any standard with "Erase remapped sectors" — "Using these
  options could end up erasing such areas" (i.e. these may erase them anyway).
- Warning: removal "is not reliable" through an adapter (e.g. external USB enclosure); connect directly.
- Erasing remapped sectors can also erase hidden areas (§7.8).

## 7.3 ATA drive passwords (§8.6, §16.2.2, §4.2.3.6)
- Must be entered before BDE boots; then only overwriting is possible. For Purge, remove the password in BIOS/UEFI.
- ATA Master Password on an SSD blocks firmware erase and writes; if it can't be removed, the drive can't be erased.

## 7.4 Self-encrypting drives — TCG (§7.25, p.95–98)
- TCG = Trusted Computing Group; SSC specs: **Enterprise** (data centre), **Opal** (client devices), plus Opalite, Pyrite, Ruby.
- Support matrix (CE = Crypto Erase, BE = Block Erase, OW = Overwrite command):

| TCG | ATA/SATA | SCSI/SAS | NVMe |
|---|---|---|---|
| Opal | CE reporting & erasure; BE, OW N/A | same | same |
| Enterprise | CE reporting & erasure | CE reporting & erasure | CE N/A |
| Opalite | CE reporting & erasure | same | same |
| Pyrite | CE reporting & erasure; BE, OW reporting | same | same |

  (Note: §4.2.3.6 icon text says Opalite/Pyrite/Ruby crypto erasure is "not supported yet"; the §7.25 table says CE
  reporting & erasure for Opalite and Pyrite. The manual is inconsistent here.)
- TCG commands are used in "NIST 800-88 Purge" and "TCG Cryptographic Erasure". Any standard using TCG Crypto Erase
  "first reverts the drive to factory default before replacing the encryption key and scrambling the data".
- **PSID Revert (§7.25.1):** for drives marked "TCG locked" or "TCG password". PSID = Physical Security ID,
  "a 32-character password", usually printed on the drive sticker. Click the lock icon or Ctrl+J → "Enter PSID" → OK
  → green "PSID" label. On erasure an extra PSID revert step runs **before** all others; it resets to factory settings,
  removes locks/passwords and destroys data; shown in the report. Authorisation failure → error popup. Also via workflow.
- KB (as of 6.18.0): SEDs (ATA, SCSI/SAS, NVMe) erasable by overwriting or Sanitize Crypto Erase; TCG/Opal locked
  drives by overwriting or TCG Crypto Erase; locked drives via PSID Revert.

## 7.5 Block SID Authentication (§7.29, p.99–100)
- TCG feature that blocks authenticating the SID authority (stops someone taking ownership of a drive whose SID is
  still the default MSID). Disabling it "allows running firmware-based erasure commands … required to achieve a
  purge-level erasure".
- Yellow "SID Blocked" mark. If the machine supports **PPI** (Physical Presence Interface), clicking it opens a disable
  dialog (only if no erasure running); otherwise "Cannot be disabled".
- Hotkey Ctrl+Alt+S on Erase view; dialog can also be shown right after boot via CT (default button and timeout configurable).
  Not shown if erasure is managed by BMP. In Workflow/Auto/Semi-auto, the process doesn't start until the dialog is
  closed with "No, skip".
- "Yes, proceed" → PPI request to BIOS → reboot → PPI confirmation screen where the operator accepts.
- After success, on shutdown/restart (Shutdown button or F10) BDE suggests re-enabling Block SID.
- XML fields: `blancco_data.blancco_hardware_report.disks.disk.tcg_block_sid_authentication_supported` and `..._enabled`.

## 7.6 Shadow MBR (§7.9.1, p.85)
- Special TCG area ≥128 MB holding a pre-boot authentication image (unlock screen).
- "cannot be removed or erased via normal means (overwriting or firmware-based erasure commands) and requires special
  TCG commands (PSID Revert operation or admin password)".
- States: Disabled (no risk); Enabled and active (drive shows only the Shadow MBR until password); Enabled and inactive
  (user area erasable but Shadow MBR untouched; on next boot it becomes active again and may show the previous owner's
  name/logo). Also: inactive and not enabled but still accessible → icon still shown. XML check:
  `tcg_locking == enabled` and `tcg_shadow_mbr_supported == true`.
- From BDE 7.1.0: icon, and report fields `tcg_shadow_mbr_supported`, `tcg_shadow_mbr_enabled`, `tcg_shadow_mbr_active`, usable in workflows.

## 7.7 TPM (§7.26–7.27, p.98)
- TPM detected and reported if present and enabled in BIOS; workflow variable `tpm_devices`.
- "Clear TPM" (CT Security settings) clears it during startup. Popup: "This machine has Trusted Platform Module (TPM)
  installed. This module may contain private data. Do you want to clear it? This may require to reboot the machine…".
  Timeout set to 0 → clears or skips automatically. Warning: data cannot be recovered; may reboot.

## 7.8 Software encryption (BitLocker etc.)
KB: "Blancco Drive Eraser can erase these drives without a problem since it overrides the machine's original OS."

## 7.9 Persistent firmware software — Computrace (§7.15, p.89)
- Software embedded in BIOS/UEFI that survives sanitisation; detectable via CT (Security → Security options → Device
  enrollment detection → Persistent software). Report field "Persistent Software".
- Computrace (Absolute Software) is the most common; BIOS showing "Active"/"Enabled" doesn't prove it works — only
  installing Windows and checking for the process does.
- BDE detects and reports it; it does not claim to remove it.

## 7.10 RAID and controller modes (§7.22, §8.4)
- RAID dismantling (CT, off by default) for: Adaptec/IBM ServeRAID; DAC960/AcceleRAID/eXtremeRAID; LSI MegaRAID/Dell
  PERC/Intel RAID; HP Smart Array; Dell BOSS (e.g. BOSS-S1); Dell PERC H965i; LSI 9305-16i/24i; HPE SR932i-p Tri-Mode;
  HPE NS204i (can erase NVMe separately; firmware erase supported if image removes the logical disk).
- Otherwise dismantle manually in RAID BIOS or set JBOD; update RAID firmware.
- MegaRAID support depends on OEM firmware: LSI (SAS and SATA), Dell (SAS and SATA; SATA plain overwrite only); HP/Intel case by case.
- Multi-mode controllers: BDE suggests switching mode (esp. for NIST Purge); CT Security > Storage controller options.
  Warning: irreversible data loss, may prevent recovery, may reboot.
