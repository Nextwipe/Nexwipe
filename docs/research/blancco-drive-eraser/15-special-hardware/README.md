# Step 15 — Hardware that needs special handling

## In short
Spinning hard drives are straightforward. SSDs, NVMe and eMMC depend on firmware commands; hybrid drives and eMMC
carry residual risk Blancco admits openly. Apple, Surface and ARM machines have boot limits. Chromebooks have their own
process: [chromebooks.md](chromebooks.md).

## 15.1 Unsupported processors (§8.1, p.103)
- x86 (Intel, AMD) supported; other x86 vendors case by case.
- RISC, ARM etc. not supported directly → remove drives and erase in an x86 "erasure station". Sun SPARC: Blancco SPARC product.
- Most x86 tablets incl. Intel Atom boot; most Atom "Clover Trail" devices don't.

## 15.2 SSDs (§8.2, §16.1)
Guidelines:
- SSD method only for ATA and SCSI SSDs with firmware erase commands. Other standards allowed, report notes an SSD was erased.
- No firmware command → can't use SSD method (UI says so). Freeze lock not removable → SSD method fails (report says so).
- Old SSDs (usually ≤64 GB): erase one per machine at a time.
- Erase the whole drive, not partitions.
- No USB/FireWire docks or PATA/SATA/SCSI bridges; no RAID; two SSDs attached → one at a time.
- ATA SSD not shown / no firmware access → switch IDE/ATA to AHCI/SATA Native.
- Update firmware for models that consistently fail (no guarantee).

## 15.3 eMMC (§8.2.1, p.103–104)
- Embedded flash with its own controller (wear levelling, bad block management internal). Shown as "eMMC".
- JEDEC Sanitize removes data from user-addressable and unmapped space; Secure Erase is for backward compatibility.
- **Retired sectors:** some eMMCs can erase defective regions before retiring them, but only if enabled beforehand
  and only for sectors retired after enabling. Otherwise retired sectors may survive even Sanitize/Secure Erase.
- Clear: overwrite first-to-last detected sector + verify, like any flash device.
- Purge: Sanitize and Secure Erase in "NIST 800-88 Purge" and "Blancco SSD Erasure", but "there are no guarantees that
  the purge-level will be achieved in all situations". Some eMMCs show an extra recovery partition after purge which may still contain data.

## 15.4 Hybrid drives / SSHD (§8.2.2, p.104–105)
Detected programmatically or via an embedded model list (editable in CT). Only the part presented to software (usually
the HDD) is processed; the hidden flash part can't be verified → "no guarantees … against recovery of data using
laboratory techniques"; protects against software-level non-invasive attacks only. Report exception warns about it.
Not enough research to say firmware erase (e.g. ATA Secure Erase) covers both parts.

## 15.5 NVMe (§8.3, p.105–111)
- Shown as "NVMe". TCG Opal, Enterprise, Opalite, Pyrite, Ruby detected and reported.
- **Heat:** erasure causes heavy activity → thermal throttling or overheating. Temperature shown in UI; screensaver
  flashes near the Critical Composite Temperature Threshold; pause until it cools, or add external cooling.
- Sanitize feature set supported on NVMe since **6.17** (used in Sanitize Cryptographic Erasure, IEEE 2883 Purge, NIST Purge).
- Blancco recommends "Blancco SSD Erasure" for NVMe. NVMe support began in 6.1 (search: early limits — no hotplug, no partition detection).
- **Namespaces and unallocated space:** shown as separate cards; merge manually (DET/UNL icons) or automatically
  (CT "Automatically merge multiple namespaces into one"). 1 licence per drive. Show namespaces in colour (Ctrl+N).
  Namespaces of a drive being erased can't be selected. If namespaces are erased but detached namespaces/unallocated
  space aren't → report disclaimer (whole drive not erased). Namespaces and RAID metadata region reported separately, numbered.
- **NVMe-oF / FC-NVMe:** erase remote NVMe enclosures (e.g. HPE Alletra 2240) over 100 Gb Ethernet using NVMe-oF RDMA
  (RoCEv2) or TCP; configure DHCP and MTU (Alletra 9000). Only overwriting standards and NIST Purge.
