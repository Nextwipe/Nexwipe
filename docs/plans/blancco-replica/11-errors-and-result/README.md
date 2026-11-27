# Plan — Step 11 — Errors and the final result (Erased / Not erased)

Mirrors: research [11-errors-and-result/README.md](../../../research/blancco-drive-eraser/11-errors-and-result/README.md)

## In short
Each drive ends **Erased** or **Not erased** — nothing in between, same as Blancco. Every step is *mandatory* (required by
the standard) or *optional* (added by a setting); any mandatory failure or any single read/write error means Not erased,
optional failures only add a message. The eraser decides the result, and the NexWipe web app **re-checks it in SQL** when the
report arrives, so a report can never say Erased unless its steps satisfy the standard. Interrupted or unverified is never Erased.

## 11.1 Read/write error handling (§7.7, p.82–83)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Risks: damaged unremapped "bad sectors" | Same handling (below) | Overwrite engine ([overwrite-engine.md](../09-erasure-standards/overwrite-engine.md)) | V1 |
| Risks: hot HDDs producing random errors | Same handling, plus temperature watch that pauses overwrite when hot | `smartctl -A` polling | V1 |
| Risks: drives behind RAID refusing commands | Same handling; RAID controllers themselves | Server/RAID support | Later |
| 1. Try to write (read) the area | Same | Engine | V1 |
| 2. On error, try half the block size; repeat down to the smallest block | Same | Engine | V1 |
| 3. Smallest block fails after **three tries** → unreachable, **one error** counted | Same | Engine | V1 |
| 4. All reachable areas still erased; only unreachable areas reported; error total in UI and report | Same: live counter on the drive card; ranges in the report | Engine → screen → report | V1 |
| At least one write/read error (overwriting or verification) → "Not erased" | Same | Result rule R5 (table below) | V1 |
| Write-error threshold in CT, **default 5**: when reached, erasure "is immediately stopped and marked as failed" with a report message | Same setting on the Stick setup page, default 5; message "Stopped: write-error limit (5) reached" | `nexwipe-setup.json` | V1 |
| Similar threshold for read errors | Same setting (default 5 until the Blancco default is confirmed) | `nexwipe-setup.json` | V1 |
| Remapped-sector threshold (CT): reached before/after erasure → stopped and failed (§7.8) | Same setting; SMART reallocated-sector count read before and after | `smartctl`; plan step 8 §8.3 | V1 |

## 11.2 Mandatory vs optional steps (§7.18, p.92)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| **Mandatory:** "overwriting steps, verification steps, firmware based erasure steps and hidden area removal steps" required by the applied standard | Same: every step in a standard file is `mandatory: true` | Standard files (plan step 9) | V1 |
| **Optional:** not a vital part of the standard, e.g. remapped-sector erasure or hidden-area removal added by settings | Same: steps added by settings are `mandatory: false` | Engine adds them at job build time | V1 |
| All mandatory succeed → **"Erased"** | Same | Rule R3 | V1 |
| Any mandatory fails → **"Not erased"** | Same | Rule R3 | V1 |
| Optional step fails → exception (information message), e.g. "Remapped sectors area erasure failed" or "DCO area removal failed", status stays "Erased" | Same, own wording: "Remapped-sector erase failed (optional step)", "DCO hidden-area removal failed (optional step)" | Rule R4 | V1 |
| "Fail erasure if unsuccessful" turns remapped-sector failure into a full failure (step 8) | Same switch; when on, that optional step becomes mandatory | Plan step 8 | V1 |

### The result rules (one list, used in two places)
| # | Rule |
|---|---|
| R1 | Final status is only **Erased** or **Not erased** (Not erased covers failed and cancelled). |
| R2 | Steps are mandatory (in the standard) or optional (added by settings). |
| R3 | All mandatory steps succeeded → Erased; any mandatory step failed → Not erased. |
| R4 | Optional step failed → still Erased + an exception message. |
| R5 | Any read or write error in overwrite or verification → Not erased. |
| R6 | Threshold reached → stopped immediately, Not erased, reason given. |
| R7 | Interrupted, crashed, power lost, or no final verification → never Erased. |
| R8 | Flash drive must respond and be operational afterwards (11.3). |
| R9 | Report states the **level reached** (Purge / Clear / none) from the commands that actually succeeded, and why. |

Where they live: in the eraser engine (decides) **and** in a `SECURITY DEFINER` SQL function in the web app that refuses
to store a drive as Erased unless the report's step list satisfies R1–R9 (project rule: state changes happen in SQL).
Needs a database migration with undo file, rehearsed locally, applied by the owner in Lovable. Tested by ~40 step-result
combinations as eraser unit tests and as `tests/db/*.sql` checks. Phase V1.

