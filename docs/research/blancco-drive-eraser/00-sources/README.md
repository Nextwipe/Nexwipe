# Step 0 — Sources

## In short
The core is Blancco's own current user manual (v7.21.0, 2026-10-27). Knowledge-base (KB) articles fill in
laptop-specific issues. One independent government-scheme evaluation (Common Criteria EAL2) shows what an outside
lab checked. Some pages could not be read; they are listed so nobody assumes they were.

## Read in full or in the relevant parts

| Source | Version / date | Used for |
|---|---|---|
| [Blancco Drive Eraser User Manual](https://blancco.hosted-by-files.com/products/erasure/drive_eraser/manuals/Blancco_Drive_Eraser_Manual_en-US.pdf) | v7.21.0, 2026-10-27, 195 pages | Everything; primary source |
| [Alternative boot modes (KB)](https://support.blancco.com/display/KB/Alternative+boot+modes+for+Blancco+Drive+Eraser) | updated 2023-02-14; Customized startup needs BDE 6.3.0 + CT 2.3.0 | Boot menu |
| [Handling encrypted drives (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11634710/Handling+encrypted+drives) | updated 2021-10-08 | BitLocker, SED, TCG |
| [Blancco SSD Erasure compliance with NIST 800-88 (KB)](https://support.blancco.com/space/KB/11634347/Blancco+SSD+Erasure+compliance+with+NIST+800-88) | — | Purge vs Clear depending on firmware |
| [Erasing SSD with Blancco Drive Eraser / Blancco 5 (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11633050/Erasing+SSD+with+Blancco+Drive+Eraser+Blancco+5) | updated 2018-07-19 | SSD rules |
| [Erasure failing for SSD/NVMe drives (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11635720/Erasure+failing+for+SSD+NVMe+drives+due+to+erasure+commands+failing+or+not+being+supported) | 2021-09-15 | Firmware command failure messages and workaround |
| [Erasure failed due to firmware-based erasure commands failing (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11635677/Erasure+failed+due+to+firmware-based+erasure+commands+failing) | 2021-09-09 | Dell Latitude S3 issue |
| [Freeze Lock Removal (KB)](https://support.blancco.com/display/KB/Freeze+Lock+Removal:+what+it+is+and+how+to+remediate+possible+issues) | — | Freeze-lock failures and remedies |
| [Erasing Apple computers (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11633011) | updated 2021-12-20, BDE 6.1.2+ | Intel Macs |
| [Booting Drive Eraser on Apple T2 devices (KB)](https://go.docs.blancco.com/wiki/spaces/KB/pages/11635357) | updated 2022; fix in 6.13.0 | T2 Macs |
| [What makes Blancco's certificates tamper-proof (blog)](https://blancco.com/resources/blog-what-makes-blanccos-certificates-tamper-proof/) | — | Report signing |
| [Common Criteria Certification Report EFT-T008, Blancco Drive Eraser v6.9.1, EAL2](https://commoncriteriaportal.org/nfs/ccpfiles/files/epfiles/ACSC%20Certifcation%20Report%20EFT-T008%20Blancco%20Drive%20Eraser%20EAL2.pdf) | 2020-06-03 | Independent evaluation |
| [Drive Eraser for ITAD datasheet](https://www.blancco.com/wp-content/uploads/2025/01/blancco_drive-eraser-ITAD.pdf) and [for Enterprise](https://www.blancco.com/wp-content/uploads/2025/01/blancco_drive-eraser-enterprise.pdf) | 2025-01 | Marketing summary (4 automation levels: workflow, manual, semi-automatic, automatic); nothing beyond the manual |
| [Erasing assets remotely (PDF)](https://www.blancco.com/wp-content/uploads/2021/07/erasing-assets-remotely-using-blancco-drive-erase.pdf) | 2021 | Remote erasure via management console (one page, marketing) |

Search results also mentioned (not separately verified): Blancco PreInstall (an MSI that installs the BDE ISO on the
local drive and reboots into it), Intel vPro/AMT remote options, a 2013 press release on automated freeze-lock removal,
Management Console "License History" (4.8.1) and "License Snapshot" (5.18.0) features.

## Could not be read

- KB short links `support.blancco.com/x/N6jn`, `/x/ZAGu`, `/x/IqXn`, `/x/YQCG`, `/x/Lqnn` — HTTP 403.
- ANSSI CSPN security target (French government) — HTTP 404.
- Linked but not fetched: PSID Revert KB (pageId 66201), disabling FLR (3539242), BIOS boot sequence (11633175),
  "TCG locked" label (158793750), common errors (11633091), data found after erasure (11633108), verification 1% (11632970).
- The exact steps of **"Blancco SSD Erasure"** — the manual says only "Proprietary process — contact Blancco" (§18.4, p.194).

## Older material seen in search, not relied on
Blancco 5 manuals and Drive Eraser 6.x manuals mirrored on Scribd/ManualsLib/Manualzz. Where they differ from 7.21.0,
the 7.21.0 manual wins.
