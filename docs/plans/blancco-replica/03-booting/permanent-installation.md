# Plan — Permanent installation (erasure station)

Mirrors: research [03-booting/permanent-installation.md](../../../research/blancco-drive-eraser/03-booting/permanent-installation.md)

**In short**
- Normally NexWipe Eraser runs "live" from RAM after starting from the stick; nothing changed survives a restart. A
  *permanent installation* puts NexWipe Eraser onto one internal drive of a PC, so changes persist and no stick is
  needed afterwards — a fixed **erasure station** for loose drives (§11, p.142).
- Started by choosing "Install as erasure station" from the stick's boot menu; needs a stick made with NexWipe Stick
  Creator, UEFI boot mode and at least 10 GB free on an internal drive (§11.1).
- The target drive is formatted and is then hidden from erasure on that installation (§11.2).
- Same recommendation as Blancco: "one report per connected drive" mode plus hot-plug.
- **Phase: Later** for the whole file — V1 erases Windows laptops/desktops booted from the stick; loose-drive stations
  are not needed for that.

Research source: Blancco manual v7.21.0, chapter 11, pp.142–143. NexWipe plan source: this file; technical base =
old plan step 15 part 3 and old step 04 (boot system).

| # | Research "In short" point | NexWipe equivalent | Phase |
|---|---|---|---|
| 1 | Live from RAM; permanent install keeps changes, no boot stick needed | Same (see "What it is") | Later |
| 2 | Chosen via "Installer"; needs USB Creator stick, BDE 7.5.1+, CT 3.5.1+, UEFI, 10 GB | Same via "Install as erasure station"; Blancco versions n/a (see Prerequisites) | Later |
| 3 | Target drive formatted, then hidden from erasure | Same (see step 2) | Later |
| 4 | Recommends "Report Per Connected Device" + Hotplug for a station producing one report per drive or Chromebook | Same recommendation, pre-ticked in the station image settings | Later |

Terms used here (NexWipe equivalents):

| # | Blancco term | NexWipe term | One-line meaning |
|---|---|---|---|
| 1 | **Live installation** | Live mode | Loaded from the stick into RAM and run from there; gone at power-off |
| 2 | **CT (Configuration Tool / BDE CT)** | Stick settings page in the web app ("Prepare stick") | Where the settings baked into the image (signed `nexwipe-setup.json`) are chosen |
| 3 | **Report Per Connected Device mode** | "One report per connected drive" mode | A separate report for each drive (or, Later, Chromebook) connected to the station, not one per machine |
| 4 | **Hotplug** | Hot-plug | Connecting and disconnecting drives while the station runs |
| 5 | **UEFI boot mode** | Same | Modern PC start-up mode (not legacy BIOS) |
| 6 | **BMP** | NexWipe web app | Where reports are collected |

## What it is (§11, p.142)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Normally a live installation run from RAM, loaded from the boot device; changes are not kept on the next boot | Same live mode (plan [README.md](README.md) §3.2 row 6) | squashfs to RAM | V1 (live) |
| 2 | Permanent installation on the machine's drive; saves changes and keeps them on next boot; no external boot media needed | Same: system files + a writable data partition on the internal drive | Same signed shim → GRUB → kernel chain installed to the drive's EFI partition; data partition for settings, reports, logs | Later |
| 3 | "Installer" in the boot menu launches the installer onto one disk of the current device; when booting finishes the installer's **Welcome** screen is shown | Same: "Install as erasure station" entry → Welcome screen in the same full-screen laptop UI | Installer page in the local web app | Later |