- **Port mapping:** learned gradually as drives are connected; fill all slots then boot for a reliable map. Order:
  NVMe first, then SAS/SATA/FC by PCI bus, then USB/eMMC, then NVMe-oF; unknown ones last. Each NVMe is its own
  controller (1-1, 2-1, …). Worked example in manual (4 slots, drives A–E). Port aliases up to 255 chars (Ctrl+Alt+A);
  reports use original numbers. Custom drive order (drag or Ctrl+arrows), saved on installed BDE or with a Blancco USB
  stick connected; Reset button; orange ports not part of the mapping. Hybrid appliances: e.g. 4 NVMe + 8 SAS/SATA
  slots; removed NVMe controller kept as dummy (not reported); NVMe controller always 1 bay.
- HPE SR932i-p Gen11 limits: no bay numbering (yellow), only first NVMe namespace visible, no NVMe self-tests (§15.3).

## 15.6 RAID controllers with SAS/SATA (§8.4) — see step 7.10.

## 15.7 NVDIMM (§8.5, p.111–112)
Raw and sector modes (set with NDCTL). NVDIMM-N: clear only. NVDIMM-Optane: clear; purge possible depending on host
and raw mode. Regions/namespaces must exist (BIOS; NDCTL or ipmctl) or capacity shows 0 bytes. Exceptions:
"NVDIMM data backup is not armed, check backup battery", "NVDIMM has invalid or missing configuration". Reported as NVDIMM.

## 15.8 Password-locked drives (§8.6) — only overwrite; remove password in BIOS for purge.

## 15.9 Removable flash (§8.7) — hidden by default, clear only, "BLANCCO"-labelled sticks excluded.

## 15.10 Chromebooks (§8.8) — two ways: boot generic BDE on Intel Chromebooks (most have locked bootloaders), or the
recommended "modern" network process for Intel and ARM. Full detail: [chromebooks.md](chromebooks.md).

## 15.11 Apple
- **T2 Macs (§8.9):** T2 chip controls internal SSD access; boot and erase supported from 6.12.0.
  KB: 6.12.0 needed manual GRUB edits; 6.13.0+ boots and erases T2. Procedure: USB Creator stick; Startup Security
  Utility → Secure Boot "No Security", External Boot "Allow booting from external media"; external keyboard needed;
  factory-reset device needs activation for admin access. MacBookPro16,1 (late 2019) booted ~2 of 3 attempts, else
  reboot and repeat. Black screen but booted → erase via automatic process or BMP remote control. Older KB said NVMe
  was not visible on T2 and pointed to LUN Eraser (outdated).
- **Intel Macs (Apple KB, 6.1.2+):** only Intel (x86) Macs; no PXE; some won't boot USB → CD; remove Thunderbolt and
  other peripherals (FLR issue); Secure Boot "No Security". Some models show "NOT SUPPORTED" for purge (e.g.
  MacBookPro11,1 with OWC Aura SSD, MacBookAir6,1, MacBook9,1, MacBook8,1, MacBookAir7,1) — "cannot be fixed in Blancco
  Drive Eraser"; use Aperiodic Random Overwrite or HMG Lower with 100% verification for clear-level. NVMe in
  MacBookAir7,1, MacBook8,1, MacBook9,1: overwrite with 6.2.0+. Give family and serial to support.
- **Apple Silicon (M1+):** not Drive Eraser — "Mobile Diagnostics and Erasure on Mac" 4.10 covers T2 and M1; Drive
  Eraser for Mac based on LUN Eraser supports M1 and T2 (KB/search).

## 15.12 Microsoft Surface
- Surface Pro 4: Secure Boot "Microsoft & 3rd party CA" (§8.10).
- Surface Pro 3: no FLR black screen yet firmware commands fail — FLR unusable (KB).
- Surface 3: BIOS version matters for FLR (KB).

## 15.13 Dell / Lenovo specifics (KB)
- Dell Latitude 3480/5480: disable "Block Sleep (S3 State)".
- Dell Latitude 9430: sluggish UI with FLR boot — use safe resolution (§15.4).
- Lenovo X1 Tablet 20GHS0S100: BIOS ≤1.55 supports S3, ≥1.57 doesn't.
