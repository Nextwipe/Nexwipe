# Plan — Step 1 — Preparation (before touching any laptop)

Mirrors: research [01-preparation/README.md](../../../research/blancco-drive-eraser/01-preparation/README.md)

## In short
An owner/admin decides almost everything in advance on the **"Prepare stick" section of the NexWipe web app** (our
Configuration Tool): process mode, allowed erasure standards, verification level, error limits, report fields, server
connection, and whether technicians may change anything. The app bakes these into a signed `nexwipe-setup.json`, which
the **NexWipe Stick Creator** (Windows program) writes onto many identical sticks. Wipe credits (our "licences") come
from the NexWipe web app over the network or from an offline credit pack on the stick — no charge in V1.

Words used below: **setup file** = `nexwipe-setup.json`, signed by the app so the eraser refuses an edited copy.
**Owner/admin** = company roles that must use two-step sign-in (AAL2) to change settings. **Stick** = USB stick labelled `NEXWIPE`.

## 1.1 The Configuration Tool (CT)
NexWipe equivalent: a settings page in the web app ("Prepare stick" → "Stick settings"). Stored per company as
versioned rows (history kept) in a new table, e.g. `eraser_configurations` — owner/admin change (AAL2, via a SECURITY
DEFINER function), technicians read only. Every change produces a new signed setup file version. Things set **only**
(or by default) there:

