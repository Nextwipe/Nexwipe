# Step 11 — Errors and the final result (Erased / Not erased)

## In short
Each drive ends **Erased** or **Not erased**. Every step is either *mandatory* (the standard's overwrite passes,
verification, firmware commands, hidden-area removal) or *optional* (extras like remapped-sector erase). Any mandatory
failure → Not erased. Optional failures only add an information message. A single read or write error → Not erased.

## 11.1 Read/write error handling (§7.7, p.82–83)
Risks: damaged unremapped "bad sectors", hot HDDs producing random errors, drives behind RAID refusing commands.
Algorithm:
1. Try to write (read) the area.
2. On error, try half the block size; repeat down to the smallest block.
3. If the smallest block fails after **three tries**, the sector is unreachable and **one error** is counted.
4. All reachable areas are still erased; only unreachable areas are reported. Error total shown in the UI and report.
- "If there is at least a write/read error detected during the erasure process (during overwriting rounds or
  verification), the erasure result will be 'Not erased'."
- Write-error threshold in CT, **default 5**: when reached, erasure "is immediately stopped and marked as failed" with
  a report message. A similar threshold exists for read errors.
- Remapped-sector threshold (CT): reached before/after erasure → stopped and failed (§7.8).

## 11.2 Mandatory vs optional steps (§7.18, p.92)
- **Mandatory:** "overwriting steps, verification steps, firmware based erasure steps and hidden area removal steps"
  required by the applied standard.
- **Optional:** not a vital part of the standard, e.g. remapped-sector erasure or hidden-area removal added by settings.
- All mandatory succeed → final status **"Erased"**. Any mandatory fails → **"Not erased"**.
- Optional step fails → exception (information message), e.g. "Remapped sectors area erasure failed" or
  "DCO area removal failed", while status stays "Erased".
- Exceptions: "Fail erasure if unsuccessful" turns remapped-sector failure into a full failure (step 8).

## 11.3 SSD-specific failure logic (§16.2, p.183–184)
Result is only erased (success) or not erased (failed or cancelled). Erased = whole erasure and verification
completed with no errors **and** the drive responds and is operational afterwards. Fails if:
- firmware erase can't run for any reason;
- an ATA Master Password is set and can't be removed;
- a BIOS freeze lock can't be removed;
- verification can't complete or finds data at the logical level;
- (possible) some encrypting SSDs consistently fail verification; variations in drive implementations.

## 11.4 Inoperable drives (§16.3.2, p.184–185)
SSDs with flawed firmware or near end of life may malfunction from the erasure. Organisation should consider a
**destructive process** for drives that become unresponsive; OEM or a data-recovery lab may restore them.
"(during Blancco's testing operations) this situation has occurred in only a few cases." Monitor models that become
unresponsive.

## 11.5 Failed erasures (§16.3.3)
Not due to freeze lock → verification issues (contact Blancco) or firmware upgrade may help (no guarantee).

## 11.6 UI states and exceptions
- Drive states: Completed, Canceled, Failed (step 5).
- Tab colours: green success, red failed/cancelled.
- Screensaver exception notifications (green/yellow) — see step 4.
- Search `!f` for failed drives.
- Firmware-command failure messages: "ENHANCED SECURE ERASE command failed", "SECURE ERASE command failed",
  "FORMAT UNIT command failed", "BLOCK ERASE EXT command failed", "OVERWRITE EXT command failed",
  "Cryptographic erasure has failed" (KB).

## 11.7 Report messages that qualify a success (collected)
- "Device is SSD/eMMC/NVMe, see manual for more information" — success via a clear-level standard on flash.
- "Exceeds NIST 800-88 Purge" / "Exceeds NIST 800-88 Clear" — Blancco SSD Erasure outcome.
- "Device has been cryptographically erased, see manual for more information."
- "Sanitization includes vendor-specific purge commands" — NVMe Format under IEEE Purge.
- "Drive doesn't support remapped sectors erasure".
- Non-periodic patterns found (fallback verification).
- Data left on drive (partition erasure / preserved recovery partition).
- Hybrid drive warning; NVMe namespaces disclaimer when not all namespaces erased.
- PSID revert performed.
- NVDIMM: "NVDIMM data backup is not armed, check backup battery", "NVDIMM has invalid or missing configuration".
