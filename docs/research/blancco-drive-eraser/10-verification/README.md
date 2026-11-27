# Step 10 — Verification (checking the wipe worked)

## In short
After erasing, BDE reads parts of the drive back and checks they contain the expected pattern. The default is only
**1%** of the drive; NIST standards need at least **10%**; the independent evaluators recommend **100%**. A final
verification after the last pass is always enforced. Any unreadable sector or missing pattern fails the erasure.

## 10.1 How it works (§7.13, p.88)
- "The verification process reads data at random intervals across the whole drive and makes sure that the erasure's
  overwriting patterns were written correctly." (§7.7 describes it as "checking sectors at evenly spaced intervals"
  — "statistically most effective analysis … on any given verification percentage".)
- Default 1% ("fast process"); full 100% ("slower process"). Slider in Erasure settings (§4.2.3.3.2).
- 0% possible with certain standards; a warning appears below a standard's minimum; some standards block going below it.
- "A systematic verification step is always enforced after the last overwriting pass."
- If data is left (patterns missing) or sectors can't be read → user alerted that the erasure failed; reason in the report.
- Mismatching sectors are counted as read errors (§7.7). Higher percentage = more chance read errors are found.

## 10.2 Traditional verification (§7.13.1)
Default algorithm. Searches for known patterns across the drive: periodic (fixed byte e.g. 0x00, or the result of a
firmware erase) or aperiodic random. Always attempted after a firmware-based erasure.

## 10.3 Alternative / fallback verification (§7.13.2)
Some drives' firmware commands write pseudo-random data instead of a pattern, so traditional verification fails.
Then BDE re-verifies "by searching for absence of known patterns overwritten prior to the execution of the
firmware-based erasure command". If successful the erasure succeeds, with a report exception about non-periodic patterns.
(IEEE/NIST r2 standards explicitly "write random data samples for verification step" before the firmware step — step 9.)

## 10.4 NIST sampling methods (§17.3, p.187)
- **NIST normal verification:** drive split into subsections; two pseudo-random locations per subsection verified.
  Used at the end of NIST Clear and Purge "where 10% of the drive is verified as a minimum" and in all other standards.
  "selecting any Blancco erasure standard and setting a verification percentage equal or higher than 10% will ensure at
  least a clear-level erasure as defined by NIST."
- **NIST Crypto Erase verification:** pseudo-random locations written with a known pattern before Crypto Erase; read
  after to confirm the pattern is absent; minimum 10%; used at the end of NIST Purge.
- Reference: NIST SP 800-88r1 pages 20–21.

## 10.5 Crypto erase verification (§7.24, p.96)
1. Pseudo-random locations selected. 2. Written with a known pattern. 3. Crypto erase triggered. 4. Locations read to
confirm the pattern is gone. Configurable 1–100%, default 1%.

## 10.6 SSD verification rules (§16.2, p.183–184)
- Verification "must be completed successfully. If it cannot complete, the erasure is considered a fail."
- Must show "no data has remained on the device (at the logical level)". Anomalies → fail.
- Some encrypting SSDs may consistently fail verification — contact Blancco (§16.3.3.1).
- Drive must respond and present itself operational after erasure.

## 10.7 Visual check
Hex viewer (§4.2.3.4) shows sector contents so the pattern (e.g. 0x00, 0xAA, 0x924924…) can be seen.
Don't confuse Fingerprint / Bootable asset report sectors with leftover data (step 16).

## 10.8 Recommended levels
- Apple KB: for Mac drives that can't be purged, "Aperiodic Random Overwrite" or "HMG Lower Standard" with **100%
  verification** gives clear-level.
- Common Criteria: configure verification "at 100% rather than use the quicker default value of 1%".
- Separate product Blancco Drive Verifier scans a drive's bit patterns independently (search result; not part of BDE).
