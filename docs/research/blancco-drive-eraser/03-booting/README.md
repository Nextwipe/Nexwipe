# Step 3 — Booting Blancco Drive Eraser

## In short
BDE starts from USB, CD, PXE, GRUB or a permanent installation and runs in RAM. A hidden boot menu (5 seconds,
arrow keys) offers several start modes; the default, "FLR during startup", removes freeze locks during boot because
laptops wake up more reliably then. Secure Boot is supported. See also [permanent installation](permanent-installation.md).

## 3.1 Minimum system requirements (§1, p.13)
- 64-bit x86 machine / ARM64-based servers.
- 4 GB RAM in most cases; servers with 2+ drives need more.
- CD drive for CD boot; USB port for USB boot and for saving reports.
- Optional: SVGA display 1024×768+ and VESA video card for the GUI.
- Optional: Ethernet NIC and DHCP server on the local network.
- Desktops: a power supply sufficient for all connected drives.
- The manual covers "the Drive Eraser family for x86 based computer architectures" (§1, p.13). ARM laptops and
  other non-x86 architectures (RISC, ARM) cannot be erased directly; drives can be moved to an x86 "erasure station"
  (§8.1, p.103). Most Intel Atom "Clover Trail" tablets are not supported.
- Datasheet/search: PXE needs 2 GB.

## 3.2 Boot media
- USB stick made by USB Creator; CD; PXE (network boot); GRUB environment; installed copy ("Installer" boot option, §11).
- In what it boots: the Common Criteria report — delivered as an `.iso`, "The software runs in RAM using information
  from the .iso file".
- Mac: some Macs won't boot from USB — burn to CD; external optical drive if none internal; no PXE (Apple KB).

## 3.3 Boot options (§7.1, p.79–80; KB "Alternative boot modes")
Hidden by default. Press up/down arrow "right after the first Blancco Drive Eraser static screen appears"; time limit
5 seconds. From USB the option is chosen in the GRUB menu (KB).

| # | Option | Behaviour |
|---|---|---|
| 1 | Normal startup (safe resolution) | Standard/universal graphics driver, fixed 1024×768. Freeze-lock removal (FLR) attempted just before erasure. Generic driver "often presents display problems when the machine is awakened". |
| 2 | Normal startup (native resolution) | Driver matching the graphics card; native resolution. FLR just before erasure. Works better than option 1 "in many/most cases" when FLR is needed. |
| 3 | Installer | Installs the software permanently on a machine, e.g. to process loose drives or Chromebooks. Reports are stored on the installation drive, exportable to USB or BMP. |
| 4 | **FLR during startup — the default** | FLR during the boot phase, "before loading all the system drivers, to increase the chances to wake up the machine after the freeze lock removal". Then native-resolution driver. |
| 5 | Show startup messages | Same as option 2 but shows boot messages instead of the animation — for machines that hang while booting. |
| 6 | Customized startup | Enable/disable FLR at boot and extra kernel parameters (see CT manual). Requires BDE 6.3.0+ and CT 2.3.0+ (KB). |

### When to use them (§7.1.2)
If FLR in the default mode causes black screens or unresponsive machines:
1. Try option 2 (native resolution).
2. If still black/unresponsive, try option 1 (safe resolution).
3. If BDE hangs while booting, use "Show startup messages", note the last messages, contact Blancco Support.
Troubleshooting: Dell Latitude 9430 may have UI frame-rate issues with the FLR option — use safe resolution (§15.4, p.181).

## 3.4 Secure Boot
- UEFI Secure Boot supported from 6.3.0 (§1, p.13).
- Surface Pro 4 needs "Microsoft & 3rd party CA" (§8.10).
- Macs need "No Security" (Apple KB).

## 3.5 Monitors during and after boot (§7.17, p.92)
- External monitor mirroring and monitor hot-plugging are enabled by default and not configurable.
- Laptop lid can be closed; the device will not sleep and external monitors keep working.
- Hot-swapped monitors are not reported; only monitors present at startup are in the hardware report.

## 3.6 What happens at the end of boot
- If the CT option is set, the CD tray ejects after boot (default phase for CD-eject) (§7.19).
- If removable flash devices are connected at startup, a popup warns they may contain user data (§8.7).
- If Block SID is active on a drive, a popup asks whether to disable it (step 7).
- If "Clear TPM" is enabled, a popup asks whether to clear the TPM (step 7).
- If "Clear persistent reservations" is enabled in CT, NVMe persistent reservations are cleared during boot (§4.2.3.6).
- In Semi-automatic/Automatic mode the erasure then starts by itself (step 6).
