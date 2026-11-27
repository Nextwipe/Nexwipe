# Step 18 — What this means for NexWipe, and open gaps

## In short
Blancco's value is less the wipe commands (those are drive standards anyone can call) and more the **rules around
them**: per-drive-type command chains with fallbacks, strict mandatory/optional pass-fail logic, error thresholds,
verification minimums, a complete list of places data can hide, honest report wording about the level reached, and
signed reports. These are observations for planning only; NexWipe stations remain read-only and erasure stays "Planned".

## 18.1 Already matching NexWipe's direction
- Org-wide identical boot sticks that connect themselves (Configuration Tool + USB Creator model) — the `org-sticks`
  design in `docs/superpowers/specs/2026-11-26-org-sticks-design.md`.
- Hardware/asset reporting before any erasure (Blancco's asset report and asset licences).
- Chromebooks as a separate track — Blancco also processes them differently, and its manual does not claim the
  factory reset proves deprovisioning (see `15-special-hardware/chromebooks.md`). NexWipe's AGENTS.md rule
  ("a Powerwash or setup screen is not proof of deprovisioning or erasure") is consistent with that.

## 18.2 Lessons worth copying if erasure is ever built
1. **Status vocabulary:** only Erased / Not erased per drive, plus information exceptions. Never "verified hardware".
2. **Mandatory vs optional steps** decide the result; optional failures become visible exceptions.
3. **Any read/write error → Not erased**; write-error threshold (Blancco default 5) stops early.
4. **Report the level actually reached** ("Exceeds NIST Purge" vs "Clear", "Device is SSD…").
5. **Verification:** enforce a final verification; NIST needs ≥10%; offer 100%.
6. **Detect and report every hidden-data place** (HPA/DCO, Shadow MBR, NBP, RPMB, namespaces, remapped sectors,
   SID block, TCG lock, Computrace) even when it can't be removed.
7. **Firmware-command chains with fallback per drive type** (step 9), and never allow pause/cancel during a firmware command.
8. **Never erase the boot stick** (Blancco excludes "BLANCCO"-labelled media) and hide removable media by default.
9. **Report durability:** reports exist only in RAM until saved/sent; automatic backup to every USB stick when offline.
10. **Tamper-evident signed reports** — with the honest limit that a signature proves integrity, not correctness.
11. **Freeze-lock removal** via sleep/wake is model-sensitive; budget for a per-model compatibility list.

## 18.3 Open gaps in this research
- Steps of "Blancco SSD Erasure" are proprietary and unpublished.
- Five KB articles were 403; the ANSSI security target was 404.
- Hash/signature algorithms for reports are not public.
- No public independent test of how well each standard performs on specific laptop SSD models.
- Licence consumption timing: manual says licences are needed "to start the erasure" and that consuming one "allows the
  user to save/send reports"; the exact moment of consumption isn't stated more precisely.
