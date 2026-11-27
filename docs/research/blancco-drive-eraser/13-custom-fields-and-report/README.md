# Step 13 — The report (proof of erasure)

## In short
Before erasure the report is an asset (hardware) report; after erasure it becomes the erasure report — "the unique
proof that the erasure has been initialized and completed". It is digitally signed, saved as XML or XML+PDF to a USB
stick, or sent to the Blancco Management Portal. Optional extras write a fingerprint or a bootable report onto the
wiped drive. Custom fields and per-drive reports: [custom-fields-and-per-device-reports.md](custom-fields-and-per-device-reports.md).

## 13.1 Report step (§4.5, p.51–53)
- Fourth and final default step; viewable before, during and after erasure.
- Tab colour: grey not started, blue ongoing, green successful, red failed. Can be saved, sent, or both.
  States: viewable not backed up / being saved / being sent / saved / sent / save failed / send failed.
- Standard vs **Advanced** report (Advanced adds SMART info); toggle with button or Ctrl+M; Advanced can be default in CT.
  The view chosen determines which type is saved as PDF.

## 13.2 Contents (§4.5.2.1, p.53–54)
- Licensee / Customer / Operator information.
- Hardware information (asset report of the host machine; details in step 5).
- Custom fields.
- Erasure result information per drive.
- Hardware test results.
- Report information (about the report file itself).
- IPMI MAC/IP (XML only).
- Blog: "what asset was erased, the erasure method used, what type of data was erased, and the level of erasure".
- Support docs (search): drive serial number, erasure status, unique report ID, digital signature.
- Extra XML fields: TCG/Shadow MBR/Block SID fields, fingerprint sector and status, NBP/RPMB status, persistent
  software, TPM, drive life estimate, health percentage.

## 13.3 Saving to USB (§4.5.2.2, p.54–55)
- Plug a stick, Save (Ctrl+S), choose drive, file name, format.
- Default name `Date(yyyymmdd)_Time(hh24miss)_report`, e.g. `20210527_115442_report`; editable; max 255 characters.
- Formats: **XML** (importable to BMP) or **XML + PDF**.
- Failure causes: not enough space, device disconnected, same file name exists, invalid characters, faulty device.
- USB stick should be FAT32, single partition, non-empty name (a-zA-Z0-9 preferred), in good condition.

## 13.4 Sending to BMP (§4.5.2.3, p.56)
- Send (Ctrl+N). "Only one report per BDE session is kept in BMP" — the latest replaces earlier ones.
- Missing BMP settings → error popup showing one missing parameter at a time; wrong/missing credentials → prompt.

## 13.5 Automatic report backup (§7.4, p.81–82)
Manual process only (other processes already send automatically). CT option.
- Sent to BMP when each drive's erasure finishes, fails or is cancelled; if BMP unreachable → saved to **all**
  connected USB sticks; saved when a stick is later connected.
- Not an official report yet: no session ID until custom fields are done and the report is sent/saved.
- File named by report UUID, e.g. `<uuid>_report.xml`. Each USB save writes all reports in memory; a new stick gets old ones too.
- **Reports disappear if the machine is shut down or restarted.**
- When BMP comes back, all saved reports are sent. If BMP is changed, only unsent reports go to the new BMP; reports are sent once unless updated.
- Mandatory custom fields validation skipped in backups.
- Always XML, even if PDF+XML configured.
- Re-running an erasure updates and replaces the report; one report per entity. Updated after custom-field changes.
- With "Report per Connected Device" → one report per drive; otherwise one per session.
- UI messages like "Backup to BMP/USB completed"; Report tab colour doesn't change for backups.
- "a report has to always be backed up before the machine shuts down or restarts!" (§7.2).

## 13.6 Digital signature (manual §1; blog; Common Criteria)
- Signature = a hash of the report content, unique per report; "changes completely if any change is made".
- Default: signed with "a private key unique to the Blancco product", public key "stored in the Blancco Management Console".
- Custom: own RSA key pair; BDE 6.12+ and CT 2.12+.
- Releases < 4.8.0 incompatible due to updated signature.
- BMP / Blancco Blue verifies: "If even a single comma has changed on the certificate … [it] will detect it during
  report verification." Tampered reports remain viewable with a notification — detection, not prevention.
- Common Criteria: reports "protected from tampering"; ANSSI target (search snippet) mentions a verification tool that
  can verify the signature; BMC not mandatory for erasure.
- Not stated publicly: hash algorithm, key sizes, key protection.
- **The signature proves the report wasn't changed after signing; it does not by itself prove the wipe was correct.**

## 13.7 Digital Fingerprint (§7.20, p.92–93)
- Small summary written on the erased drive, "further proof", usable for auditing. **Off by default** (CT Report >
  Fingerprint settings).
- One sector, default **sector 67000** (configurable; if beyond capacity, last sector). English/ASCII only.
- Fields (spaces/semicolons): customer name ("Licensed to", non-ASCII as "?"), completion date/time
  `yyyy-mm-dd hh:mm:ss`, software version, drive serial, status "Successful"/"Failed"/"Cancelled", report UUID
  (`Asset:<uuid>`; `Per-drive:<uuid>`).
- Sector and status in XML. Disabled by "Format drives after erasure".

## 13.8 Bootable Asset Report (§7.21, p.93)
- Splash screen shown when booting a successfully erased drive; basic computer info. **Off by default.**
- Conditions: enabled in CT, drive erased successfully at least once, report saved to USB or sent to BMP at least once.
- Writes the first **200 sectors (BIOS)** or **67000 sectors (UEFI)** — different pattern, not leftover data.
- "does not replace the Blancco erasure report which is the real proof that the erasure has occurred."
- Uses: fast visual proof, auditing, showing hardware info to second-hand buyers. Usually overwritten by an OS install.

## 13.9 Report Issue and crash reports
- Crash reporter (§7.3): on freeze/crash, a crash report with system info and logs is copied to all connected USB
  sticks (or later when one is connected).
- Report Issue button (step 4) creates an issue report for support.
