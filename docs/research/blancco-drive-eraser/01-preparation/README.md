# Step 1 — Preparation (before touching any laptop)

## In short
An administrator decides almost everything in advance with the **Configuration Tool (CT)**: process mode, allowed
erasure standards, verification level, error thresholds, report fields, portal connection, and whether technicians
may change anything. The configured image is written to many identical USB sticks with **USB Creator**. Licences come
from the **Blancco Management Portal (BMP)** over the network or from a **HASP** dongle.

## 1.1 The Configuration Tool (CT)
The manual refers to CT throughout. Things that are set **only** (or by default) in CT:

| Setting area | What CT controls | Manual |
|---|---|---|
| Process | Manual / Semi-automatic / Automatic / Workflow. "can only be changed via the CT software" | §4.1, p.30 |
| Erasure standards list | Show only a subset, e.g. "only standards that comply with your company policy" | §4.2.3.3.1, p.39 |
| Erasure options presets | Remove hidden areas, erase remapped sectors, enforce SSD method, partitions, verification | §4.2.3.3, §7.8–7.12 |
| Lock settings | Locks erasure settings **and** the settings dialog together ("either everything or nothing", except language and keyboard) | §4.7.9, p.62 |
| Error thresholds | Write-error threshold (default 5), read-error threshold, remapped-sector threshold | §7.7–7.8, p.83 |
| Automatic restart/shutdown | None / Restart / Shutdown, after any or only successful erasure | §7.2, p.80 |
| Automatic report backup | Send to BMP, fall back to USB (Manual process only) | §7.4, p.81 |
| Resume erasure | Resume after power loss (needs a USB stick) | §7.10, p.86 |
| Fingerprint / Bootable asset report | On/off, fingerprint sector | §7.20–7.21 |
| CD eject | When to eject the tray | §7.19 |
| Security options | Persistent software (Computrace) detection, Clear TPM, Block SID dialog, drive life estimate, health percentage, merge NVMe namespaces, storage controller mode switching, clear persistent reservations | §7.15, §7.27, §7.29, §7.31, §8.3.1, §7.22.1 |
| Fallback NIST Purge → Clear | "Enable fallback from NIST Purge to NIST Clear" | §7.28, p.99 |
| RAID dismantling | Disabled by default | §7.22 |
| Hide SAN devices | CT > Process > Show more | §7.6 |
| Removable flash devices | Hidden by default; showing them must be enabled | §8.7 |
| Hybrid drive allow-list | Add/remove known SSHD models | §8.2.2 |
| Custom boot | "Customized startup" boot parameters (needs BDE 6.3.0 + CT 2.3.0) | §7.1, KB |
| Custom digital signature | Own RSA key, BDE 6.12+ with CT 2.12+ | §1, p.13; blog |
| Remote monitoring / remote control | Process control = Local UI or BMP remote | §7.23 |
| Advanced report as default view | | §4.5.2 |

## 1.2 Making the boot media
- If BDE is an `.iso`, "make a bootable USB-stick or burn it to a CD" (§1, p.14).
- A bootable USB stick is created "with the help of Blancco USB Creator tool" (§1, p.13).
- For Apple T2 Macs, the KB says to build the stick with Blancco USB Creator (3.4.0 mentioned).
- **Integrity:** "Blancco provides the SHA256 checksum of the ISO image in the delivery email." The user should check it
  with a SHA-256 tool (§1, p.14). The Common Criteria evaluators repeat this recommendation.
- Any removable stick whose label contains "BLANCCO" is always excluded from the erasable drives, so BDE cannot
  erase its own boot stick (§8.7, p.112).

## 1.3 Network alternatives
- PXE network boot "if there is a dedicated network for erasing machines" and machines support PXE; booting via
  GRUB is also possible (§1, p.13). Optional: Ethernet NIC and a DHCP server on the local network.
- BDE can itself run a DHCP server (§4.7.11) — see step 4.
- Mac EFI firmware cannot PXE-boot natively (Apple KB).

## 1.4 Licences (§4.7.8, p.61–62)
- Two licence types:
  - **Erasure licences** — "necessary to erase drives. Consuming one erasure license allows the user to save/send reports."
  - **Asset licences** — used when there are no erasure licences (or nothing was erased) to save/send a hardware-only
    asset report.
- Licence control is "either from a local HASP dongle, or from the BMP via the network."
- "There must be enough licenses in order to start the erasure or save/send an asset report."
- The licence icon shows available licences and assets per machine; Enterprise Subscription Edition shows subscription
  status instead of a count.
- NVMe drives with namespaces "will consume 1 license per drive" whether merged or not (§8.3.1, p.105).
- Common Criteria report lists three licensing ways: through the management console, a HASP dongle, or "a TOE
  configured to use BIOS time settings".

## 1.5 Compatibility notes (§1, p.13)
- UEFI Secure Boot supported as of 6.3.0.
- 6.6.0 and newer are fully compatible with BMP.
- Releases older than 4.8.0 are not compatible "due to updated Digital Signature".
- Digital signature customisable from 6.12 via CT 2.12+.
