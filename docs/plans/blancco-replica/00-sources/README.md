# Plan — Step 0 — Sources

Mirrors: research [00-sources/README.md](../../../research/blancco-drive-eraser/00-sources/README.md)

## In short
Every plan file in `docs/plans/blancco-replica/` copies one research file at the same path, section by section, and says
what NexWipe builds for each Blancco item. The research itself rests on Blancco's own manual (v7.21.0, 2026-10-27) plus
knowledge-base (KB) articles, so the plan does too. NexWipe copies Blancco's **behaviour**, never its name, logo or
wording. Pages the research could not read stay listed below as **open gaps** — the plan must not guess what they say;
each gap gets a lab test or a later read.

### What each plan file is based on
"Phase" labels used in every file: **V1** = any Windows device, any manufacturer · **Later** = Macs, Chromebooks,
servers/RAID, PXE, reimaging · **V2** = certification / independent evaluation.

| Plan file | Based on research file | Old-plan technical notes reused |
|---|---|---|
| `00-sources/README.md` | `00-sources/README.md` | — |
| `01-preparation/README.md` | `01-preparation/README.md` | old 14-stick-setup, 16-reports-licences |
| `01-preparation/usb-creator.md` | `01-preparation/usb-creator.md` | old 15-stick-writer |
| `02-laptop-bios-setup/README.md` | `02-laptop-bios-setup/README.md` | old 04-eraser-boot-system, 02-test-lab |
| `03-booting/README.md` | `03-booting/README.md` | old 04-eraser-boot-system |
| `03-booting/permanent-installation.md` | `03-booting/permanent-installation.md` | old 15-stick-writer part 3 |
| `04-user-interface-and-settings/` … `18-nexwipe-implications/` | the research file at the same path | see each file |

## Read in full or in the relevant parts

Each Blancco source and what the NexWipe plan takes from it. "Taken as" = the plan treats it as a description of
behaviour to copy, not as text to copy.