## Prerequisites (§11.1, p.142)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Installer runs only from a stick created with **Blancco USB Creator** | Only from a stick made by **NexWipe Stick Creator** | Installer checks the stick's signed manifest | Later |
| 2 | **CT 3.5.1 or newer** to configure the image | n/a for NexWipe — version of Blancco's tool. Equivalent: the web app's stick settings page offers "station image" | Setting `station_install_allowed` | Later |
| 3 | Recommended: image in **"Report Per Connected Device"** mode with **Hotplug** on | Same recommendation; pre-set when "station image" is chosen | Setup file | Later |
| 4 | **Blancco Drive Eraser 7.5.1 or newer** | n/a for NexWipe — Blancco release number. Equivalent: the first eraser release that ships the installer | Version check | Later |
| 5 | **10 GB or more** free on the target drive | Same **10 GB** minimum | Size check before formatting | Later |
| 6 | Installation on **external drives is not supported** | Same: USB/external drives not offered as targets | Filter by bus type (not USB) | Later |
| 7 | Computer must be in **UEFI boot mode** | Same; installer refuses in legacy mode with a clear message | Check `/sys/firmware/efi` exists | Later |

## Installation process (§11.2, pp.142–143)

Controls always visible at the bottom of the screen:

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Language** — change language | Same | Same picker as the main laptop screen | Later |
| 2 | **Keyboard layout** — change layout | Same | Same | Later |
| 3 | **Exit** — shut down or restart | Same | `systemctl poweroff/reboot` | Later |

Steps:

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Welcome Screen** shown; press **"Next"** (p.142) | Same | — | Later |
| 2 | Choose the drive, click **"Start a new installation"**; this **formats the drive** (p.142) | Same; only internal drives with ≥10 GB listed; never the stick; the technician must type a clear confirmation before formatting | Safety rule: typed confirmation | Later |
| 2a | This drive is not available or visible for erasure on this installation (p.143) | Same: installation drive permanently excluded from erasure by its serial number | Excluded-drive list in station data partition | Later |
| 2b | Drives that already hold an installation are marked with a symbol; **"Add to current installation"** adds to such a drive (p.143) | Same symbol and same "Add to current installation" option | Detect existing NexWipe partition label | Later |
| 3 | Confirmation dialog: **"Yes, install"** continues; **"No, shutdown"** cancels and shuts down (p.143) | Same two choices | — | Later |
| 3a | Can take several minutes; do not turn the device off | Same warning; progress bar | — | Later |
| 4 | **"Port mapping configuration"** window: pick a Blancco Hardware Solution from the list, or **"Other"** for any other hardware (p.143) (manual does not explain port mapping further) | Same window; list contains "Other (desktop, laptop, etc.)" only — Blancco hardware n/a for NexWipe; NexWipe's own drive-bay hardware list is added later if needed (port mapping = which physical drive bay is which) | Saved to station data partition | Later |
| 5 | Finished: **"Shutdown"** or **"Reboot"**; the new installation appears in the boot menu under the **ISO's file name** (p.143) | Same two buttons; boot entry named after the image file name | UEFI boot entry via `efibootmgr` (confirm in lab) | Later |

## Notes from the manual (§11.2, p.143)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Once installed, can send reports to a BMP account; all reports also stored on the installation drive | Same: send to the NexWipe web app; every report also kept on the station's data partition | Same report upload as live mode + local copy | Later |
| 2 | Any image configuration can be made installable when configuring the image | Same: any stick settings version can be marked "installable" | Setting on the stick settings page | Later |
| 3 | Recommended: "Report Per Connected Device" mode before installing; suits individual reports for connected drives and Chromebooks | Same recommendation (Chromebooks Later) | Pre-set (see Prerequisites row 3) | Later |
| 4 | With multiple installations on different drives, those installations can in some cases erase disks that have installations on them | NexWipe goes stricter: every drive carrying a NexWipe installation is excluded from erasure on every NexWipe station unless the owner explicitly un-excludes it (safety: never erase the system you run from) | Detect NexWipe partition label in detection step | Later |
| 5 | In most use cases keep all installations on one disk | Same advice | Help page | Later |

## Troubleshooting

| # | Blancco does | NexWipe builds (same) | Phase |
|---|---|---|---|
| 1 | No troubleshooting item specific to permanent installation in §15 (pp.180–181); the two items there (§15.1, §15.2) are Chromebook issues, covered in `../15-special-hardware/chromebooks.md` with the general "how to make an issue report" steps | Same: no station-specific troubleshooting yet; issue reports use the same "Report an issue" log bundle as live mode; Chromebook items in plan `../15-special-hardware/chromebooks.md` | Later |
