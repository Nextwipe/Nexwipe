# Blancco USB Creator (how sticks are made)

Source: **Blancco USB Creator User Manual for version 4.9.0** (17 pages, ©2023), official PDF
https://download.blancco.com/products/erasure/usb_creator/manuals/usb_creator_user_manual_en_US.pdf — read in full
2026-11-26. Plus KB pages "USB Creator Quick Start Guide" (updated 2025-11-27) and "How to USB Boot Blancco Drive Eraser" (2024-02-19).
Section numbers below refer to that manual.

## In short
A Windows program that turns one or more USB sticks into bootable Blancco sticks at the same time. You tick the sticks,
add one or more ISO images (downloaded from your Blancco Management Portal account or picked from disk), optionally put
offline licences on the stick, and click Create USB. The sticks are formatted (everything on them is lost) and written.
The ISO itself is configured beforehand with the separate Drive Eraser Configuration Tool.

## 1. What it is (§1.1)
"a tool for creating bootable USB media from ISO images to use with Blancco Erasure Software and Data Verification
Software" — i.e. Blancco Drive Eraser, Blancco Drive Verifier, Blancco Mobile Diagnostics and Erasure.

## 2. System requirements (§1.3)
- Windows 10, 11.
- Blancco Drive Eraser 7 or newer; Mobile Diagnostics and Erasure 4.15 or newer.
- USB port(s).
- USB stick **1 GB or larger** — "note that the space is limited to 32 GB".

## 3. Installation (§2)
1. Extract the delivered .zip and run the .exe.
2. Choose setup language → accept licence agreement → optional desktop shortcut → Install → Finish.
3. Asks to close older running versions.
4. Settings, credentials and logs persist across reinstall/update; "Remove all settings, credentials and log files"
   on uninstall resets everything.

## 4. Screen layout (§3.1)
1. **Top area** — language, settings, report an issue, help (opens latest manual PDF).
2. **USB stick selection area** — all detected USB sticks, each with a checkbox.
3. **ISO file selection area** — the images to put on the sticks.
4. **Create USB** button (bottom right).
Start screen (Quick Start Guide): connect to a Blancco account, or press **Skip** to work with local ISO files.
"Back" returns to the account screen (hidden while logged in).

## 5. Settings (§3.1.4)
One setting only: **boot menu timeout** — how long the stick's boot menu waits before starting the default image;
change or remove it; Save / Cancel.

## 6. Choosing sticks (§3.2.1)
- Tick **one or more** detected USB sticks; all become bootable at the end. **Ctrl+A** selects/deselects all.
- Each stick must have enough space for all selected ISO files (total shown under the list).
- KB (search result): the stick needs a listed manufacturer and a drive letter in Windows.

## 7. Adding images (§3.3)
- **Download from a Blancco Management Portal account:** log in, pick from download options; files remembered for
  the session; Cancel removes finished and unfinished downloads.
- **Add from disk:** "Add" opens file explorer.
- **Several images on one stick:** order changed by dragging; **the topmost image boots by default**; trash icon removes one.

## 8. Offline licences on the stick (§3.4)
- Add licences from the BMP account to the stick so Drive Eraser can work **without a network connection** (must be logged in).
- Only for **Enterprise Volume Edition (EVE)** images; otherwise the "Manage licenses" button is hidden.
- Button "Manage offline license". (KB search result: separate "Enterprise USB Erasure Enablement" tool — max 250
  licences on a stick, needs a Blancco Cloud account, EVE only.)

## 9. Creating the sticks (§3.5)
- Click **Create USB** → popup with **progress per stick**.
- It first **formats** each stick, then writes the ISO files. "This action will affect your USB stick(s) and data will be lost!"
- Cancelling leaves sticks that won't boot.
- When finished, the taskbar icon blinks; all sticks listed; **failed sticks shown in red**; Done closes.
- Quick Start: enable formatting; if not, rename the stick's volume label to **BLANCCO** (Drive Eraser hides sticks
  labelled BLANCCO from erasure).

## 10. Report an issue (§3.1.3)
Saves a troubleshooting report to send to Blancco support.

## 11. Booting from the stick afterwards (KB "How to USB Boot")
1. Insert the stick, turn on / restart.
2. Set USB as first boot device, or pick it from the boot menu.
3. Press the boot-menu key repeatedly right after power-on; "If the Windows Logo appears, you are too late".
4. Keys ("not a complete list"): ASUS F8/Esc · Dell laptop/desktop F2/F12 · Dell server F11 · HP laptop/desktop Esc/F9 ·
   HP server F11 · Lenovo F12 (Fn+F12) · Apple: hold Option.
5. If it boots the existing OS, the stick was not created correctly. Related KB: Microsoft 3rd-party UEFI CA must be allowed.

## Not covered by the manual
Exact disk filter rules (beyond "USB sticks"), file system/partition layout written, whether it verifies the stick by
reading back, maximum number of sticks at once.
