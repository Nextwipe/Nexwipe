# How Blancco Drive Eraser wipes a laptop — research pack

Research date: 2026-11-26. Written for NexWipe as background on how the market leader works.
Nothing here describes NexWipe's own behaviour (see step 18 for how it relates).

Main source: **Blancco Drive Eraser User Manual for version 7.21.0, dated 2026-10-27** (195 pages, official PDF).
References like "§7.14, p.88" point into that manual. Other sources are listed in [00-sources](00-sources/README.md).

## The whole process in one paragraph

Blancco Drive Eraser (BDE) is a small Linux operating system that runs entirely in memory, started from a USB stick,
CD, the network (PXE) or a permanent install. Because the laptop's own Windows never starts, BDE can send low-level
commands straight to each drive. It detects every drive and everything that could hide data, removes locks
(freeze lock, hidden areas, encryption locks), runs an **erasure standard** (a fixed list of overwrite and/or firmware
steps), **verifies** by reading the drive back, decides **Erased / Not erased** by strict rules, optionally runs
hardware tests, and produces a **digitally signed report** that goes to the Blancco Management Portal or a USB stick.

## Steps (one folder each)

| # | Folder | What it covers |
|---|---|---|
| 00 | [00-sources](00-sources/README.md) | Every source read, versions, what could not be read |
| 01 | [01-preparation](01-preparation/README.md) | Configuration Tool, USB Creator, ISO checksum, licences; [USB Creator in full](01-preparation/usb-creator.md) |
| 02 | [02-laptop-bios-setup](02-laptop-bios-setup/README.md) | BIOS/laptop checklist before booting |
| 03 | [03-booting](03-booting/README.md) | Boot media, boot menu options, Secure Boot, system requirements; [permanent installation](03-booting/permanent-installation.md) |
| 04 | [04-user-interface-and-settings](04-user-interface-and-settings/README.md) | Screen layout, every settings tab, notification icons, keyboard shortcuts, screensaver |
| 05 | [05-drive-and-hardware-detection](05-drive-and-hardware-detection/README.md) | What is detected, drive info, all drive icons, hardware report |
| 06 | [06-process-modes-and-workflows](06-process-modes-and-workflows/README.md) | Manual / Semi-automatic / Automatic / Workflow; remote control; [workflows in detail](06-process-modes-and-workflows/workflows.md) |
| 07 | [07-removing-locks](07-removing-locks/README.md) | Freeze lock, HPA/DCO, passwords, TCG/PSID, Block SID, Shadow MBR, TPM, BitLocker |
| 08 | [08-erasure-settings](08-erasure-settings/README.md) | Every erasure option the operator can set |
| 09 | [09-erasure-standards](09-erasure-standards/README.md) | Every standard and its exact steps / command order |
| 10 | [10-verification](10-verification/README.md) | How the wipe is checked; percentages; NIST methods |
| 11 | [11-errors-and-result](11-errors-and-result/README.md) | Bad sectors, thresholds, mandatory vs optional steps, final status |
| 12 | [12-hardware-tests](12-hardware-tests/README.md) | Every hardware diagnostic test |
| 13 | [13-custom-fields-and-report](13-custom-fields-and-report/README.md) | The report, signature, saving/sending, fingerprint; [custom fields & per-device reports](13-custom-fields-and-report/custom-fields-and-per-device-reports.md) |
| 14 | [14-finish-restart-reimage](14-finish-restart-reimage/README.md) | Restart/shutdown rules, CD eject; [reimaging](14-finish-restart-reimage/reimaging.md) |
| 15 | [15-special-hardware](15-special-hardware/README.md) | SSD, eMMC, hybrid, NVMe, RAID, NVDIMM, Apple, Surface, ARM; [Chromebooks](15-special-hardware/chromebooks.md) |
| 16 | [16-where-data-may-remain](16-where-data-may-remain/README.md) | Blancco's own list of places data can survive, false positives, troubleshooting |
| 17 | [17-independent-certification](17-independent-certification/README.md) | Common Criteria EAL2 evaluation and its assumptions |
| 18 | [18-nexwipe-implications](18-nexwipe-implications/README.md) | What this means for NexWipe; open gaps |

## Glossary (short)

- **BDE** — Blancco Drive Eraser, the bootable eraser.
- **CT** — Blancco Drive Eraser Configuration Tool; builds the configured image.
- **BMP** — Blancco Management Portal (older name: Blancco Management Console, BMC); stores reports, licences, remote control.
- **HASP** — a USB licence dongle.
- **HPA / DCO** — Host Protected Area / Device Configuration Overlay: parts of an ATA drive hidden from the OS.
- **Freeze lock** — BIOS puts SATA drives in a "security frozen" state that blocks firmware erase commands.
- **Firmware-based erasure** — asking the drive's own controller to erase itself (ATA Secure Erase, Sanitize, NVMe Format, TCG Crypto Erase…).
- **Crypto erase** — the drive replaces its internal encryption key so old data becomes unreadable.
- **TCG / Opal / SED** — standards for self-encrypting drives.
- **PSID** — 32-character code printed on a self-encrypting drive's label; allows a factory reset (PSID Revert) that destroys data.
- **NIST 800-88 Clear / Purge** — US guideline levels: Clear resists ordinary software recovery; Purge resists laboratory recovery.
