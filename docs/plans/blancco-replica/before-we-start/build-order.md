# Before we start — Build order and milestones

The plan steps 00–18 follow **Blancco's order** (the same as the research), so you can compare item by item.
This file says in which **order we build** them. Estimates are guesses, not measurements.
Phase labels used in every plan file: **V1** = any device that runs Windows, any manufacturer · **Later** = Macs,
Chromebooks, servers/RAID, PXE, reimaging · **V2** = certification.

## Milestone 0 — Ready to start
- Owner decisions recorded ([owner-decisions.md](owner-decisions.md)) — done except: desktops in V1? Boot Camp Macs out?
- Test lab collected and labelled ([test-lab.md](test-lab.md)).
- Safety rules agreed and the AGENTS.md change approved ([safety-rules.md](safety-rules.md), plan step 18).

## Where we are (2026-11-27)
- All owner decisions made ([owner-decisions.md](owner-decisions.md)); AGENTS.md eraser rule applied.
- Owner chose to start building now and ask the IT warehouse for test laptops only when a step needs real hardware.
- **Next piece: Milestone 1, part 1 — the stick boots and lists every drive (no erasing yet).** Design written, waiting
  for owner approval: [`docs/superpowers/specs/2026-11-27-eraser-m1-part1-boot-and-detect-design.md`](../../../superpowers/specs/2026-11-27-eraser-m1-part1-boot-and-detect-design.md).
- Work branch: `eraser-m1-boot-detect` (nothing committed yet).

### Milestone 1 broken into parts
| Part | What | Needs real laptop? |
|---|---|---|
| 1 | Eraser stick boots, graphical screen lists all drives + warnings (no erasing) | No (virtual laptop); real laptop optional |
| 2 | Unlocking: freeze-lock sleep/wake, HPA/DCO removal | Yes (freeze lock only happens on real laptops) |
| 3 | Overwrite engine + NIST Clear + verification + result rules, on virtual disks first | Virtual first, then a DISPOSABLE drive |
| 4 | Firmware commands (ATA Secure Erase/Sanitize, NVMe Format/Sanitize) + NIST Purge + NexWipe SSD method | Yes, DISPOSABLE drives |
| 5 | Report saved to the stick + independent marker test | Yes |

## Milestone 1 — First real wipe of a Windows laptop (≈ months 1–3)
Build the V1 rows of:
- 03 Booting (eraser stick boots with Secure Boot)
- 05 Detection
- 07 Removing locks (freeze lock, HPA/DCO first)
- 09 Erasure standards (overwrite engine + firmware commands; NIST Clear, NIST Purge, NexWipe SSD method first)
- 10 Verification, 11 Errors and result
- 13 Report (saved to USB; signing can follow)
**Done when:** a lab laptop's SSD is wiped to Purge level and the independent marker test (step 17, own testing) finds nothing.

## Milestone 2 — Sellable V1 (≈ months 3–6)
V1 rows of:
- 01 Preparation (new "Prepare stick" section + Stick setup page + NexWipe Stick Creator)
- 02 BIOS setup help, 04 Screen and settings (graphical screen)
- 06 Process modes (Manual / Semi-automatic / Automatic)
- 08 Erasure settings, all standards in 09
- 13 Signed reports + report library in the app
- 14 Restart/shutdown, 16 Where data may remain (all detection warnings in the report)
- 18 NexWipe integration (new section, migrations)
**Done when:** a company prepares sticks in the new section, technicians wipe Windows laptops without help, signed
reports appear in the app, and `docs/STATUS.md` is updated.

## Milestone 3 — Full Blancco parity for Windows devices (≈ months 6–10)
Remaining V1 rows: 06 workflows and remote control, 12 hardware tests (all 21), 15 special hardware for Windows devices
(eMMC, hybrid, Surface specifics…), self-encrypting drives/PSID/Block SID/TPM in 07.

## Milestone 4 — Later and V2
"Later" rows (Macs, Chromebooks, servers/RAID, PXE, reimaging) and "V2" rows (independent lab + certification, step 17).

## Owner's working rule: one sub-step at a time
Every part is split into numbered sub-steps (1.1, 1.2, 1.3 …). Only **one** sub-step is done at a time: do it, check it,
tell the owner in plain words what was done and what comes next, then start the next one. Never several at once.

## The loop for every piece of work
1. Claude writes a short design for the piece; the owner approves.
2. Claude builds it on a branch with tests; migrations rehearsed locally with an undo file.
3. The owner tests on lab hardware with Claude's step-by-step checklist.
4. Claude asks before pushing; the handover says whether there is a migration and gives the exact Lovable prompt.
5. The owner applies the migration in Lovable → checks preview → Publish.
6. `docs/STATUS.md` updated with what was tested and what is still unverified.
