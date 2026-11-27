# Step 2 — Preparing the laptop (BIOS / firmware settings)

## In short
Before booting BDE the technician plugs in the charger, clears pre-boot passwords, sets storage to AHCI and makes
sure the clock is right. Drive passwords must be removed or entered, otherwise only overwriting (not firmware erase)
is possible. Some laptop models need special BIOS settings for the sleep-wake trick that removes freeze locks.

## 2.1 The manual's checklist ("Booting and Computer Settings", §1, p.14)
- Check all drives are attached properly.
- Check the BIOS clock time is up to date (report timestamps depend on it).
- Laptops: plug in the power adapter — "There may be problems when erasing a laptop on battery power."
- Disable or type the BIOS passwords requested during the booting phase (pre-boot passwords). "Other kinds of BIOS
  passwords do not usually prevent erasing the drive."
- Disable power-saving features in the BIOS. Note: usually not needed; in a recycling centre or corporate setting do it
  only if a given model has problems with power saving on; with just one licence "it is prudent to do this".
- Set storage configuration to **"AHCI" (not "RAID")**.
- Boot from the BDE USB/CD and double-check "that all data storage devices have been detected correctly".
- Back up anything you want to keep first; "For future use of the erased computer, an operating system must be installed."

## 2.2 Drive passwords
- "Blancco Drive Eraser cannot erase password protected drives, unless the password is entered by the user before
  the software boots" (§4.2.3.6, p.44).
- "Password protected drives can only be overwritten, because the password protection prevents executing firmware
  commands onto the drives. If purging these drives is required, the password protection must be removed from the
  BIOS/UEFI settings" (§8.6, p.112).
- An ATA SSD with a **Master Password** set cannot be erased with firmware commands nor written to; if the password
  can't be retrieved or bypassed, "it cannot be erased" (§16.2.2, p.184).

## 2.3 Settings that help firmware erase work
- For ATA SSDs not shown or with no firmware command access: change mode from IDE/ATA to **AHCI/SATA Native** (§16.1, p.183).
- Disable BIOS HDD detection when using remapped-sector erasure (§7.8, p.84).
- Enable S3 sleep / Suspend-to-RAM ("ACPI Standby State" = S3) so freeze-lock removal can work (Freeze Lock KB).
- Dell Latitude 3480 and 5480: disable "Block Sleep (S3 State)" under Power Management (KB 11635677).
- BIOS up/downgrade can matter — KB examples: Surface 3 BIOS 1.50410.218 fails, 1.51116.78 works; Lenovo X1 Tablet
  20GHS0S100: 1.55 or lower supports S3, 1.57+ does not.
- Remove external peripherals, especially Thunderbolt, on Macs (they "do not react properly" to freeze-lock removal) (Apple KB).

## 2.4 Secure Boot
- Supported since BDE 6.3.0 (§1, p.13), so normally it can stay on.
- Microsoft Surface Pro 4: Secure Boot must be "Microsoft & 3rd party CA", not "Microsoft only" (§8.10, p.113).
- Intel Macs / T2 Macs: Startup Security Utility → Secure Boot "No Security", External Boot "Allow booting from
  external media"; T2 also needs an external keyboard; a factory-reset Mac needs activation completed to get admin
  access (Apple KBs). See step 15.

## 2.5 Other things that can block
- **Block SID Authentication** on self-encrypting drives — handled from inside BDE with a reboot (step 7).
- RAID mode — BDE can dismantle some RAID controllers, but for laptops AHCI is the expected setting.
- Firmware updates on SSDs may help drives that consistently fail (§16.3.3.2), with no guarantee.
