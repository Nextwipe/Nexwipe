# Step 5 — Detecting drives and hardware

## In short
After boot BDE lists every drive it can reach with vendor, model, type, size, serial and bay position, and shows an
icon for anything that could hide data or block erasure (hidden areas, locks, encryption features, NVMe special
areas, remapped sectors, errors). It also builds a hardware (asset) report of the whole machine.

## 5.1 Which drives (§1, p.14; §8.7)
- SATA, SCSI/SAS, Fibre Channel, USB, eMMC, NVMe, plus removable flash devices.
- Removable flash (SD cards, USB sticks) is **hidden by default**; showing it must be enabled in CT. They can only be
  cleared (no purge). A popup warns about them at startup. Any stick labelled "BLANCCO" is always excluded.
- SAN (storage area network) endpoint devices are visible by default; can be hidden via CT, then they appear neither in
  GUI nor in asset reports (§7.6).
- HDD size uses "hardware level detection" so the correct size is found "regardless of faulty or incorrect BIOS-set HDD
  values", so overwriting "will reach the whole HDD surface" (§7.5, p.82).
- Hybrid drives (SSHD): programmatic detection first, then an embedded model list (editable in CT) (§8.2.2).

## 5.2 The drive list (§4.2.3, p.32–35)
- List view (default) or Grid view (Ctrl+W). Grid view shows some info only on mouse hover.
- Erasure standard names are shortened in the progress view (e.g. "HMG Lower").
- Search bar (Ctrl+F): searches number, vendor, model, type, size, serial, and status; CPU type for Chromebooks;
  accepts regular expressions; not case-sensitive. Status search with `!`: `!` everything, `!s`/`!successful`,
  `!c` cancelled, `!f` failed.
- "Show empty slots" (Ctrl+M) toggles visible empty bays.
- Info per drive: number of drives, vendor/model, type (SATA, SPI, SSD…), size in GB, serial number.
- IDs: running ID and bay ID `X (Y-Z)` — X running ID, Y controller ID, Z controller port.
  - **Black** bay ID: controller supports port mapping, remembered between boots, consistent.
  - **Yellow** bay ID: no port mapping — numbering is by detection order and "changes between boots".
- "Locate drive" (Ctrl+L, all drives Ctrl+Alt+L) blinks the drive LED for 30 s or until stopped / erasure starts;
  uses a supported enclosure LED, otherwise reads the drive "in a pattern that is distinguishable"; disabled while a
  drive is erasing (not paused); no limit on number blinking (§4.2.3.2).
- Hex viewer shows raw sector contents (hex + ASCII), before or after erasure, for visual confirmation (§4.2.3.4).

## 5.3 Drive progress states (§4.2.3.5, p.42–43)
Not started · Ongoing (percentage, remaining time, write speed, standard) · **Ongoing firmware command** (looped
animation; e.g. ATA secure erase, SCSI format unit, Sanitize, TCG; percentage if available; **cannot be paused or
cancelled**; locate button off) · Paused · Completed · Canceled · Failed (e.g. read/write errors).
Buttons: Pause, Resume, Cancel (select one or several drives).
Erasure tab colour: grey not started, dark blue ongoing, green successful, red failed or cancelled, blue paused;
shows percentage and remaining time.

## 5.4 Every drive info icon (§4.2.3.6, p.43–46)

