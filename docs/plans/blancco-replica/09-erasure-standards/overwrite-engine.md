# Plan — Step 9 (extra) — The overwrite engine

Mirrors: research [09-erasure-standards/README.md](../../../research/blancco-drive-eraser/09-erasure-standards/README.md)
§9.1, §9.3, §9.4 (overwrite parts), §9.8, and the error rules in
[11-errors-and-result/README.md](../../../research/blancco-drive-eraser/11-errors-and-result/README.md) §11.1

## In short
The overwrite engine is the part of NexWipe Eraser that writes patterns over **every sector** of a drive. It runs the
pass lists below exactly as the standards define them, handles bad sectors the way Blancco does (halve the block, three
tries, count one error), stops at the same thresholds, and can resume magnetic standards after a power cut. It is one
program (Rust or Go) on the stick; the laptop screen (Chromium kiosk) talks to it on 127.0.0.1 and it accepts only jobs
that pass the safety checks ([safety-rules.md](../before-we-start/safety-rules.md)).

There is no separate Blancco research page for the engine — Blancco only publishes the step lists. This file turns each
step list into what the engine actually does. Anything below that is our engineering choice (not a Blancco fact) is marked
"our choice".

## Patterns the engine must generate (every pattern used in §9.3 / §9.4)

| Pattern (as written in the research) | Used by | How the engine makes it | Phase |
|---|---|---|---|
| 0x00 | HMG Lower, GB46864 HDD, AFSSI, OPNAV, NSA, Gutmann, RCMP, Schneier, BSI-2011-VS, BSI-GS/GSE, NIST family | 1-byte fixed pattern repeated across a write buffer | V1 |
| 0xFF | GB46864 HDD, AFSSI, OPNAV, Gutmann, RCMP, Schneier, NIST Clear (removable flash) | 1-byte fixed | V1 |
| 0xAA | HMG Higher, CESG, DoD, DoD ECE, AFSSI, Army, Gutmann | 1-byte fixed | V1 |
| 0x55 | HMG Higher, CESG, DoD, DoD ECE, Army, Gutmann | 1-byte fixed | V1 |
| 0x35, 0xCA, 0x97 | NCSC-TG-025 | 1-byte fixed | V1 |
| 0xCB | Extended Firmware Based Erasure | 1-byte fixed | V1 |
| 0x11, 0x22, 0x33, 0x44, 0x66, 0x77, 0x88, 0x99, 0xBB, 0xCC, 0xDD, 0xEE | Gutmann | 1-byte fixed | V1 |
| 0xFFFFFFFF, 0xFFFFFFE4 | NAVSOP-5239-26 | 4-byte pattern repeated (byte order as written, confirm against the standard's text in lab) | V1 |
| 0x555555, 0xAAAAAA, 0x924924, 0x492492, 0x249249, 0x6DB6DB, 0xB6DB6D, 0xDB6DB6 | Gutmann | 3-byte pattern repeated; buffer size chosen as a multiple of 3 × sector size so the pattern never breaks at a block edge (our choice) | V1 |
| random byte | HMG Higher, CESG, DoD, DoD ECE, Army, OPNAV, RCMP, Random byte 3x | one random byte value picked per pass, repeated over the whole drive; value recorded so verification knows what to expect | V1 |
| random pattern | GB46864 HDD | random multi-byte block repeated (our reading of "random pattern"; confirm against GB46864-2025 text) | V1 |
| aperiodic random | Aperiodic random, Schneier, NAVSOP, NCSC, NSA, Gutmann, DoD ECE, BSI-GS/GSE/GSK, NexWipe SSD method | non-repeating stream from a seeded cipher (ChaCha20 or AES-CTR, our choice); seed kept in memory so verification can regenerate the expected bytes | V1 |
| BSI random pattern | BSI-2011-VS | random pattern per BSI-2011-VS; first verification checks it at 100% (confirm exact definition in lab) | V1 |
| configured pattern (Static / Aperiodic) | NIST 800-88 Clear | 0x00 by default, or aperiodic random if chosen | V1 |

## Pass list per standard (the engine's job list)
Each arrow is one pass; "V" is a verification pass (plan step 10). Firmware steps (FW) are handed to the firmware module
([firmware-commands.md](firmware-commands.md)) and the engine waits for the result.

| Standard | Engine job list | Passes |
|---|---|---|
| HMG IS5 Lower | 0x00 → V | 1 |
| HMG IS5 Higher | 0xAA → 0x55 → random byte → V | 3 |
| CESG CPA Higher Level | 0xAA → V → 0x55 → V → random byte → V | 3 |
| GB46864-2025 (HDD) | 0x00 → random pattern → 0xFF → V | 3 |
| GB46864-2025 (SSD) | deallocate → FW chain → (regular overwrite only if no FW command supported) → V | 2 |
| DoD 5220.22-M | 0x55 → 0xAA → random byte → V | 3 |
| DoD 5220.22-M ECE | 0x55 → 0xAA → random byte → aperiodic → 0x55 → 0xAA → random byte → V | 7 |
| Bruce Schneier | 0xFF → 0x00 → aperiodic ×5 → V | 7 |
| NAVSOP-5239-26 | 0xFFFFFFFF → 0xFFFFFFE4 → aperiodic → V | 3 |
| NCSC-TG-025 | 0x35 → 0xCA → 0x97 → aperiodic → V | 4 |
| AFSSI 5020 | 0x00 → 0xFF → 0x00 → 0xAA → V | 4 |
| U.S. Army AR380-19 | random byte → 0xAA → 0x55 → V | 3 |
| OPNAVINST 5239.1A | 0xFF → 0x00 → random byte → V | 3 |
| NSA 130-1 | aperiodic → aperiodic → 0x00 → V | 3 |
| Peter Gutmann | aperiodic ×4 → 0x555555 → 0xAAAAAA → 0x924924 → 0x492492 → 0x249249 → 0x00 → 0x11 → 0x22 → 0x33 → 0x44 → 0x55 → 0x66 → 0x77 → 0x88 → 0x99 → 0xAA → 0xBB → 0xCC → 0xDD → 0xEE → 0xFF → 0x924924 → 0x492492 → 0x249249 → 0x6DB6DB → 0xB6DB6D → 0xDB6DB6 → aperiodic ×4 → V | 35 |
| Aperiodic random overwrite | aperiodic → V | 1 |
| RCMP TSSIT OPS-II | 0x00 → 0xFF → 0x00 → 0xFF → 0x00 → 0xFF → random byte → V | 7 (Blancco's table says 8) |
| Random byte overwrite (3x) | random byte ×3 → V | 3 |
| Extended Firmware Based Erasure | 0xCB → FW → V | 1 |
| BSI-2011-VS | BSI random → V 100% (presence of BSI pattern) → FW (ESE → SE) → 0x00 → V ≥5% → reset MBR | 1–2 |
| BSI-GS | hidden-area removal → aperiodic → FW → 0x00 → V | 1–2 |
| BSI-GSE | hidden-area removal → aperiodic → aperiodic → FW → 0x00 → V | 2–3 |
| BSI-GSK | aperiodic → V | 1 |
| NIST 800-88 Clear | hidden-area removal → (ATA SSD: FW SE →) 0x00/configured → V; removable flash: 0x00 → 0xFF → V | 0–1 |
| NIST 800-88 | hidden-area removal → FW chain → full overwrite → V | 0–1 |
| IEEE 2883 Clear / NIST r2 Clear | … → FW chain → overwrite 0x00 (ATA, SCSI, NVMe positions as in README §9.4) → V | 0–1 |
| NexWipe SSD method | hidden-area removal → FW purge → aperiodic → FW (if supported) → V ≥10% | 2+ |

Note: RCMP's step list has 7 overwrites but Blancco's round table says 8. The engine runs the listed steps exactly; the
picker shows Blancco's "8"; what Blancco counts as the 8th round is to be confirmed in lab.

## How one overwrite pass runs

| Behaviour | NexWipe builds | How | Phase |
|---|---|---|---|
| Covers every sector, first to last | Yes, including sectors freed by HPA/DCO/AMA removal | Size re-read after hidden-area removal; engine refuses to start if size changed unexpectedly | V1 |
| Bypasses the operating system's cache | Yes | Open the block device with `O_DIRECT`, aligned buffers, large blocks (1–8 MB, our choice; tune per drive in lab) | V1 |
| Fast fixed patterns on SAS (Blancco "Use WRITE SAME command", default On, SCSI/SAS only — research step 8) | Same setting, same default On, SAS only | `sg_write_same` (sg3_utils) | Later |
| Progress | % done, MB/s, time left per drive and overall | Engine streams progress to the screen over the local API | V1 |
| Temperature watch | Pause overwrite when drive is too hot, continue when cooled (our choice; NVMe drives overheat) | `smartctl -A` / `nvme smart-log` polled each minute | V1 |
| Many drives at once | One worker per drive, configurable maximum | Worker pool in the engine | V1 |
| Pause / resume / cancel | Allowed during overwrite passes only; never during firmware commands | Buttons disabled while FW step runs | V1 |
| Every write range logged | Block-range log, compressed, attached to the report detail | Engine log file → report | V1 |

## Bad sectors and errors (research §11.1)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| 1. Try to write (read) the area | Same | Normal large-block write/read | V1 |
| 2. On error, try half the block size; repeat down to the smallest block | Same | Recursive halving down to one logical sector | V1 |
| 3. Smallest block fails after **three tries** → unreachable, **one error** counted | Same: 3 tries, 1 error | Counter per drive, separate for write and read | V1 |
| 4. All reachable areas still erased; only unreachable areas reported; total shown in UI and report | Same | List of unreachable sector ranges in the report | V1 |
| At least one read/write error (overwrite or verification) → "Not erased" | Same | Result rules (plan step 11) | V1 |
| Write-error threshold, CT, **default 5** → stop immediately, failed, report message | Same, default 5, on the Stick setup page | `nexwipe-setup.json` → engine aborts the job | V1 |
| Similar threshold for read errors | Same (default 5, our choice until confirmed) | Same | V1 |
| Remapped-sector threshold reached before/after erasure → stopped and failed | Same | SMART reallocated count via `smartctl` before and after | V1 |

## Resume after interruption (research §9.8)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Progress kept on a USB stick, a few KB per drive | Same size; kept on the NEXWIPE stick's state partition | `resume/<serial>.json`: standard, step index, seed for aperiodic passes, time | V1 |
| Restart at the start of the interrupted step | Same | Engine skips completed steps, restarts the current one at sector 0 | V1 |
| Only magnetic standards | Same | Standard file flag `resumable: true` only on §9.3 standards | V1 |
| An interrupted run is never reported as success | Same: the interrupted attempt is recorded; only a fully completed resumed run can end "Erased" | Report keeps both attempts | V1 |

## How we test
- Virtual disks (loop devices) for every standard: after the run, an independent checker (not the engine) reads the
  whole disk and confirms the last pattern.
- Error injection with Linux `dm-flakey` / `dm-error` (makes chosen sectors fail): checks halving, 3 tries, counting,
  threshold 5, and Not erased on a single error.
- Power-cut test for resume on a DISPOSABLE lab HDD.
- Speed test on each lab drive against its rated write speed.
