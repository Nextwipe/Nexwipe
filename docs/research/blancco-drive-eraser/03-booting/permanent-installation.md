# Permanent installation (erasure station)

**In short**
- Normally Blancco Drive Eraser (BDE) runs "live" from RAM after booting from a USB stick; nothing you change survives a reboot. A *permanent installation* puts BDE onto one internal drive of the machine so changes persist and no boot stick is needed afterwards (§11, p.142).
- You start it by choosing "Installer" from the BDE boot menu; it needs a stick made with Blancco USB Creator, BDE 7.5.1+, CT 3.5.1+, UEFI boot mode and at least 10 GB free on an internal drive (§11.1, p.142).
- The target drive is formatted, and it is then hidden from erasure on that installation (§11.2, pp.142–143).
- Blancco recommends "Report Per Connected Device" mode plus Hotplug, so the machine works as a station producing one report per connected drive or Chromebook (§11.1, p.142; §11.2 notes, p.143).

Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), chapter 11, pp.142–143.

Terms used here:
- **Live installation**: the software is loaded from the boot device into the machine's memory (RAM) and runs from there; it is thrown away at power-off.
- **CT (Configuration Tool / BDE CT)**: Blancco's tool for editing the settings baked into a BDE image file (ISO).
- **Report Per Connected Device mode**: a BDE mode that makes a separate report for each drive or Chromebook connected to the station, instead of one report for the whole machine.
- **Hotplug**: connecting and disconnecting drives while the station is running.
- **UEFI boot mode**: the modern PC firmware start-up mode (as opposed to legacy BIOS).
- **BMP**: Blancco Management Portal, Blancco's cloud/server console where reports are collected.

## What it is (§11, p.142)

- Normally BDE is a live installation, run directly from the machine's RAM, loaded from the boot device. Any changes made to this image are not available on the next boot.
- With a permanent installation, BDE is permanently installed on the drive of the machine. This image can save changes and have them available on the next boot. No external boot media is required any more.
- Selecting **"Installer"** from the boot menu launches the installer for a permanent installation of BDE onto one of the disks of the current device. When booting finishes, the installer's **Welcome** screen is shown.

## Prerequisites (§11.1, p.142)

- The installer can only be run from a USB stick created with the **Blancco USB Creator**.
- **CT 3.5.1 or newer** to configure the image file.
- Recommended: modify the image to **"Report Per Connected Device"** mode and activate the **Hotplug** functionality.
- **Blancco Drive Eraser 7.5.1 or newer.**
- **10 GB or more** of free disk space on the drive where the installation is made.
- Installation on **external drives is not supported**.
- The computer must be in **UEFI boot mode**.

## Installation process (§11.2, pp.142–143)

Throughout the installation, three controls stay visible at the bottom of the screen:
- **Language** – change the current language.
- **Keyboard layout** – change the current keyboard layout.
- **Exit** – shut down or restart the machine.

Steps:
1. The **Welcome Screen** is shown when the installation starts. Press **"Next"** (p.142).
2. Choose the drive BDE will be installed to, then click **"Start a new installation"**. This **formats the drive** (p.142).
   - This drive will not be available or visible for erasure on this specific installation (p.143).
   - Drives that already hold a Blancco installation are marked with a symbol (screenshot in manual). You can add an installation to such a drive with **"Add to current installation"** (p.143).
3. A confirmation dialog appears. **"Yes, install"** continues; **"No, shutdown"** cancels the installation and shuts the computer down (p.143).
   - Installation can take several minutes. Do not turn the device off while it is running.
4. When installation is done, the **"Port mapping configuration"** window appears. If you use a Blancco Hardware Solution, select it from the list; for any other hardware (desktop, laptop, etc.) choose **"Other"** (p.143). (Port mapping tells BDE how physical drive bays/ports are laid out; the manual does not explain it further here.)
5. Installation is finished. Click **"Shutdown"** or **"Reboot"**. The new installation appears in the boot menu under the **name of the ISO's file name** (p.143).

## Notes from the manual (§11.2, p.143)

- Once installed, BDE can be configured to send reports to a BMP account. All reports are consistently stored on the installation drive.
- Any image configuration can be made into an installable image when configuring the image.
- Before installing an image on a machine, Blancco recommends configuring it to "Report Per Connected Device" mode; this mode suits producing individual reports for connected drives and Chromebooks.
- When there are multiple installations on different drives, those installations can in some cases erase disks that have installations on them.
- In most use cases, keep all the installations on one disk.

## Troubleshooting

The manual's troubleshooting chapter (§15) has no item specific to permanent installation in pp.180–181. The two items there (§15.1 "Required files not found", §15.2 "Device stays in Developer mode after erasure") are Chromebook issues and are in `../15-special-hardware/chromebooks.md`, along with the general "how to make an issue report" steps from §15.
