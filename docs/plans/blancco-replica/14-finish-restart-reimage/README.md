# Plan — Step 14 — Finishing: restart, shutdown, eject

Mirrors: research [14-finish-restart-reimage/README.md](../../../research/blancco-drive-eraser/14-finish-restart-reimage/README.md)

## In short
At the end NexWipe Eraser lets the laptop stay on, restart or shut down — after any erasure or only after a fully
successful one, chosen on the "Prepare stick" page. The engine refuses to restart/shut down until the report is safely
backed up (sent to the web app or saved to USB), because an unsaved report lives only in memory (RAM) and vanishes at
power-off. The wiped drive is left with no operating system. Reimaging is in [reimaging.md](reimaging.md) (Later).

## In short (research section) — parity rows
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Machine can stay on, restart or shut down at the end | Same three outcomes | Step 5 of the process (§14.1) | V1 |
| …after any erasure or only after a fully successful one | Same two choices | Setup-file options below | V1 |
| Report must be backed up first; unsaved reports live only in memory | Same rule, enforced: no restart/shutdown until report is sent or saved (technician can override only by typing a clear "discard report" confirmation) | Engine checks `report.backed_up` before `systemctl reboot/poweroff` | V1 |
| Drive is left without an operating system | Same; screen says so at the end | §14.3 | V1 |
| Reimaging covered in reimaging.md | Same, in [reimaging.md](reimaging.md) | — | Later |

## 14.1 Restart/Shutdown step (§4.6, §7.2, p.56, p.80)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Step 5 | Step 5 in the step bar | Kiosk UI | V1 |
| The dedicated step exists only if CT Process = Automatic and Shutdown or Restart is selected | Same: step 5 appears as its own tab only when mode = Automatic and a Restart/Shutdown option is chosen | Kiosk reads setup file | V1 |
| Semi-automatic and Automatic always show a shutdown/restart popup at the end of testing | Same popup | Kiosk modal (step 06) | V1 |

CT options → Prepare stick page options:
| Option | Blancco behaviour | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| None (default) | No automatic restart/shutdown | Same, default | `finish.action: none` | V1 |
| Restart, after erasure | All drives erased; success optional | Same | `restart_after_erasure`; trigger when every selected drive has a final result | V1 |
| Restart, after successful erasure | All drives erased successfully with no exceptions or informative exceptions only | Same: only when every drive's result is "Erased" with no exceptions, or with informative-only notes (step 11 result rules) | `restart_after_success` | V1 |
| Shutdown, after erasure | All drives erased; success optional | Same | `shutdown_after_erasure` | V1 |
| Shutdown, after successful erasure | As above, successful only | Same | `shutdown_after_success` | V1 |

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "Note that a report has to always be backed up before the machine shuts down or restarts!" | Enforced, not just a note: automatic restart/shutdown waits until the report is sent or saved; if it can't be, the laptop stays on and shows "Report not saved" | Engine gate | V1 |
| Shutdown button / F10 (step 4) | Shutdown button in header + F10 shortcut | Kiosk key handler → same backup gate | V1 |
| If Block SID was disabled, BDE suggests re-enabling it on shutdown/restart (§7.29.2) | Same suggestion: if NexWipe turned off Block SID (a firmware setting that stops anyone taking ownership of a self-encrypting drive) to unlock a drive, the finish screen reminds the technician to turn it back on in the laptop's BIOS | Engine records `block_sid_changed`; kiosk reminder (step 07; exact BIOS route confirm in lab) | V1 |

## 14.2 CD eject (§7.19, p.92)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Configurable in CT | Configurable on Prepare stick page | `eject.*` flags in setup file | V1 |
| Ejects every optical drive tray | Same: every optical tray found | `eject /dev/srN` for each optical drive (util-linux) | V1 |
| …after boot (default) | Same, default on | Engine at start-up | V1 |
| …after erasure | Same option | Engine event `erasure_done` | V1 |
| …after report saved/sent | Same option | Engine event `report_backed_up` | V1 |
| …when shutting down | Same option | Before `systemctl poweroff` | V1 |
| Purpose: prevents leaving the boot CD or other media in a machine being shipped | Same purpose (NexWipe boots from USB, so it also shows "Remove the NexWipe stick" at shutdown) | Kiosk message | V1 |
| "very important, that at least one option for ejecting the CD tray is selected" | Prepare stick page refuses to save with all four eject options off | Form validation | V1 |

## 14.3 State of the laptop afterwards
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| No operating system: "For future use of the erased computer, an operating system must be installed." (§1) | Same fact stated on the finish screen and in help (own wording) | Kiosk + help page | V1 |
| Optional: drive formatted NTFS/FAT32/exFAT (step 8) | Same optional format after erasure | `mkfs.ntfs` / `mkfs.vfat -F 32` / `mkfs.exfat` (step 08) | V1 |
| Optional: Bootable asset report splash | Same optional small boot screen showing the report summary | Step 08/13 | V1 |
| Optional: Fingerprint sector (step 13) | Same optional fingerprint sector | Step 13 | V1 |
| Preserved Windows recovery partition can be used to reimage (step 8) | Same option to keep the recovery partition (step 08); report says clearly that data in that partition was **not** erased, so result can't be a full-drive "Erased" | Step 08/11 rules | V1 |
| Computrace/Absolute may still be active in firmware (step 7) | Same warning: anti-theft software in the laptop's firmware may still be on; detected and shown in the report (step 07) | `dmidecode` / ACPI table check (confirm in lab) | V1 |
| T2 Macs: device activation may be needed after factory reset for admin access (Apple KB) | Same note for T2 Macs | Help text | Later |
| Chromebooks: see chromebooks.md, including "device stays in Developer mode" | Same note; Chromebooks stay in the separate Chromebook track (never drive-erasure jobs) | Step 15 | Later |