| # | Source (Blancco) | Version / date | Blancco used it for | NexWipe plan uses it for | Phase |
|---|---|---|---|---|---|
| 1 | [Blancco Drive Eraser User Manual](https://blancco.hosted-by-files.com/products/erasure/drive_eraser/manuals/Blancco_Drive_Eraser_Manual_en-US.pdf) | v7.21.0, 2026-10-27, 195 pages | Everything; primary source | The master behaviour list for NexWipe Eraser. Every plan row keeps the manual's § number so the owner can cross-check. | V1 |
| 2 | [Alternative boot modes (KB)](https://support.blancco.com/display/KB/Alternative+boot+modes+for+Blancco+Drive+Eraser) | updated 2023-02-14; Customized startup needs BDE 6.3.0 + CT 2.3.0 | Boot menu | Same six-entry hidden boot menu on the NexWipe stick (plan 03-booting §3.3). Blancco version numbers: n/a for NexWipe — our menu ships complete in the first eraser release. | V1 |
| 3 | [Handling encrypted drives (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11634710/Handling+encrypted+drives) | updated 2021-10-08 | BitLocker, SED, TCG | Rules for BitLocker / self-encrypting drives (SED = a drive that encrypts itself in hardware; TCG = the industry group whose standard those drives follow) — plan step 07. | V1 |
| 4 | [Blancco SSD Erasure compliance with NIST 800-88 (KB)](https://support.blancco.com/space/KB/11634347/Blancco+SSD+Erasure+compliance+with+NIST+800-88) | — | Purge vs Clear depending on firmware | Same rule: report **Purge** only when a firmware purge really succeeded, otherwise **Clear** (NIST 800-88 = the US government guideline that defines these levels) — plan steps 09/11. | V1 |
| 5 | [Erasing SSD with Blancco Drive Eraser / Blancco 5 (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11633050/Erasing+SSD+with+Blancco+Drive+Eraser+Blancco+5) | updated 2018-07-19 | SSD rules | SSD handling rules for the "NexWipe SSD method" — plan step 08/09. "Blancco 5" is an old Blancco product: n/a for NexWipe. | V1 |
| 6 | [Erasure failing for SSD/NVMe drives (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11635720/Erasure+failing+for+SSD+NVMe+drives+due+to+erasure+commands+failing+or+not+being+supported) | 2021-09-15 | Firmware command failure messages and workaround | Same failure cases with our own message wording and the same workaround steps — plan step 11. | V1 |
| 7 | [Erasure failed due to firmware-based erasure commands failing (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11635677/Erasure+failed+due+to+firmware-based+erasure+commands+failing) | 2021-09-09 | Dell Latitude S3 issue | Per-model BIOS note "Dell Latitude 3480/5480: disable Block Sleep (S3)" in our model notes — plan 02-laptop-bios-setup §2.3. | V1 |
| 8 | [Freeze Lock Removal (KB)](https://support.blancco.com/display/KB/Freeze+Lock+Removal:+what+it+is+and+how+to+remediate+possible+issues) | — | Freeze-lock failures and remedies | Freeze-lock removal by sleep-and-wake (`rtcwake`) and its remedies (freeze lock = a drive refusing erase commands until it is power-cycled) — plan step 07 and 03-booting §3.3. | V1 |
| 9 | [Erasing Apple computers (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11633011) | updated 2021-12-20, BDE 6.1.2+ | Intel Macs | Intel Mac support — plan step 15. Blancco version: n/a for NexWipe. | Later |
| 10 | [Booting Drive Eraser on Apple T2 devices (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11635357) | updated 2022; fix in 6.13.0 | T2 Macs | T2 Mac boot rules — plan step 15. Blancco fix version: n/a for NexWipe. | Later |
| 11 | [What makes Blancco's certificates tamper-proof (blog)](https://blancco.com/resources/blog-what-makes-blanccos-certificates-tamper-proof/) | — | Report signing | Same idea: every report digitally signed so changes are detectable; company may use its own key — plan step 13. | V1 |
| 12 | [Common Criteria Certification Report EFT-T008, Blancco Drive Eraser v6.9.1, EAL2](https://commoncriteriaportal.org/nfs/ccpfiles/files/epfiles/ACSC%20Certifcation%20Report%20EFT-T008%20Blancco%20Drive%20Eraser%20EAL2.pdf) | 2020-06-03 | Independent evaluation | What an outside lab checks; NexWipe prepares for the same kind of evaluation but **never claims** it until done (Common Criteria = an international security-evaluation scheme; EAL2 = its second level) — plan step 17. | V2 |
| 13 | [Drive Eraser for ITAD datasheet](https://www.blancco.com/wp-content/uploads/2025/01/blancco_drive-eraser-ITAD.pdf) and [for Enterprise](https://www.blancco.com/wp-content/uploads/2025/01/blancco_drive-eraser-enterprise.pdf) | 2025-01 | Marketing summary (4 automation levels: workflow, manual, semi-automatic, automatic); nothing beyond the manual | Same four automation levels — plan step 06. | V1 |
| 14 | [Erasing assets remotely (PDF)](https://www.blancco.com/wp-content/uploads/2021/07/erasing-assets-remotely-using-blancco-drive-erase.pdf) | 2021 | Remote erasure via management console (one page, marketing) | Remote watch/control of a running eraser from the NexWipe web app — plan step 04 (§7.23 remote control). | V1 (monitoring) / Later (full remote start) |

Search results also mentioned (not separately verified). The plan keeps each one as a row, never as a promise:

| # | Mentioned item | NexWipe equivalent | Phase |
|---|---|---|---|
| 15 | Blancco PreInstall (an MSI that installs the BDE ISO on the local drive and reboots into it) | The Windows helper `Start NexWipe.exe` on the stick already restarts a Windows laptop straight into the stick. A "no stick" version that copies the eraser onto the laptop's own drive first is not planned for V1 — it writes to the drive about to be wiped. Re-check after the lab. | Later |
| 16 | Intel vPro/AMT remote options (remote power/boot built into some business Intel PCs) | Not planned; unverified feature. | Later |
| 17 | 2013 press release on automated freeze-lock removal | Automated freeze-lock removal is in V1 anyway (from the manual) — plan step 07. | V1 |
| 18 | Management Console "License History" (4.8.1) | Wipe-credit history page in the web app (append-only ledger). Blancco version: n/a. | V1 (no charge) |
| 19 | Management Console "License Snapshot" (5.18.0) | Wipe-credit balance-at-a-date view from the same ledger. Blancco version: n/a. | Later |

## Could not be read

These are **open gaps**. The plan does not assume what they say. Each gets a NexWipe action.

| # | Unread source | Open gap for NexWipe | Action | Phase |
|---|---|---|---|---|
| 20 | KB short link `support.blancco.com/x/N6jn` — HTTP 403 | Content unknown | Try again with a normal browser; if still blocked, leave closed | V1 (research) |
| 21 | KB short link `/x/ZAGu` — HTTP 403 | Content unknown | Same | V1 (research) |
| 22 | KB short link `/x/IqXn` — HTTP 403 | Content unknown | Same | V1 (research) |
| 23 | KB short link `/x/YQCG` — HTTP 403 | Content unknown | Same | V1 (research) |
| 24 | KB short link `/x/Lqnn` — HTTP 403 | Content unknown | Same | V1 (research) |
| 25 | ANSSI CSPN security target (French government) — HTTP 404 | What a French evaluation checked | Find another copy before planning certification | V2 |
| 26 | PSID Revert KB (pageId 66201) — linked, not fetched | Exact PSID revert steps (PSID = the code printed on a self-encrypting drive's label that factory-resets it) | Read it; until then use the public TCG Opal steps with `sedutil-cli`, tested on disposable lab drives (confirm in lab) | V1 |
| 27 | Disabling FLR (3539242) — linked, not fetched | How/when to turn off freeze-lock removal | Our boot menu already has "unlock later" and custom entries; read KB to check nothing is missing | V1 |
| 28 | BIOS boot sequence (11633175) — linked, not fetched | Boot-order advice per maker | Our own per-model boot key list from lab testing (plan usb-creator §11) | V1 |
| 29 | "TCG locked" label (158793750) — linked, not fetched | Exact meaning of Blancco's "TCG locked" drive label | Define our own label from the TCG drive state we read; read KB to align | V1 |
| 30 | Common errors (11633091) — linked, not fetched | Blancco's common error list | Build our error list from the manual + lab; read KB to fill holes | V1 |
| 31 | Data found after erasure (11633108) — linked, not fetched | What to do when verification finds data | Our rule: result is never "Erased" if verification finds data; read KB for remedies | V1 |
| 32 | Verification 1% (11632970) — linked, not fetched | Detail of 1% verification | Our verification levels follow the manual (plan step 10); read KB to check the 1% case | V1 |
| 33 | The exact steps of **"Blancco SSD Erasure"** — the manual says only "Proprietary process — contact Blancco" (§18.4, p.194) | Secret method, cannot be copied | **NexWipe SSD method** from public steps: strongest supported firmware purge → aperiodic (non-repeating) random overwrite → second firmware erase if supported → verify at least 10%. Result level reported honestly (Purge or Clear). | V1 |

## Older material seen in search, not relied on

| # | Item | NexWipe rule | Phase |
|---|---|---|---|
| 34 | Blancco 5 manuals and Drive Eraser 6.x manuals mirrored on Scribd/ManualsLib/Manualzz | Not used for the plan; n/a for NexWipe — old Blancco products. | — |
| 35 | Where they differ from 7.21.0, the 7.21.0 manual wins | Same rule in the plan: only 7.21.0 behaviour is copied. | — |
