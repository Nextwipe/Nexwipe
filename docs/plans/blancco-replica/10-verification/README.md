# Plan — Step 10 — Verification (checking the wipe worked)

Mirrors: research [10-verification/README.md](../../../research/blancco-drive-eraser/10-verification/README.md)

## In short
After erasing, NexWipe Eraser reads parts of the drive back and checks they hold the expected pattern — same as Blancco.
Same default (**1%**), same NIST minimum (**10%**), same 100% option, same "final verification always enforced", and the
same rule that any unreadable sector or missing pattern means **Not erased**. For firmware and crypto erases it uses the
same "write markers first, check they're gone after" method. The percentage used is printed on every report.

## 10.1 How it works (§7.13, p.88)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "Reads data at random intervals across the whole drive" and checks the overwriting patterns were written correctly; §7.7: "checking sectors at evenly spaced intervals" — "statistically most effective analysis … on any given verification percentage" | Same: NIST sampling (10.4) — the drive is split into equal sections and pseudo-random spots in each section are read, so samples are both spread evenly and unpredictable | Verifier module in the eraser engine; reads with `O_DIRECT` so the OS cache can't fake a pass | V1 |
| Default 1% ("fast process"); full 100% ("slower process"); slider in Erasure settings (§4.2.3.3.2) | Same default 1%, same 0–100% slider in the erasure settings on the laptop screen; company default and lock on the Stick setup page | Setting in `nexwipe-setup.json`; slider in the Chromium kiosk screen | V1 |
| 0% possible with certain standards; a warning appears below a standard's minimum; some standards block going below it | Same: each standard file has `verify_min` and `verify_min_enforced`; below the minimum the screen shows a warning, and enforced standards (e.g. NIST, NexWipe SSD method at 10%) stop the slider at their minimum | Standard files (plan step 9) | V1 |
| "A systematic verification step is always enforced after the last overwriting pass." | Same: the engine always appends a final verification; it cannot be removed by any setting | Engine rule, unit-tested | V1 |
| Data left (patterns missing) or sectors unreadable → user alerted that the erasure failed; reason in the report | Same: red "Not erased" on screen with the reason; the report lists the failed sector ranges | Result rules (plan step 11) | V1 |
| Mismatching sectors counted as read errors (§7.7); higher percentage = more chance read errors are found | Same: a mismatch adds to the read-error count (threshold rules in plan step 11 §11.1); help text explains why 100% finds more | Verifier → error counter | V1 |

## 10.2 Traditional verification (§7.13.1)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Default algorithm | Same: the default verifier | Verifier module | V1 |
| Searches for known patterns: periodic (fixed byte e.g. 0x00, or the result of a firmware erase) or aperiodic random | Same: fixed patterns compared byte-for-byte; aperiodic random regenerated from the pass's seed and compared; after a firmware erase the expected result (commonly all 0x00 or all 0xFF) is learned from the first sample and must match everywhere | Pattern table in [overwrite-engine.md](../09-erasure-standards/overwrite-engine.md) | V1 |
| Always attempted after a firmware-based erasure | Same | Engine rule | V1 |

## 10.3 Alternative / fallback verification (§7.13.2)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Some drives' firmware commands write pseudo-random data instead of a pattern, so traditional verification fails | Same detection: if the post-firmware samples show no single pattern, switch to fallback | Verifier | V1 |
| Re-verifies "by searching for absence of known patterns overwritten prior to the execution of the firmware-based erasure command" | Same: before every firmware step the engine writes known marker blocks at pseudo-random spots (their positions and contents kept in memory); fallback checks every marker is gone | Marker writer + verifier | V1 |
| If successful the erasure succeeds, with a report exception about non-periodic patterns | Same, own wording: "Drive returned random-looking data after its erase command; checked by confirming our markers are gone" | Exception catalogue (plan step 11 §11.7) | V1 |
| IEEE/NIST r2 standards explicitly "write random data samples for verification step" before the firmware step (step 9) | Same: step 3 of those standards is this marker write | Standard files (plan step 9 §9.4) | V1 |

