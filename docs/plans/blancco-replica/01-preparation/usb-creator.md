# Plan — Blancco USB Creator (how sticks are made) → NexWipe Stick Creator

Mirrors: research [01-preparation/usb-creator.md](../../../research/blancco-drive-eraser/01-preparation/usb-creator.md)

Research source: Blancco USB Creator User Manual v4.9.0 (§ numbers below are from it), KB "USB Creator Quick Start
Guide" and KB "How to USB Boot Blancco Drive Eraser".

## In short
**NexWipe Stick Creator** is a Windows 10/11 program, downloaded from the web app's "Prepare stick" section, that turns
one or more USB sticks into bootable NexWipe sticks at the same time. You tick the sticks, add one or more eraser images
(downloaded from your NexWipe account or picked from disk), and click Create. The sticks are formatted (everything on
them is lost) and written, then read back to check. The image's settings are chosen beforehand on the web app's stick
settings page (plan [README.md](README.md) §1.1). Why a Windows program: a website cannot write a bootable stick by itself.

## 1. What it is (§1.1)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Tool for creating bootable USB media from ISO images for Blancco Drive Eraser | Same for **NexWipe Eraser** images | Windows desktop app (suggest .NET/WPF or Rust + WebView2; decide in build) | V1 |
| 2 | … also for Blancco Drive Verifier | n/a for NexWipe now — no separate verifier product. Our "Test only" image (hardware tests, no erasure) can be put on the stick instead | Second image type | V1 |
| 3 | … also for Blancco Mobile Diagnostics and Erasure | n/a for NexWipe — phones are not in scope | — | Later |

## 2. System requirements (§1.3)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Windows 10, 11 | Same: Windows 10 and 11 | Signed installer (code-signing certificate so SmartScreen doesn't warn) | V1 |
| 2 | Blancco Drive Eraser 7 or newer | Accepts NexWipe Eraser images from the first release; refuses images older than its minimum version with a clear message | Version field inside the image's signed manifest | V1 |
| 3 | Mobile Diagnostics and Erasure 4.15 or newer | n/a for NexWipe — no mobile product | — | Later |
| 4 | USB port(s) | Same | — | V1 |
| 5 | USB stick **1 GB or larger** — "space is limited to 32 GB" | Minimum = size of chosen images (target image fits in 2 GB; **8 GB** stick recommended); same **32 GB** usable-space cap so the FAT32 layout works (FAT32 = a disk format every PC firmware can read) | Size check before writing | V1 |

## 3. Installation (§2)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Extract the delivered .zip and run the .exe | Download a signed installer from "Prepare stick" → "Download Stick Creator" and run it (no .zip step needed) | Installer published with SHA-256 on the page | V1 |
| 2 | Choose setup language → accept licence agreement → optional desktop shortcut → Install → Finish | Same steps in the same order, our own licence text | Standard Windows installer (e.g. WiX MSI or Inno Setup) | V1 |
| 3 | Asks to close older running versions | Same | Installer checks for running process | V1 |
| 4 | Settings, credentials and logs kept across reinstall/update | Same | Stored in the user's AppData folder; sign-in token in Windows Credential Manager | V1 |
| 5 | Uninstall option "Remove all settings, credentials and log files" resets everything | Same option on uninstall | Uninstaller deletes AppData folder + stored credential | V1 |