| # | Blancco does (CT setting area) | NexWipe builds (same) | How | Manual | Phase |
|---|---|---|---|---|---|
| 1 | Process: Manual / Semi-automatic / Automatic / Workflow; "can only be changed via the CT software" | Same four modes; chosen only on the web page, never on the laptop | Radio choice → `process_mode` in setup file; eraser has no control to change it | §4.1, p.30 | V1 |
| 2 | Erasure standards list: show only a subset, e.g. "only standards that comply with your company policy" | Tick which standards technicians may pick; plus a default | Checklist → `allowed_standards[]`, `default_standard` | §4.2.3.3.1, p.39 | V1 |
| 3 | Erasure option preset: remove hidden areas | Same on/off default (hidden areas = HPA/DCO, parts of a drive hidden from the operating system) | `hdparm` to detect/remove (confirm in lab); setting `remove_hidden_areas` | §4.2.3.3, §7.8–7.12 | V1 |
| 4 | Erasure option preset: erase remapped sectors | Same on/off default (remapped sectors = worn-out spots the drive swapped for spares) | Setting `erase_remapped_sectors`; plan step 08 | §4.2.3.3, §7.8–7.12 | V1 |
| 5 | Erasure option preset: enforce SSD method | Same: "always use NexWipe SSD method on SSDs" | Setting `enforce_ssd_method` | §4.2.3.3, §7.8–7.12 | V1 |
| 6 | Erasure option preset: partitions | Same partition options (plan step 08) | Setting group `partitions` | §4.2.3.3, §7.8–7.12 | V1 |
| 7 | Erasure option preset: verification | Same default verification percentage | Setting `verification_percent` (plan step 10) | §4.2.3.3, §7.8–7.12 | V1 |
| 8 | Lock settings: locks erasure settings **and** the settings dialog together ("either everything or nothing", except language and keyboard) | Same all-or-nothing lock; language and keyboard always changeable | Setting `lock_all`; laptop screen hides/greys every other control | §4.7.9, p.62 | V1 |
| 9 | Error threshold: write-error threshold (default 5) | Same, default **5** | Setting `write_error_limit = 5` | §7.7–7.8, p.83 | V1 |
| 10 | Error threshold: read-error threshold | Same | Setting `read_error_limit` (default taken from plan step 11) | §7.7–7.8, p.83 | V1 |
| 11 | Error threshold: remapped-sector threshold | Same | Setting `remapped_sector_limit`; value read with `smartmontools` | §7.7–7.8, p.83 | V1 |
| 12 | Automatic restart/shutdown: None / Restart / Shutdown, after any or only successful erasure | Same three choices × same two conditions | Settings `after_erasure_action`, `after_erasure_when`; `systemctl reboot/poweroff` | §7.2, p.80 | V1 |
| 13 | Automatic report backup: send to BMP, fall back to USB (Manual process only) | Same: send to NexWipe web app, fall back to the stick; Manual mode only | Setting `report_backup`; stick's hidden state area | §7.4, p.81 | V1 |
| 14 | Resume erasure: resume after power loss (needs a USB stick) | Same; progress saved on the stick | Setting `resume_after_power_loss`; checkpoint file on stick | §7.10, p.86 | V1 |
| 15 | Fingerprint / Bootable asset report: on/off, fingerprint sector | Same two on/off switches + sector number | Settings `fingerprint`, `fingerprint_sector`, `bootable_report` (plan step 13) | §7.20–7.21 | V1 |
| 16 | CD eject: when to eject the tray | Same choice of phase | Setting `cd_eject_phase`; `eject` command | §7.19 | Later (CD boot is Later) |
| 17 | Security option: persistent software (Computrace) detection | Same (Computrace = anti-theft software that survives a wipe, stored in the laptop's firmware) | Setting `detect_persistent_software`; read firmware tables (method confirm in lab) | §7.15 | V1 |
| 18 | Security option: Clear TPM | Same (TPM = the laptop's security chip holding keys) | Setting `clear_tpm`; `tpm2-tools` / firmware request (confirm in lab) | §7.27 | V1 |
| 19 | Security option: Block SID dialog | Same dialog on/off (Block SID = a firmware lock on self-encrypting drives) | Setting `block_sid_dialog`; plan step 07 | §7.29 | V1 |
| 20 | Security option: drive life estimate | Same | Setting `drive_life_estimate`; `smartmontools` | §7.31 | V1 |
| 21 | Security option: health percentage | Same | Setting `health_percentage`; `smartmontools` | §7.31 | V1 |
| 22 | Security option: merge NVMe namespaces | Same (namespace = a slice of an NVMe drive that looks like its own disk) | Setting `merge_nvme_namespaces`; `nvme-cli` | §8.3.1 | V1 |
| 23 | Security option: storage controller mode switching | Same | Setting `controller_mode_switch` (method confirm in lab) | §7.22.1 | Later |
| 24 | Security option: clear persistent reservations | Same (an NVMe lock held by a server host) | Setting `clear_persistent_reservations`; `nvme-cli` | §7.22.1 | Later |
| 25 | Fallback NIST Purge → Clear: "Enable fallback from NIST Purge to NIST Clear" | Same switch; report says **Clear** when fallback used | Setting `purge_to_clear_fallback` | §7.28, p.99 | V1 |
| 26 | RAID dismantling: disabled by default | Same, **off** by default | Setting `raid_dismantle = false` | §7.22 | Later |
| 27 | Hide SAN devices: CT > Process > Show more | Same, under "Process → more" | Setting `hide_san` | §7.6 | Later |
| 28 | Removable flash devices: hidden by default; showing them must be enabled | Same, **hidden** by default | Setting `show_removable = false`; stick labelled `NEXWIPE` excluded always | §8.7 | V1 |
| 29 | Hybrid drive allow-list: add/remove known SSHD models | Same editable list (SSHD = hard disk with a small SSD cache) | Setting `sshd_models[]` | §8.2.2 | V1 |
| 30 | Custom boot: "Customized startup" boot parameters (needs BDE 6.3.0 + CT 2.3.0) | Same "Custom" boot entry with company-set options; Blancco versions n/a | Setting `custom_boot` → GRUB entry on stick | §7.1, KB | V1 |
| 31 | Custom digital signature: own RSA key, BDE 6.12+ with CT 2.12+ | Company may upload its own signing key; Blancco versions n/a | Key stored server-side, used to sign reports (plan step 13) | §1, p.13; blog | Later |
| 32 | Remote monitoring / remote control: process control = Local UI or BMP remote | Same two choices: laptop screen, or web app | Setting `process_control = local | remote` | §7.23 | V1 (monitoring) / Later (control) |
| 33 | Advanced report as default view | Same switch | Setting `advanced_report_default` | §4.5.2 | V1 |

## 1.2 Making the boot media

| # | Blancco does | NexWipe builds (same) | How | Manual | Phase |
|---|---|---|---|---|---|
| 1 | If BDE is an `.iso`, "make a bootable USB-stick or burn it to a CD" | Eraser image also offered as a downloadable `.iso` for a stick or a CD | Image build in CI (sibling of `agent-handoff/usb-image/`) | §1, p.14 | V1 (USB) / Later (CD) |
| 2 | A bootable USB stick is created "with the help of Blancco USB Creator tool" | NexWipe Stick Creator does this | See [usb-creator.md](usb-creator.md) | §1, p.13 | V1 |
| 3 | For Apple T2 Macs, the KB says to build the stick with Blancco USB Creator (3.4.0 mentioned) | Same: Mac sticks made with Stick Creator; Blancco version n/a | Plan step 15 | KB | Later |
| 4 | **Integrity:** SHA-256 checksum of the ISO given in the delivery email; user checks it; Common Criteria evaluators repeat this | SHA-256 of every image shown on the "Prepare stick" page; Stick Creator checks it automatically before writing | `sha256sum` at build; check in Stick Creator | §1, p.14 | V1 |
| 5 | Any removable stick whose label contains "BLANCCO" is always excluded from the erasable drives | Any removable stick whose label contains **`NEXWIPE`** is always excluded; plus the stick the eraser booted from is excluded by device identity | Engine filter on volume label + boot device | §8.7, p.112 | V1 |

## 1.3 Network alternatives

| # | Blancco does | NexWipe builds (same) | How | Manual | Phase |
|---|---|---|---|---|---|
| 1 | PXE network boot "if there is a dedicated network for erasing machines" and machines support PXE; GRUB boot also possible. Optional: Ethernet NIC and a DHCP server on the local network | Network boot package (PXE = start a PC over the network) and a GRUB boot entry for companies with a boot server | Same signed shim → GRUB → kernel, served over network | §1, p.13 | Later |
| 2 | BDE can itself run a DHCP server (§4.7.11) | Same option in the eraser (DHCP = hands out network addresses) | `dnsmasq` in DHCP mode (confirm in lab) — plan step 04 | §4.7.11 | Later |
| 3 | Mac EFI firmware cannot PXE-boot natively | Same limitation documented | Note in Mac plan (step 15) | Apple KB | Later |

## 1.4 Licences (§4.7.8, p.61–62)
NexWipe equivalent: **wipe credits** — same counting idea, **no charge in V1; payment Later**. Ledger is an append-only
table (`credit_ledger`) per company, changed only by server functions.

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Erasure licences** — "necessary to erase drives. Consuming one erasure license allows the user to save/send reports." | **Erasure credits**: one used per erased drive, which allows saving/sending the report | Reserve at start, confirm when signed report arrives, refund if not erased | V1 (no charge) |
| 2 | **Asset licences** — used when there are no erasure licences (or nothing was erased) to save/send a hardware-only asset report | **Asset credits** for hardware-only reports | Same ledger, separate credit type | V1 (no charge) |
| 3 | Licence control "either from a local HASP dongle, or from the BMP via the network" | From the NexWipe web app via network, or from a signed **offline credit pack** on the stick (instead of a HASP dongle = a USB licence key) | Pack = signed token "N credits for stick X until date Y" | V1 network / Later offline pack |
| 4 | "There must be enough licenses in order to start the erasure or save/send an asset report." | Same: refuse to start / refuse to send when balance too low | Check in the server function before start | V1 |
| 5 | The licence icon shows available licences and assets per machine | Same icon on the laptop screen showing erasure and asset credits | Eraser asks server for balance | V1 |
| 6 | Enterprise Subscription Edition shows subscription status instead of a count | Same option later: show "subscription active" instead of a count | Company plan flag | Later |
| 7 | NVMe drives with namespaces "will consume 1 license per drive" whether merged or not (§8.3.1, p.105) | Same: 1 credit per physical NVMe drive, not per namespace | Count by drive serial | V1 |
| 8 | Common Criteria report lists three licensing ways: management console, HASP dongle, or "a TOE configured to use BIOS time settings" | Same three in spirit: web app; offline pack; offline pack whose expiry is checked against the laptop clock (TOE = "target of evaluation", the product being evaluated) | Pack expiry vs BIOS clock (clock can be wrong — plan 02 §2.1) | V1 / Later / Later |

## 1.5 Compatibility notes (§1, p.13)

| # | Blancco does | NexWipe equivalent | Phase |
|---|---|---|---|
| 1 | UEFI Secure Boot supported as of 6.3.0 | Secure Boot supported from the first eraser release (signed shim) | V1 |
| 2 | 6.6.0 and newer are fully compatible with BMP | Every eraser release works with the web app; the app rejects eraser versions too old for its API with a clear message | V1 |
| 3 | Releases older than 4.8.0 are not compatible "due to updated Digital Signature" | n/a for NexWipe — no older releases. Same principle: when the signing key changes, the app lists which eraser versions it still accepts | V1 |
| 4 | Digital signature customisable from 6.12 via CT 2.12+ | Company signing key (see 1.1 row 31); Blancco versions n/a | Later |
