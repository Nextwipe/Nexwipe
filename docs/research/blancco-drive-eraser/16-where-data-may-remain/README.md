# Step 16 — Where data may remain (Blancco's own admissions) and troubleshooting

## In short
Blancco's manual has a section listing cases where data might survive (§15.5). It is the clearest map of the
limits of software erasure — useful for writing honest reports. It also lists "false positives" that look like
leftover data but aren't.

## 16.1 Drive areas that are difficult to reach (§15.5.1, p.181)
| Area | Risk | Mitigation in BDE |
|---|---|---|
| Hidden areas (HPA/DCO) | Not visible to OS/BIOS | "Remove hidden areas" (CT) |
| Shadow MBR | ≥128 MB pre-boot area on TCG drives | Detected and reported; needs PSID Revert or admin password |
| Remapped sectors | Retired sectors may hold data | "Erase remapped sectors" (time-consuming) |
| NVMe boot partition (NBP) | Outside user space, writable only via firmware download | Reported; if presence unknown may hold system data |
| RPMB | Small security area (certificates, IDs, counters) | Cannot be removed; not for user data |
| Detached NVMe namespaces / unallocated space | May contain data | Shown separately; can be merged |

## 16.2 Other risks elsewhere in the manual
- Unreadable bad sectors (counted, reported, drive Not erased) (§7.7, §15.5.3).
- Hot drives producing errors (§7.7).
- Hidden SAN devices (if hidden in CT they're not shown or reported) (§15.5.3).
- Hybrid drives' flash part (§8.2.2).
- eMMC retired sectors and extra recovery partition (§8.2.1).
- Storage element depopulation (restored only in IEEE Clear/Purge) (§4.2.3.6).
- RAID metadata with clear-level erasure (§4.2.3.6).
- Partition-only erasure / preserved recovery partition (§7.12).
- Removable flash: clear only (§8.7).
- Crypto erase relies on the drive's crypto implementation (§7.24).
- NVMe Format under IEEE Purge may be vendor-specific (§4.2.3.3).
- Computrace firmware agent survives (§7.15).
- Drives behind adapters: hidden-area removal unreliable; firmware commands may fail (§7.9, §16.1).

## 16.3 False positives (§15.5.2, p.182)
- **Bootable Asset Report** — data in the first 200 or 67000 sectors (off by default).
- **Digital Fingerprint** — one sector (67000 by default).
- **Third-party recovery tools** — may "find" images in Blancco's overwrite patterns. KB:
  https://support.blancco.com/space/KB/11633108/Data+is+found+on+the+drive+after+a+successful+erasure

## 16.4 Troubleshooting items in the manual (§15)
- 15.1 Required files not found, 15.2 Device stays in Developer mode after erasure — Chromebooks, see
  [chromebooks.md](../15-special-hardware/chromebooks.md).
- 15.3 HPE SR932i-p Gen11 Tri-Mode controller limits — no bay numbering, only first NVMe namespace, no NVMe self-tests.
- 15.4 UI sluggish with FLR boot option (e.g. Dell Latitude 9430) → Normal startup (safe resolution).
- Freeze-lock black screens → step 7. Firmware command failures → step 8.