## 4. Screen layout (§3.1)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Top area** — language | Same language picker | — | V1 |
| 2 | Top area — settings | Same (see §5) | — | V1 |
| 3 | Top area — report an issue | Same (see §10) | — | V1 |
| 4 | Top area — help (opens latest manual PDF) | Help opens the NexWipe help page for Stick Creator | Link to web app help page | V1 |
| 5 | **USB stick selection area** — all detected USB sticks, each with a checkbox | Same; **only removable USB sticks** are listed — internal disks, the Windows drive and external USB hard disks are never shown | Windows disk list filtered by bus type = USB and removable media (rules unit-tested) | V1 |
| 6 | **ISO file selection area** — images to put on the sticks | Same | — | V1 |
| 7 | **Create USB** button (bottom right) | Same place; label "Create sticks" | — | V1 |
| 8 | Start screen: connect to a Blancco account, or **Skip** to work with local ISO files | Same: sign in with the NexWipe account (with two-step code), or **Skip** to use image files on disk | Web app sign-in in the system browser, token handed back | V1 |
| 9 | "Back" returns to the account screen (hidden while logged in) | Same | — | V1 |

## 5. Settings (§3.1.4)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | One setting only: **boot menu timeout** — how long the stick's boot menu waits before starting the default image | Same single setting; default **5 s** (matches the eraser's hidden menu, plan 03-booting §3.3) | Written into the stick's `grub.cfg` as `timeout` | V1 |
| 2 | Change it or remove it | Same; "remove" = boot the default image at once | `timeout=0` (confirm in lab) | V1 |
| 3 | Save / Cancel | Same | — | V1 |

## 6. Choosing sticks (§3.2.1)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Tick **one or more** detected USB sticks; all become bootable at the end | Same | Parallel writes, one worker per stick | V1 |
| 2 | **Ctrl+A** selects/deselects all | Same | — | V1 |
| 3 | Each stick must have enough space for all selected images (total shown under the list) | Same total shown; sticks too small are greyed out with the reason | Size check | V1 |
| 4 | KB: the stick needs a listed manufacturer and a drive letter in Windows | Same visible requirements: stick must report a manufacturer; if it has no drive letter we still list it but explain (confirm in lab whether Windows needs one to write) | Windows device properties | V1 |

## 7. Adding images (§3.3)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Download from a Blancco Management Portal account**: log in, pick from download options | Download from the NexWipe web app: the company's **current eraser image** with its signed setup file (`nexwipe-setup.json`) | HTTPS download; SHA-256 checked against the app | V1 |
| 2 | Files remembered for the session | Same | Cache in AppData for the session | V1 |
| 3 | Cancel removes finished and unfinished downloads | Same | Delete cached files | V1 |
| 4 | **Add from disk:** "Add" opens file explorer | Same (for offline use); signature of the image and setup file checked before it can be written | Windows file picker | V1 |
| 5 | **Several images on one stick** | Same, e.g. "NexWipe Eraser" + "NexWipe Test only" | One boot-menu entry per image | V1 |
| 6 | Order changed by dragging | Same | — | V1 |
| 7 | **The topmost image boots by default** | Same | First entry = GRUB default | V1 |
| 8 | Trash icon removes one | Same | — | V1 |

## 8. Offline licences on the stick (§3.4)
NexWipe equivalent: **offline credit pack** (wipe credits, no charge in V1; payment Later).

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Add licences from the account to the stick so the eraser works **without a network connection**; must be logged in | Same: put a signed offline credit pack on the stick; must be signed in | Pack signed by the app: "N credits for stick X until date Y" | Later (V1 is online-only and free) |
| 2 | Only for **Enterprise Volume Edition (EVE)** images; otherwise the button is hidden | n/a for NexWipe — one edition. Button shown only when the company has offline packs enabled | Company flag | Later |
| 3 | Button "Manage offline license" | Same button "Manage offline credits" | — | Later |
| 4 | KB: separate "Enterprise USB Erasure Enablement" tool — max **250** licences on a stick, needs a Blancco Cloud account, EVE only | Built into Stick Creator, no separate tool; same max **250** credits per stick; needs a NexWipe account | Limit enforced by the server when signing the pack | Later |