## 10.4 NIST sampling methods (§17.3, p.187)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| **NIST normal verification:** drive split into subsections; two pseudo-random locations per subsection verified | Same: number of subsections chosen so 2 samples per subsection add up to the chosen % | Verifier; positions from a random generator seeded per run, seed written to the report so the sampling can be re-checked | V1 |
| Used at the end of NIST Clear and Purge "where 10% of the drive is verified as a minimum" and in all other standards | Same: 10% minimum enforced for NIST Clear/Purge (and r2/IEEE); same method for all standards | Standard files | V1 |
| "Selecting any Blancco erasure standard and setting a verification percentage equal or higher than 10% will ensure at least a clear-level erasure as defined by NIST." | Same rule for NexWipe standards: any standard with ≥10% verification may state "NIST 800-88 Clear level reached" (if all else succeeded); below 10% it may not | Level calculation (plan step 11) | V1 |
| **NIST Crypto Erase verification:** pseudo-random locations written with a known pattern before Crypto Erase; read after to confirm absence; minimum 10%; used at the end of NIST Purge | Same, minimum 10% under NIST Purge | Marker method (10.5) | V1 |
| Reference: NIST SP 800-88r1 pages 20–21 | Same reference in our help text and docs | Docs | V1 |

## 10.5 Crypto erase verification (§7.24, p.96)

| Blancco step | NexWipe builds (same) | Phase |
|---|---|---|
| 1. Pseudo-random locations selected | Same | V1 |
| 2. Written with a known pattern | Same (marker blocks with a unique per-run value) | V1 |
| 3. Crypto erase triggered | Same (firmware module, [firmware-commands.md](../09-erasure-standards/firmware-commands.md)) | V1 |
| 4. Locations read to confirm the pattern is gone | Same; any marker still readable = Not erased | V1 |
| Configurable 1–100%, default 1% | Same range, same default (NIST Purge raises the minimum to 10%, see 10.4) | V1 |

## 10.6 SSD verification rules (§16.2, p.183–184)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Verification "must be completed successfully. If it cannot complete, the erasure is considered a fail." | Same | Result rules (plan step 11 §11.3) | V1 |
| Must show "no data has remained on the device (at the logical level)"; anomalies → fail | Same; report says "at the logical level" so it does not overclaim about hidden flash cells | Report wording | V1 |
| Some encrypting SSDs may consistently fail verification — contact Blancco (§16.3.3.1) | Same fact recorded; NexWipe equivalent of "contact Blancco": the report's failure reason links to NexWipe support, and the drive model is added to our command support table | Support link + lab table | V1 |
| Drive must respond and present itself operational after erasure | Same: re-identify the drive (same serial and size) before verification | Engine check | V1 |

## 10.7 Visual check

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Hex viewer (§4.2.3.4) shows sector contents so the pattern (e.g. 0x00, 0xAA, 0x924924…) can be seen | Same: hex viewer on the laptop screen — pick a drive and sector number, see raw hex and text | Local API reads one sector; page in the kiosk screen (plan step 4) | V1 |
| Don't confuse Fingerprint / Bootable asset report sectors with leftover data (step 16) | Same warning in the hex viewer: those sectors are labelled "NexWipe fingerprint" / "NexWipe bootable report" | Viewer knows the sectors it wrote (plan step 13 §13.7–13.8) | V1 |

## 10.8 Recommended levels

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Apple KB: for Mac drives that can't be purged, "Aperiodic Random Overwrite" or "HMG Lower Standard" with **100% verification** gives clear-level | Same recommendation for Macs | Later |
| Common Criteria: configure verification "at 100% rather than use the quicker default value of 1%" | Same recommendation shown next to the slider and on the Stick setup page | V1 |
| Separate product Blancco Drive Verifier scans a drive's bit patterns independently (search result; not part of BDE) | n/a as a product in V1 — NexWipe's equivalent is our own independent marker test used in the lab (plan step 17); a stand-alone "NexWipe checker" mode on the stick could follow | V1 (lab tool) / Later (product) |

## How we test
- Simulated drives (loop devices): leave one block un-erased → 100% verification must catch it; at 1% and 10% check the
  catch rate matches the expected statistics over many runs.
- Firmware drive that returns random data: fallback verification must pass only if all markers are gone.
- Lab drives: our verdict must never disagree with the independent full-drive marker search (plan step 17).