## 11.3 SSD-specific failure logic (§16.2, p.183–184)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Result only erased (success) or not erased (failed or cancelled) | Same (R1) | V1 |
| Erased = whole erasure and verification completed with no errors **and** the drive responds and is operational afterwards | Same (R3, R5, R8): engine re-identifies the drive after the firmware step and after verification | V1 |
| Fails if firmware erase can't run for any reason | Same | V1 |
| Fails if an ATA Master Password is set and can't be removed | Same (lock removal, plan step 7) | V1 |
| Fails if a BIOS freeze lock can't be removed | Same (plan step 7) | V1 |
| Fails if verification can't complete or finds data at the logical level | Same (plan step 10 §10.6) | V1 |
| (Possible) some encrypting SSDs consistently fail verification; variations in drive implementations | Same: recorded per model in our lab "command support table" | V1 |

## 11.4 Inoperable drives (§16.3.2, p.184–185)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| SSDs with flawed firmware or near end of life may malfunction from the erasure | Same warning in our help; before erasing, SMART health is shown (plan step 12) | V1 |
| Organisation should consider a **destructive process** for drives that become unresponsive; OEM or a data-recovery lab may restore them | Same advice: report status Not erased + "Drive stopped responding — consider physical destruction"; the web app can mark the device for destruction in inventory | V1 |
| "(During Blancco's testing operations) this situation has occurred in only a few cases." | n/a for NexWipe — a Blancco test statistic; NexWipe will publish its own count from lab testing | V1 |
| Monitor models that become unresponsive | Same: web app lists drive models with unresponsive results in the company's own reports; NexWipe's lab table tracks models we saw fail | V1 |

## 11.5 Failed erasures (§16.3.3)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Not due to freeze lock → verification issues (contact Blancco) | Same diagnosis shown in the failure reason; "contact NexWipe support" link | V1 |
| Firmware upgrade may help (no guarantee) | Same hint in the failure reason; NexWipe does not update drive firmware itself | V1 |

## 11.6 UI states and exceptions

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Drive states: Completed, Canceled, Failed (step 5) | Same three states on each drive card | Kiosk screen (plan step 5) | V1 |
| Tab colours: green success, red failed/cancelled | Same colours | Screen | V1 |
| Screensaver exception notifications (green/yellow) — step 4 | Same | Plan step 4 | V1 |
| Search `!f` for failed drives | Same search shortcut in the drive list | Screen | V1 |
| "ENHANCED SECURE ERASE command failed" | Own wording, see [firmware-commands.md](../09-erasure-standards/firmware-commands.md) | Firmware module | V1 |
| "SECURE ERASE command failed" | same | Firmware module | V1 |
| "FORMAT UNIT command failed" | same | Firmware module | Later |
| "BLOCK ERASE EXT command failed" | same | Firmware module | V1 |
| "OVERWRITE EXT command failed" | same | Firmware module | V1 |
| "Cryptographic erasure has failed" (KB) | same | Firmware module | V1 |

## 11.7 Report messages that qualify a success (collected)
NexWipe keeps the same message for each case, in its own words, in one catalogue (`exceptions.yaml`) shared by eraser and web app.

| Blancco message | NexWipe message | Phase |
|---|---|---|
| "Device is SSD/eMMC/NVMe, see manual for more information" — success via a clear-level standard on flash | "Flash drive erased with a Clear-level standard — spare flash cells not reached (see NexWipe guide)" | V1 |
| "Exceeds NIST 800-88 Purge" / "Exceeds NIST 800-88 Clear" — Blancco SSD Erasure outcome | "NIST 800-88 Purge level reached" / "NIST 800-88 Clear level reached" (NexWipe SSD method; we don't claim "exceeds") | V1 |
| "Device has been cryptographically erased, see manual for more information." | "Drive was cryptographically erased — see NexWipe guide" | V1 |
| "Sanitization includes vendor-specific purge commands" — NVMe Format under IEEE Purge | "Purge used NVMe Format (vendor-defined strength); Purge may not be reached" | V1 |
| "Drive doesn't support remapped sectors erasure" | "Drive does not support remapped-sector erase" | V1 |
| Non-periodic patterns found (fallback verification) | "Random-looking data after erase command; checked by marker absence" | V1 |
| Data left on drive (partition erasure / preserved recovery partition) | "Only selected partitions erased — data left on drive" / "Recovery partition kept — data left on drive" | V1 |
| Hybrid drive warning | "Hybrid drive — flash cache may not be fully erased" | V1 |
| NVMe namespaces disclaimer when not all namespaces erased | "Not all NVMe namespaces were erased" | V1 |
| PSID revert performed | "PSID revert performed (drive reset to factory encryption state)" | V1 |
| NVDIMM: "NVDIMM data backup is not armed, check backup battery" | Same meaning, own wording | Later (servers) |
| NVDIMM: "NVDIMM has invalid or missing configuration" | Same meaning, own wording | Later (servers) |