| Icon | Meaning |
|---|---|
| Standby mode | Drive inactive 5 minutes and spun down (configurable in Settings/CT) |
| Remapped sectors count | Remapped sectors detected; number may update after erasure (esp. with firmware step) |
| Error count | Read/write errors during erasure, live |
| Hidden areas | DCO, HPA or both; may disappear after erasure if removed |
| Password protected drive | Cannot be erased unless password entered before BDE boots |
| Erasure option not supported | e.g. standard needs firmware erase the drive lacks; or "Erase remapped sectors" unsupported |
| Erasure standard has a fallback | Drive doesn't fully support the standard but it can fall back (e.g. firmware step → normal overwrite) |
| GPT recovery partition detected | Windows recovery partition found |
| Erasure not allowed | Preserve recovery partition / show partitions is on and user tries whole-drive options |
| Drive temperature | Current temperature (NVMe and SATA only) |
| Self-tests | Self-tests option on and drive supports them |
| TCG Cryptographic Erasure supported | Used in "TCG Cryptographic Erasure" and "NIST 800-88 Purge" |
| TCG Enterprise | Same, and drive is TCG Enterprise SSC compliant |
| TCG Opalite / Pyrite / Ruby | Feature set detected and reported; crypto erasure "not supported yet" for these, planned for coming releases |
| TCG Locked | Drive fully read/write locked via TCG (by BIOS/UEFI or OS); unlock with password or PSID Revert |
| Password Locked TCG Drive | TCG commands password-locked; drive readable/writable but TCG erase needs unlocking |
| Thunderbolt | Green: supported and in use; yellow: supported but not in use (check port/cable) |
| Security Freeze Lock (FL) | Freeze lock activated by UEFI/BIOS; firmware erase may be blocked |
| PSID | A PSID has been entered for a locked drive (click lock icons or Ctrl+J) |
| Shadow MBR area detected | See step 7 |
| SID block enabled | Block SID active; BDE offers to disable via BIOS (PPI) with reboot |
| RAID metadata (RMTD) | Recommends another standard; RAID metadata may remain with clear-level erasure |
| Storage Element Depopulation | Depopulated areas not erased and may contain data; restoration only in IEEE Clear and Purge |
| NVMe detached namespaces | Detached namespaces or namespaces without a block device, may contain data |
| Unallocated space | Click to try attaching it |
| Namespaces with Key Value IO Command Set | NVMe namespaces using the Key Value command set |
| Persistent Memory Region (PMR) | NVMe drive has PMR |
| Persistent Reservations (PR) | Shown if CT auto-clear disabled but a reservation is active; click to clear; red if restricting the drive |
| NVMe Boot Partitions (NBP) | Two special areas for startup code, outside user space, writable only with "firmware download"; report says if empty or verification failed; if presence can't be determined it may still hold system data |
| Namespace Write Protection | Write protection enabled — erasure not supported |
| Replay Protected Memory Block (RPMB) | Small security area (certificates, IDs, counters); cannot be removed; not for user data; report says empty or not |
| Zoned Storage Device | Host-aware/host-managed/sequential-write zone drives; erasure "often not compatible" |

With "Report per connected device" or drive-level workflows, each drive shows extra report/custom-field icons
(see step 13 and chapter 10).

## 5.5 Hardware (asset) report contents (§4.5.2.1, p.53–54)
Before erasure the report is "simply an asset report" of the machine. It includes:
- Licensee / customer / operator information.
- Hardware: CPU, memory, drives, etc. Notes:
  - USB devices listed, but internal vs external USB cannot be distinguished; USB hubs and HASP sticks filtered out.
  - Bluetooth devices shown separately.
  - Screen resolution only on laptops, current resolution only, first display only.
  - SMART attributes for ATA; log pages for SCSI/SAS.
  - Battery charge level.
  - HDDs: nominal rotation rate (RPM) and form factor (XML, CSV, PDF).
  - BIOS: whether BIOS password is "Enabled"/"Disabled" (or "Unknown"/"Not implemented").
  - IPMI network data (MAC, IP) auto-detected at boot, XML only.
- TPM devices (if present and enabled in BIOS); workflow variable `tpm_devices` (§7.26).
- Persistent software (e.g. Computrace) if detection enabled (§7.15).
- Drive self-tests, drive life remaining estimate (SMART, plus Seagate FARM — the worse value is used; warning if
  health bad or < 90 days), drive health percentage (Basic or Strict) (§7.30–7.31).
- TCG fields, Shadow MBR fields, Block SID fields (step 7).
- A small asset report can be viewed from the notification area (see step 4).
