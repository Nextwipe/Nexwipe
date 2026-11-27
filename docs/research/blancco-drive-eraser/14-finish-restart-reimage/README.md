# Step 14 — Finishing: restart, shutdown, eject

## In short
At the end the machine can stay on, restart or shut down — after any erasure or only after a fully successful one.
The report must be backed up first because unsaved reports live only in memory. The drive is left without an operating
system. Reimaging after erasure is covered in [reimaging.md](reimaging.md).

## 14.1 Restart/Shutdown step (§4.6, §7.2, p.56, p.80)
- Step 5. The dedicated step exists only if CT Process = Automatic and Shutdown or Restart is selected.
- Semi-automatic and Automatic always show a shutdown/restart popup at the end of testing.
- CT options:
  | Option | Behaviour |
  |---|---|
  | None (default) | No automatic restart/shutdown |
  | Restart, after erasure | All drives erased; success optional |
  | Restart, after successful erasure | All drives erased successfully with no exceptions or informative exceptions only |
  | Shutdown, after erasure | All drives erased; success optional |
  | Shutdown, after successful erasure | As above, successful only |
- "Note that a report has to always be backed up before the machine shuts down or restarts!"
- Shutdown button / F10 (step 4). If Block SID was disabled, BDE suggests re-enabling it on shutdown/restart (§7.29.2).

## 14.2 CD eject (§7.19, p.92)
Configurable in CT; ejects every optical drive tray at: after boot (default), after erasure, after report saved/sent,
when shutting down. Prevents leaving the boot CD or other media in a machine being shipped. "very important, that at
least one option for ejecting the CD tray is selected".

## 14.3 State of the laptop afterwards
- No operating system: "For future use of the erased computer, an operating system must be installed." (§1).
- Optional: drive formatted NTFS/FAT32/exFAT (step 8); Bootable asset report splash; Fingerprint sector (step 13).
- Preserved Windows recovery partition can be used to reimage (step 8).
- Computrace/Absolute may still be active in firmware (step 7).
- T2 Macs: device activation may be needed after factory reset for admin access (Apple KB).
- Chromebooks: see [Chromebooks](../15-special-hardware/chromebooks.md), including "device stays in Developer mode".
