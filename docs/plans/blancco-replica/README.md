# Plan: build our own Blancco inside NexWipe

Owner's instruction (2026-11-26/27): "I want the exact same thing as Blancco — same means same."
So this plan is an **exact mirror** of the research pack [`docs/research/blancco-drive-eraser/`](../../research/blancco-drive-eraser/README.md):
- **Same steps, same order, same files.** Research step N and plan step N are the same topic.
- **Every item** in a research file (feature, setting, default, icon, shortcut, test, threshold, message) has a matching
  row in the plan file: *what Blancco does → what NexWipe builds (same) → how → phase*.
- Each plan file starts with a link to the research file it mirrors, so you can check them side by side.

## The whole process in one paragraph
(Mirrors the research front page.) Blancco Drive Eraser is a small Linux system that runs in memory from a stick, CD,
network or permanent install; it detects every drive and hiding place, removes locks, runs an erasure standard,
verifies, decides Erased / Not erased, optionally runs hardware tests, and produces a signed report.
**NexWipe builds the same:** the **NexWipe Eraser** stick (prepared from the new "Prepare stick" section with the
NexWipe Stick Creator) starts a Windows device into our own in-memory Linux system, shows a full-screen graphical screen,
detects drives and hiding places (step 05), removes locks (07), runs the chosen standard with the overwrite engine and
the drive's own firmware commands (09), verifies (10), decides the result with the same rules (11), runs hardware tests
(12), and writes a signed report to the stick and the NexWipe web app (13).

## Product mapping
| Blancco | NexWipe |
|---|---|
| Drive Eraser (bootable system on the stick) | **NexWipe Eraser** |
| Configuration Tool (desktop app) | **Stick setup** page in a new "Prepare stick" section of the NexWipe web app |
| USB Creator (Windows app) | **NexWipe Stick Creator** (Windows app downloaded from that section) |
| Management Portal (website) | **NexWipe web app** |
| Workflows | NexWipe workflow engine + editor |
| `BLANCCO` stick label | `NEXWIPE` |
| "Blancco SSD Erasure" (secret recipe) | "NexWipe SSD method" built from public standards |

## Phase labels (from the owner's decisions)
- **V1** — any device that runs Windows, from any manufacturer. Free (no payment).
- **Later** — Macs, Chromebooks, servers/RAID/data-centre features, network boot, reimaging, payments.
- **V2** — certification and independent evaluation.

