# Plan — Step 2 — Preparing the laptop (BIOS / firmware settings)

Mirrors: research [02-laptop-bios-setup/README.md](../../../research/blancco-drive-eraser/02-laptop-bios-setup/README.md)

## In short
Before starting NexWipe Eraser the technician plugs in the charger, clears pre-boot passwords, sets storage to AHCI and
checks the clock — the same checklist as Blancco. NexWipe shows this checklist in three places: the help page, the
"Prepare stick" section, and on the laptop screen as warnings when the eraser can detect the problem itself (battery,
RAID mode, clock, drive password). Per-model BIOS notes (for the sleep-wake trick that removes freeze locks) are kept
in a model-notes table in the web app, filled from lab testing.

Words: **BIOS/UEFI** = the laptop's built-in setup program, opened with a key at power-on. **AHCI** = the normal way
the laptop talks to a SATA drive (the alternative "RAID" mode hides drives behind a controller). **Freeze lock** = a
drive refusing erase commands until it is put to sleep and woken.

## 2.1 The manual's checklist ("Booting and Computer Settings", §1, p.14)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Check all drives are attached properly | Same checklist line; laptop screen lists every detected drive before erasure | Help page + detection (plan step 05) | V1 |
| 2 | Check the BIOS clock time is up to date (report timestamps depend on it) | Same line; **plus** the eraser compares the laptop clock with network time and warns if it is off by more than 5 minutes; report keeps both times | `chrony`/NTP check when online (confirm in lab); warning on screen | V1 |
| 3 | Laptops: plug in the power adapter — "There may be problems when erasing a laptop on battery power." | Same line; **plus** the eraser warns before start when on battery | Read `/sys/class/power_supply` | V1 |
| 4 | Disable or type the BIOS passwords requested during booting (pre-boot passwords). "Other kinds of BIOS passwords do not usually prevent erasing the drive." | Same line, same note | Help page | V1 |
| 5 | Disable power-saving features in the BIOS — usually not needed; in a recycling centre or company only if a model has problems with it on; with just one licence "it is prudent to do this" | Same advice; "one licence" becomes "a one-off wipe"; models with known problems are flagged in the model-notes table | Help page + model notes | V1 |
| 6 | Set storage configuration to **"AHCI" (not "RAID")** | Same line; **plus** the eraser detects Intel RST/RAID mode and shows "switch to AHCI in BIOS" | `lspci` controller class check (confirm in lab) | V1 |
| 7 | Boot from the stick/CD and double-check "that all data storage devices have been detected correctly" | Same: laptop screen asks the technician to confirm the drive list matches the laptop | Screen step before erasure | V1 |
| 8 | Back up anything you want to keep first; "For future use of the erased computer, an operating system must be installed." | Same two warnings in our words, shown in the erase confirmation | Confirmation dialog | V1 |

## 2.2 Drive passwords

| # | Blancco does | NexWipe builds (same) | How | Manual | Phase |
|---|---|---|---|---|---|
| 1 | Cannot erase password-protected drives unless the password is entered before the software boots | Same rule; drive shown as "password locked — enter the password in BIOS and restart" | ATA security state via `hdparm -I`; NVMe/Opal state via `sedutil-cli` (confirm in lab) | §4.2.3.6, p.44 | V1 |
| 2 | Password-protected drives can only be overwritten (firmware commands blocked); for purge, remove the password in BIOS/UEFI | Same: only overwrite offered; result level capped at **Clear**; message says remove the password in BIOS for Purge | Engine rule (plan steps 08/11) | §8.6, p.112 | V1 |
| 3 | ATA SSD with a **Master Password** set cannot be erased with firmware commands nor written to; if it can't be retrieved or bypassed, "it cannot be erased" | Same: result "Not erased — master password"; never "Erased" | Engine rule; report reason | §16.2.2, p.184 | V1 |

## 2.3 Settings that help firmware erase work

| # | Blancco does | NexWipe builds (same) | How | Manual | Phase |
|---|---|---|---|---|---|
| 1 | ATA SSDs not shown or with no firmware command access: change mode from IDE/ATA to **AHCI/SATA Native** | Same advice shown on that drive's error | Error message + help page | §16.1, p.183 | V1 |
| 2 | Disable BIOS HDD detection when using remapped-sector erasure | Same note shown when "erase remapped sectors" is on | Help text beside the setting | §7.8, p.84 | V1 |
| 3 | Enable S3 sleep / Suspend-to-RAM ("ACPI Standby State" = S3) so freeze-lock removal can work | Same advice; eraser checks whether S3 sleep exists and says so if not (S3 = classic sleep where memory stays powered) | Read `/sys/power/mem_sleep` for `deep` (confirm in lab); `rtcwake -m mem` | Freeze Lock KB | V1 |
| 4 | Dell Latitude 3480 and 5480: disable "Block Sleep (S3 State)" under Power Management | Same entry in model notes, shown automatically when `dmidecode` reports that model | Model-notes table keyed by maker + model | KB 11635677 | V1 |
| 5 | BIOS version can matter — Surface 3 BIOS 1.50410.218 fails, 1.51116.78 works | Same entry in model notes (model + BIOS version → advice) | `dmidecode` BIOS version match | KB | V1 |
| 6 | BIOS version can matter — Lenovo X1 Tablet 20GHS0S100: 1.55 or lower supports S3, 1.57+ does not | Same entry in model notes | Same | KB | V1 |
| 7 | Remove external peripherals, especially Thunderbolt, on Macs (they "do not react properly" to freeze-lock removal) | Same advice for Macs; also shown generally ("unplug docks before erasing") | Help page; plan step 15 | Apple KB | Later (Macs) |

## 2.4 Secure Boot

| # | Blancco does | NexWipe builds (same) | How | Manual | Phase |
|---|---|---|---|---|---|
| 1 | Supported since BDE 6.3.0, so normally it can stay on | Supported from our first release; Secure Boot stays on. Blancco version n/a | Microsoft-signed shim → signed GRUB → signed kernel (as in `agent-handoff/usb-image/`) | §1, p.13 | V1 |
| 2 | Microsoft Surface Pro 4: Secure Boot must be "Microsoft & 3rd party CA", not "Microsoft only" | Same note in model notes; general help: "allow Microsoft 3rd-party UEFI CA" (our shim needs it) | Model notes | §8.10, p.113 | V1 |
| 3 | Intel / T2 Macs: Startup Security Utility → Secure Boot "No Security", External Boot "Allow booting from external media"; T2 also needs an external keyboard; a factory-reset Mac needs activation completed for admin access | Same Mac steps | Plan step 15 | Apple KBs | Later (Macs) |

## 2.5 Other things that can block

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Block SID Authentication** on self-encrypting drives — handled from inside the eraser with a reboot | Same: dialog on the laptop screen, then reboot (plan step 07) | Firmware "physical presence" request through the TPM interface, then reboot (confirm in lab) | V1 |
| 2 | RAID mode — some RAID controllers can be dismantled, but for laptops AHCI is the expected setting | Same: laptops → "switch to AHCI"; RAID dismantling only for servers | Detection as 2.1 row 6; dismantling plan step 15 | V1 (detect) / Later (dismantle) |
| 3 | Firmware updates on SSDs may help drives that consistently fail (§16.3.3.2), with no guarantee | Same advice in the error help for repeated firmware-erase failures, with "no guarantee" | Help text | V1 |
