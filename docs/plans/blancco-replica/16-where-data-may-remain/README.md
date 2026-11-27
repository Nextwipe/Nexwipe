# Plan — Step 16 — Where data may remain (Blancco's own admissions) and troubleshooting

Mirrors: research [16-where-data-may-remain/README.md](../../../research/blancco-drive-eraser/16-where-data-may-remain/README.md)

## In short
NexWipe copies Blancco's honesty list: every place where data might survive a software wipe is detected (step 5),
tackled where possible (steps 7–8), and otherwise written into the report as an exception such as "data may remain in
…". A drive with an unhandled risk area is never reported as fully erased. NexWipe also explains the same "false
positives" (things that look like leftover data but are ours) and keeps the same troubleshooting entries in its help pages.

## 16.1 Drive areas that are difficult to reach (§15.5.1, p.181)

| # | Area | Risk | Blancco mitigation | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|---|---|
| 1 | Hidden areas (HPA/DCO) | Not visible to OS/BIOS | "Remove hidden areas" (CT) | Same setting (Prepare stick page / laptop); if not removed → report exception "hidden area not erased" | `hdparm -N`, `--dco-restore` (step 7 §7.2) | V1 |
| 2 | Shadow MBR | ≥128 MB pre-boot area on TCG drives | Detected and reported; needs PSID Revert or admin password | Same; without PSID → exception "Shadow MBR area may contain data" | `sedutil-cli` (step 7 §7.6) | V1 |
| 3 | Remapped sectors | Retired sectors may hold data | "Erase remapped sectors" (time-consuming) | Same option; if not done on a drive with remapped sectors → exception | Firmware step (step 8 §8.3) | V1 |
| 4 | NVMe boot partition (NBP) | Outside user space, writable only via firmware download | Reported; if presence unknown may hold system data | Same three report outcomes | `nvme id-ctrl` / boot partition log (step 5 #29, confirm in lab) | V1 |
| 5 | RPMB | Small security area (certificates, IDs, counters) | Cannot be removed; not for user data | Same: reported empty / not empty, never claimed erased | NVMe `id-ctrl` RPMBS, eMMC EXT_CSD (step 5 #31) | V1 |
| 6 | Detached NVMe namespaces / unallocated space | May contain data | Shown separately; can be merged | Shown separately in V1 (exception in report); merging/attaching Later | `nvme list-ns -a`, `unvmcap` (step 5 #24–25) | V1 detect, Later merge |

## 16.2 Other risks elsewhere in the manual

| # | Blancco lists | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | Unreadable bad sectors (counted, reported, drive Not erased) (§7.7, §15.5.3) | Same: counted, reported, result **Not erased** | Overwrite engine error counting (step 9/11) | V1 |
| 2 | Hot drives producing errors (§7.7) | Same: temperature watched, warning + pause above limit | `nvme smart-log`, `smartctl -A` | V1 |
| 3 | Hidden SAN devices (if hidden in CT, not shown or reported) (§15.5.3) | Same; report header says "SAN devices hidden by setting" | Step 5 §5.1 #13 | Later (servers) |
| 4 | Hybrid drives' flash part (§8.2.2) | Same: hybrid drive detected; report exception that the flash cache may not be fully reached unless a firmware erase ran | Step 5 §5.1 #15 | V1 |
| 5 | eMMC retired sectors and extra recovery partition (§8.2.1) | Same: eMMC boot/extra partitions (`mmcblk*boot0/1`, GP partitions) listed; exception if not erased | `mmc-utils` (`mmc extcsd read`, `mmc erase`/sanitize — confirm in lab) | V1 |
| 6 | Storage element depopulation (restored only in IEEE Clear/Purge) (§4.2.3.6) | Same | Step 5 icon #23 | Later (data centre) |
| 7 | RAID metadata with clear-level erasure (§4.2.3.6) | Same exception | Step 5 icon #22 | V1 (laptop RST), Later (server RAID) |
| 8 | Partition-only erasure / preserved recovery partition (§7.12) | Same exception "data left on the drive" | Step 8 §8.5 | V1 |
| 9 | Removable flash: clear only (§8.7) | Same, level Clear at most | Step 5 §5.1 #9 | V1 |
| 10 | Crypto erase relies on the drive's crypto implementation (§7.24) | Same statement in every report that used crypto erase | Report text | V1 |
| 11 | NVMe Format under IEEE Purge may be vendor-specific (§4.2.3.3) | Same warning | Step 8 §8.2 in-process #13 | V1 |
| 12 | Computrace firmware agent survives (§7.15) | Same: detected and reported, never claimed removed | Step 7 §7.9 | V1 |
| 13 | Drives behind adapters: hidden-area removal unreliable; firmware commands may fail (§7.9, §16.1) | Same: hidden-area removal refused through USB adapters; warning for firmware commands | Transport check | V1 |

## 16.3 False positives (§15.5.2, p.182)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | **Bootable Asset Report** — data in the first 200 or 67000 sectors (off by default) | Same feature, same sector positions (200 or 67000), off by default; report and help page say this data is NexWipe's own (step 13) | Engine writes it after verification | V1 |
| 2 | **Digital Fingerprint** — one sector (67000 by default) | Same: one sector, 67000 by default; explained as ours | Engine | V1 |
| 3 | **Third-party recovery tools** may "find" images in the overwrite patterns (Blancco KB link) | Same explanation in NexWipe's own help page (Blancco KB link n/a for NexWipe — we write our own article) | Help page in web app | V1 |

## 16.4 Troubleshooting items in the manual (§15)

| # | Blancco item | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 | 15.1 Required files not found — Chromebooks ([chromebooks.md](../../../research/blancco-drive-eraser/15-special-hardware/chromebooks.md)) | Same help entry when Chromebook support exists | Chromebook track | Later (Chromebooks) |
| 2 | 15.2 Device stays in Developer mode after erasure — Chromebooks | Same | Chromebook track | Later (Chromebooks) |
| 3 | 15.3 HPE SR932i-p Gen11 Tri-Mode controller limits — no bay numbering, only first NVMe namespace, no NVMe self-tests | Same three limits documented if we support that controller | Help page | Later (servers) |
| 4 | 15.4 UI sluggish with FLR boot option (e.g. Dell Latitude 9430) → Normal startup (safe resolution) | Same: boot menu has a "Normal start-up (safe graphics)" entry; per-model note in web app | Boot menu (step 3) + model notes | V1 |
| 5 | Freeze-lock black screens → step 7 | Same pointer: [step 7 §7.1](../07-removing-locks/README.md) | Help page | V1 |
| 6 | Firmware command failures → step 8 | Same pointer: [step 8 §8.7](../08-erasure-settings/README.md) | Help page | V1 |
