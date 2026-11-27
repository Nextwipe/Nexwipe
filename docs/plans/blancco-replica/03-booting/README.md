# Plan — Step 3 — Booting NexWipe Eraser

Mirrors: research [03-booting/README.md](../../../research/blancco-drive-eraser/03-booting/README.md)

## In short
NexWipe Eraser is a small Linux system (Debian base, sibling of today's station image in `agent-handoff/usb-image/`)
that starts from the USB stick and runs entirely in RAM, with Secure Boot left on (Microsoft-signed shim → signed GRUB →
signed kernel). A hidden boot menu (5 seconds, arrow keys) offers the same six start modes as Blancco; the default runs
freeze-lock removal during boot because laptops wake up more reliably then. After boot, the laptop screen (a local web
app in full-screen Chromium talking to the eraser engine on 127.0.0.1) appears. See also
[permanent installation](permanent-installation.md).

Words: **RAM** = the laptop's working memory; nothing written there survives power-off. **GRUB** = the program that
shows the boot menu and starts Linux. **FLR** = freeze-lock removal (sleep the laptop for a few seconds, wake it, so
drives accept erase commands again). **Kernel parameters** = start-up options passed to Linux.

## 3.1 Minimum system requirements (§1, p.13)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | 64-bit x86 machine | Same: 64-bit x86 (Intel/AMD) | amd64 build | V1 |
| 2 | ARM64-based servers | Same later: arm64 build for servers | Second build target | Later |
| 3 | 4 GB RAM in most cases; servers with 2+ drives need more | Same **4 GB** requirement; eraser checks RAM at start and shows a clear message if too low; servers: more | Read `/proc/meminfo` | V1 |
| 4 | CD drive for CD boot; USB port for USB boot and for saving reports | Same: USB port for boot and report backup; CD boot later | — | V1 (USB) / Later (CD) |
| 5 | Optional: SVGA display 1024×768+ and VESA video card for the GUI | Same minimum 1024×768; laptop screen layout designed to fit 1024×768 | Chromium kiosk; fallback graphics driver | V1 |
| 6 | Optional: Ethernet NIC and DHCP server on the local network | Same: Ethernet or Wi-Fi (Wi-Fi from the setup file); works offline too | NetworkManager (confirm in lab) | V1 |
| 7 | Desktops: a power supply sufficient for all connected drives | Same note on the help page | Help page | V1 |
| 8 | Covers x86 computers only; ARM laptops and other non-x86 machines (RISC, ARM) cannot be erased directly — drives can be moved to an x86 "erasure station" | Same: ARM laptops (e.g. Windows-on-ARM) not erased directly in V1; screen says "not supported — move the drive to a station"; station = permanent installation | Detection + message | V1 (message) / Later (station) |
| 9 | Most Intel Atom "Clover Trail" tablets are not supported | Same: listed as unsupported in model notes | Model notes table | V1 |
| 10 | Datasheet/search: PXE needs 2 GB | Same target for network boot | PXE package | Later |

## 3.2 Boot media

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | USB stick made by USB Creator | Stick made by NexWipe Stick Creator (plan [usb-creator.md](../01-preparation/usb-creator.md)) | — | V1 |
| 2 | CD | Downloadable `.iso` that can be burned to a CD | Hybrid ISO build | Later |
| 3 | PXE (network boot) | Network boot package | Same signed chain over network | Later |
| 4 | GRUB environment | Boot entry for an existing GRUB setup | Same kernel + RAM image | Later |
| 5 | Installed copy ("Installer" boot option, §11) | Permanent installation (see [permanent-installation.md](permanent-installation.md)) | — | Later |
| 6 | Common Criteria report: delivered as an `.iso`; "The software runs in RAM using information from the .iso file" | Same: whole system loaded into RAM from a compressed read-only file, so the stick may even be pulled out after boot (except when backups/resume need it) | squashfs loaded to RAM (`toram`, as in today's station image) | V1 |
| 7 | Mac: some Macs won't boot from USB — burn to CD; external optical drive if none internal; no PXE | Same Mac advice | Plan step 15 | Later |

## 3.3 Boot options (§7.1, p.79–80; KB "Alternative boot modes")

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| a | Hidden by default | Same: menu hidden | GRUB `timeout_style=hidden` (confirm in lab) | V1 |
| b | Press up/down arrow right after the first static start screen appears | Same: up/down arrow shows the menu | GRUB hidden-menu key handling | V1 |
| c | Time limit 5 seconds | Same **5 s** (changeable in Stick Creator settings) | `timeout=5` | V1 |
| d | From USB the option is chosen in the GRUB menu | Same — our stick uses GRUB | — | V1 |

Menu entries (same six, same order, same behaviour, our own names):

| # | Blancco option | Blancco behaviour | NexWipe entry (same) | How | Phase |
|---|---|---|---|---|---|
| 1 | Normal startup (safe resolution) | Standard graphics driver, fixed 1024×768. FLR just before erasure. Generic driver "often presents display problems when the machine is awakened" | "Start NexWipe — safe graphics": generic driver, 1024×768, FLR just before erasure; same warning in help | Kernel parameter `nomodeset` + 1024×768 framebuffer; engine flag `flr=before-erase` (confirm in lab) | V1 |
| 2 | Normal startup (native resolution) | Driver matching the graphics card; native resolution. FLR just before erasure. Better than option 1 "in many/most cases" when FLR is needed | "Start NexWipe — unlock later": normal graphics driver, native resolution, FLR just before erasure | Normal kernel graphics drivers; `flr=before-erase` | V1 |
| 3 | Installer | Installs the software permanently, e.g. for loose drives or Chromebooks; reports stored on the installation drive, exportable to USB or BMP | "Install as erasure station" | See [permanent-installation.md](permanent-installation.md) | Later |
| 4 | **FLR during startup — the default** | FLR during boot, "before loading all the system drivers", to raise the chance of waking; then native-resolution driver | **"Start NexWipe" (default)**: sleep-wake early in boot, before graphics/most drivers load, then normal graphics | Early-boot step in the RAM image running `rtcwake -m mem -s 3` before graphics drivers load; `flr=boot` (order confirm in lab) | V1 |
| 5 | Show startup messages | Same as option 2 but shows boot messages instead of the animation — for machines that hang while booting | "Start NexWipe — show messages": as entry 2, text boot messages, no splash | Drop `quiet splash` | V1 |
| 6 | Customized startup | Enable/disable FLR at boot and extra kernel parameters (see CT manual). Requires BDE 6.3.0+ and CT 2.3.0+ | "Start NexWipe — custom": FLR on/off and extra kernel parameters set on the web app's stick settings page (plan 01 §1.1 row 30). Blancco versions n/a | Entry generated from setup file | V1 |

### When to use them (§7.1.2)
If FLR in the default mode causes black screens or unresponsive machines:

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Try option 2 (native resolution) | Same advice: try "unlock later" | Help page + shown on a stick that recorded a failed wake last boot | V1 |
| 2 | If still black/unresponsive, try option 1 (safe resolution) | Same: then "safe graphics" | Help page | V1 |
| 3 | If it hangs while booting, use "Show startup messages", note the last messages, contact Blancco Support | Same, contact **NexWipe support**; boot log also saved to the stick to send with "Report an issue" | Log to stick's hidden state area | V1 |
| 4 | Troubleshooting: Dell Latitude 9430 may have UI frame-rate issues with the FLR option — use safe resolution (§15.4, p.181) | Same entry in model notes | Model notes table | V1 |

## 3.4 Secure Boot

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | UEFI Secure Boot supported from 6.3.0 | Supported from first release; Blancco version n/a | Microsoft-signed shim → signed GRUB → signed kernel; no unsigned kernel modules in V1 | V1 |
| 2 | Surface Pro 4 needs "Microsoft & 3rd party CA" | Same model note | Model notes | V1 |
| 3 | Macs need "No Security" | Same Mac note | Plan step 15 | Later |

## 3.5 Monitors during and after boot (§7.17, p.92)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | External monitor mirroring and monitor hot-plugging enabled by default and not configurable | Same: always mirror, hot-plug works, no setting | Display auto-config in the kiosk session (e.g. `xrandr`/Wayland compositor mirror, confirm in lab) | V1 |
| 2 | Laptop lid can be closed; the device will not sleep and external monitors keep working | Same | systemd-logind `HandleLidSwitch=ignore` | V1 |
| 3 | Hot-swapped monitors are not reported; only monitors present at startup are in the hardware report | Same rule | Read monitor info (EDID) once at start | V1 |

## 3.6 What happens at the end of boot

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | If the CT option is set, the CD tray ejects after boot (default phase for CD-eject) (§7.19) | Same option | `eject` | Later (CD) |
| 2 | If removable flash devices are connected at startup, a popup warns they may contain user data (§8.7) | Same popup (they stay hidden from erasure unless the setting allows them) | Detection at start | V1 |
| 3 | If Block SID is active on a drive, a popup asks whether to disable it (step 7) | Same popup | Plan step 07 | V1 |
| 4 | If "Clear TPM" is enabled, a popup asks whether to clear the TPM (step 7) | Same popup | Plan step 07 | V1 |
| 5 | If "Clear persistent reservations" is enabled, NVMe persistent reservations are cleared during boot (§4.2.3.6) | Same | `nvme resv-release`/`resv-register` (confirm in lab) | Later |
| 6 | In Semi-automatic/Automatic mode the erasure then starts by itself (step 6) | Same | Plan step 06 | V1 |