## 9. Creating the sticks (§3.5)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Click **Create USB** → popup with **progress per stick** | Same | Progress bar per stick | V1 |
| 2 | It first **formats** each stick, then writes the images | Same order. Stick layout: GPT partition table, FAT32 boot partition (signed shim → GRUB → kernel + eraser system), hidden state area for stick identity, report backups and logs | Windows disk APIs (diskpart-equivalent) | V1 |
| 3 | Warning: "This action will affect your USB stick(s) and data will be lost!" | Same meaning in our words, **plus** the user types the word `ERASE` to confirm | Confirm dialog | V1 |
| 4 | Cancelling leaves sticks that won't boot | Same warning shown on Cancel | — | V1 |
| 5 | When finished, the taskbar icon blinks | Same | Windows taskbar flash | V1 |
| 6 | All sticks listed; **failed sticks shown in red** | Same | — | V1 |
| 7 | Done closes | Same | — | V1 |
| 8 | Quick Start: enable formatting; if not, rename the stick's volume label to **BLANCCO** (eraser hides sticks labelled BLANCCO) | Volume label always set to **`NEXWIPE`**; the eraser always hides it. No "skip formatting" option in V1 | Label set during format | V1 |
| — | (Not in Blancco manual) read-back check | Extra safety: every stick is read back and compared with the image's SHA-256; mismatch = red | Read back after write | V1 |

## 10. Report an issue (§3.1.3)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Saves a troubleshooting report to send to support | Same: saves a log bundle; can also upload it straight to the web app for NexWipe support | Zip of logs, no stick contents, no passwords | V1 |

## 11. Booting from the stick afterwards (KB "How to USB Boot")

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Insert the stick, turn on / restart | Same instruction on the help page; **plus** the Windows helper `Start NexWipe.exe` on the stick: double-click on the laptop → "Restart into NexWipe?" → restarts straight into the stick | Helper writes a one-time UEFI start-up entry (exists today in `agent-handoff/windows-helper/`) | V1 |
| 2 | Set USB as first boot device, or pick it from the boot menu | Same instruction | Help page | V1 |
| 3 | Press the boot-menu key repeatedly right after power-on; "If the Windows Logo appears, you are too late" | Same advice in our words | Help page | V1 |
| 4 | Key: ASUS F8/Esc | Same in our key list | Help page; lab confirms each | V1 |
| 5 | Key: Dell laptop/desktop F2/F12 | Same | Help page | V1 |
| 6 | Key: Dell server F11 | Same | Help page | Later (servers) |
| 7 | Key: HP laptop/desktop Esc/F9 | Same | Help page | V1 |
| 8 | Key: HP server F11 | Same | Help page | Later (servers) |
| 9 | Key: Lenovo F12 (Fn+F12) | Same | Help page | V1 |
| 10 | Key: Apple — hold Option | Same | Help page | Later (Macs) |
| 11 | "Not a complete list" | Same note; list grows from lab results per model | — | V1 |
| 12 | If it boots the existing OS, the stick was not created correctly | Same advice; first re-run Stick Creator's read-back check | Help page | V1 |
| 13 | Related KB: Microsoft 3rd-party UEFI CA must be allowed | Same: our shim is signed by Microsoft's 3rd-party UEFI CA, so the BIOS must allow it (plan 02 §2.4) | Help page | V1 |

## Not covered by the manual
Blancco's manual leaves these open. NexWipe decides them itself:

| # | Gap in Blancco manual | NexWipe decision | Phase |
|---|---|---|---|
| 1 | Exact disk filter rules (beyond "USB sticks") | Listed only if bus = USB **and** removable media **and** not the Windows system disk **and** size ≤ 256 GB (confirm in lab); unit tests: internal disk, external USB hard disk, card reader, stick → only stick listed | V1 |
| 2 | File system / partition layout written | GPT + FAT32 boot partition + hidden state partition (see §9 row 2) | V1 |
| 3 | Whether it verifies the stick by reading back | Yes, always (see §9 extra row) | V1 |
| 4 | Maximum number of sticks at once | Tested target: **10** at once; no hard cap unless lab shows problems | V1 |