## Steps (one folder each)
Same steps as the research, same order.
| # | Plan file | Mirrors research |
|---|---|---|
| 00 | [00-sources](00-sources/README.md) | [00-sources](../../research/blancco-drive-eraser/00-sources/README.md) |
| 01 | [01-preparation](01-preparation/README.md) · [usb-creator](01-preparation/usb-creator.md) | [01-preparation](../../research/blancco-drive-eraser/01-preparation/README.md) |
| 02 | [02-laptop-bios-setup](02-laptop-bios-setup/README.md) | [02](../../research/blancco-drive-eraser/02-laptop-bios-setup/README.md) |
| 03 | [03-booting](03-booting/README.md) · [permanent-installation](03-booting/permanent-installation.md) | [03](../../research/blancco-drive-eraser/03-booting/README.md) |
| 04 | [04-user-interface-and-settings](04-user-interface-and-settings/README.md) | [04](../../research/blancco-drive-eraser/04-user-interface-and-settings/README.md) |
| 05 | [05-drive-and-hardware-detection](05-drive-and-hardware-detection/README.md) | [05](../../research/blancco-drive-eraser/05-drive-and-hardware-detection/README.md) |
| 06 | [06-process-modes-and-workflows](06-process-modes-and-workflows/README.md) · [workflows](06-process-modes-and-workflows/workflows.md) | [06](../../research/blancco-drive-eraser/06-process-modes-and-workflows/README.md) |
| 07 | [07-removing-locks](07-removing-locks/README.md) | [07](../../research/blancco-drive-eraser/07-removing-locks/README.md) |
| 08 | [08-erasure-settings](08-erasure-settings/README.md) | [08](../../research/blancco-drive-eraser/08-erasure-settings/README.md) |
| 09 | [09-erasure-standards](09-erasure-standards/README.md) · [overwrite-engine](09-erasure-standards/overwrite-engine.md) · [firmware-commands](09-erasure-standards/firmware-commands.md) | [09](../../research/blancco-drive-eraser/09-erasure-standards/README.md) |
| 10 | [10-verification](10-verification/README.md) | [10](../../research/blancco-drive-eraser/10-verification/README.md) |
| 11 | [11-errors-and-result](11-errors-and-result/README.md) | [11](../../research/blancco-drive-eraser/11-errors-and-result/README.md) |
| 12 | [12-hardware-tests](12-hardware-tests/README.md) | [12](../../research/blancco-drive-eraser/12-hardware-tests/README.md) |
| 13 | [13-custom-fields-and-report](13-custom-fields-and-report/README.md) · [custom-fields-and-per-device-reports](13-custom-fields-and-report/custom-fields-and-per-device-reports.md) | [13](../../research/blancco-drive-eraser/13-custom-fields-and-report/README.md) |
| 14 | [14-finish-restart-reimage](14-finish-restart-reimage/README.md) · [reimaging](14-finish-restart-reimage/reimaging.md) | [14](../../research/blancco-drive-eraser/14-finish-restart-reimage/README.md) |
| 15 | [15-special-hardware](15-special-hardware/README.md) · [chromebooks](15-special-hardware/chromebooks.md) | [15](../../research/blancco-drive-eraser/15-special-hardware/README.md) |
| 16 | [16-where-data-may-remain](16-where-data-may-remain/README.md) | [16](../../research/blancco-drive-eraser/16-where-data-may-remain/README.md) |
| 17 | [17-independent-certification](17-independent-certification/README.md) | [17](../../research/blancco-drive-eraser/17-independent-certification/README.md) |
| 18 | [18-nexwipe-implications](18-nexwipe-implications/README.md) | [18](../../research/blancco-drive-eraser/18-nexwipe-implications/README.md) |

## Not Blancco steps, but needed to build it
Folder [`before-we-start/`](before-we-start/):
- [owner-decisions.md](before-we-start/owner-decisions.md) — the five decisions and the owner's answers.
- [test-lab.md](before-we-start/test-lab.md) — laptops and throw-away drives to test on.
- [safety-rules.md](before-we-start/safety-rules.md) — rules so the eraser can never wipe the wrong disk.
- [build-order.md](before-we-start/build-order.md) — which steps we build first, milestones, and the work loop.

## Glossary (short)
Same terms as the research glossary, with the NexWipe equivalent:
- **BDE** (Blancco Drive Eraser) → **NexWipe Eraser**, the bootable eraser.
- **CT** (Configuration Tool) → **Stick setup** page in the "Prepare stick" section.
- **BMP** (Blancco Management Portal) → **NexWipe web app**: reports, sticks, remote control.
- **HASP** (licence dongle) → n/a; V1 is free; later wipe credits live in the web app.
- **HPA / DCO** — hidden parts of a drive; NexWipe finds and removes them (step 07).
- **Freeze lock** — BIOS blocks firmware erase; NexWipe does the same sleep/wake unlock (step 07).
- **Firmware-based erasure** — the drive erases itself (Secure Erase, Sanitize, NVMe Format, TCG crypto erase) (step 09).
- **Crypto erase** — the drive throws away its encryption key (step 09).
- **TCG / Opal / SED** — self-encrypting drives (step 07).
- **PSID** — code on a self-encrypting drive's label for a factory reset that destroys data (step 07).
- **NIST 800-88 Clear / Purge** — Clear resists normal software recovery; Purge resists laboratory recovery. Reports
  state which one was reached.

## Project rules that stay in force
1. Database changes: migration + undo file, rehearsed locally, applied by the owner in Lovable with the exact prompt
   ("Apply the SQL in `drizzle/migrations/00NN_<name>.sql` to the database exactly as written. Do not modify it.");
   push → apply → check preview → Publish. Never run SQL against the live database from here.
2. Never push without asking; every handover says whether it has a migration.
3. Never present unbuilt or simulated work as real; unbuilt shows "Planned"; update `docs/STATUS.md`.
4. Never write to the owner's personal USB sticks; destructive tests only on DISPOSABLE lab drives.
5. Never claim certification; report the level actually reached; never say "verified hardware".
