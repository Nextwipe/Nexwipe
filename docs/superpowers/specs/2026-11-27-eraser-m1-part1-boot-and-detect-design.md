# NexWipe Eraser — Milestone 1, part 1: the stick boots and lists every drive (no erasing yet)

Date: 2026-11-27 · Branch: `eraser-m1-boot-detect` · Plan: `docs/plans/blancco-replica/` steps 03 + 05 (V1 rows)

## What the owner gets
A new USB stick image, **NexWipe Eraser (preview, no erasing)**. Start a Windows laptop from it and its own screen shows
a NexWipe page listing every drive with the same warnings Blancco shows: type, size, serial, health, hidden areas,
freeze lock, passwords, self-encrypting drive state, NVMe special areas. Nothing is erased in this part; the program
physically has no erase code yet. That makes it safe to try on any laptop and lets us check detection before wiping.

## Reuse (from today's read-only station, unchanged)
- The image recipe: Debian 13 snapshot, signed shim → GRUB → kernel (Secure Boot on), system copied into memory,
  stick found by marker file, GPT layout with a hidden state partition.
- The drive and machine discovery code (`nd_station/discovery.py`, `capabilities.py`): identity, boot-stick exclusion,
  SATA security/frozen/sanitize flags, NVMe Identify, review flags. Copied into the eraser as a vendored, frozen copy so
  the read-only station is never edited for eraser needs.

## New code (all under the new top-level `eraser/` folder, per the AGENTS.md rule)
| Path | What |
|---|---|
| `eraser/AGENTS.md` | Eraser safety rules (from `before-we-start/safety-rules.md`) |
| `eraser/image/` | `build.sh`, `packages.txt`, `grub.cfg`, `verify-image.sh` — a sibling of `agent-handoff/usb-image/`. Boot menu: Start NexWipe Eraser (default) · safe graphics · show startup messages (plan step 03; freeze-lock entries come in part 2 when unlocking exists) |
| `eraser/engine/` | Python package `nw_eraser`: detection (step 05 V1 rows) + a small local web server on 127.0.0.1 that serves the screen and a JSON `/api/drives` |
| `eraser/screen/` | The laptop screen: plain HTML/CSS/JS page (drive cards, icons with tooltips, NexWipe look), shown full-screen by Chromium in kiosk mode under the `cage` kiosk compositor |
| `eraser/tests/` | Unit tests with recorded tool outputs per drive type |
| `.github/workflows/eraser-image.yml` | Builds the image on GitHub (manual start + on changes under `eraser/`), uploads it as a downloadable artifact only (not to the app yet) |

## Detection in this part (plan step 05, V1 rows)
Read-only commands only, each on an allow-list like today's station:
- Already have: identity, size, transport, bay, SMART identity, SATA security (enabled/locked/frozen), sanitize, NVMe Format/sanitize capabilities.
- New: **HPA** (current vs native max, `hdparm -N` read form), **DCO** (`hdparm --dco-identify`), ATA user/master password
  state, **remapped and pending sectors + temperature + health** (`smartctl -a -j`), **self-encrypting drive features**
  Opal/Opalite/Pyrite/Ruby/Enterprise, locked state, Shadow MBR, Block SID (`sedutil-cli --query`, confirm in lab),
  **NVMe namespaces / unallocated capacity / boot partitions / RPMB / write protection** (`nvme id-ctrl -o json`,
  `nvme list-ns`), eMMC detection, hybrid-drive model list, Intel RST "RAID On" warning (tell the technician to switch
  to AHCI), TPM present, BIOS password state, battery.
- Every value records its source; anything unreadable is "unknown + reason", never guessed.

Note: `hdparm` and `nvme` can also erase. In this part the image contains them but the engine's allow-list permits
only their read-only forms, and `verify-image.sh` greps the engine for any erase command string and fails the build.
They are needed anyway for part 2.

## Why Python (not Rust/Go yet)
The detection code we reuse is Python and already tested; Python is already in the image. The engine sits behind a
local API, so the later high-speed overwrite loop can be written in Rust/Go without touching the screen. Decided again
at part 3 (overwrite engine) after measuring speed.

## Not in this part
Erasing, unlocking (freeze-lock sleep/wake, HPA removal, PSID), reports to the app, the "Prepare stick" section,
Stick Creator, database changes. **No migration.** The existing read-only stick, app pages and workflows are untouched.

## Testing
1. Unit tests: recorded outputs for SATA SSD, SATA HDD with HPA/DCO, frozen drive, password-locked drive, NVMe with
   several namespaces, Opal drive, eMMC, Intel RST — each must produce the right warnings.
2. Safety tests: the allow-list refuses every erase form of `hdparm`/`nvme`/`sedutil-cli`; the build fails if erase strings appear.
3. Virtual laptop (QEMU + UEFI + Secure Boot, emulated NVMe and SATA disks): boots, screen shows both drives, boot
   stick not listed, disks byte-identical afterwards (SHA-256 before/after).
4. Real laptop: only when needed — owner asks the warehouse for 1–2 laptops and follows a short checklist.

## Done when
CI builds the image; unit and safety tests pass; the virtual laptop shows correct drive cards; disks unchanged.
`docs/STATUS.md` gets a line "NexWipe Eraser preview (detection only, no erasing): VM only, physical unverified".

## Risks
- Image size grows (Chromium + cage ≈ 300 MB) → boot partition raised from 1400 MB to ~2000 MB; sticks ≥ 4 GB.
- Graphics on some laptops → "safe graphics" boot entry; text fallback if Chromium can't start.
- `sedutil-cli` isn't in Debian's main archive → build it from pinned source in the image build (confirm), or use the
  `sed-util`-style ioctl Level 0 discovery ourselves.
