# Step 6 — Process modes (how much is automatic)

## In short
Every run follows numbered steps: 1 Erasure, 2 Hardware tests, 3 Custom fields, 4 Report, 5 Restart/Shutdown.
The process mode, chosen only in CT, decides which steps run by themselves. Workflow mode replaces the fixed steps
with a script from the management portal. BMP can also monitor or fully control machines remotely.
Detail on scripts: [workflows.md](workflows.md).

## 6.1 The four processes (§4.1, p.30–31)
"Processes define how the erasure process is handled and how much user interaction it requires." The configured
process is visible in the UI but "can only be changed via the CT software".

### Manual (§4.1.1)
Everything manual: user starts erasure, runs tests, updates custom fields, sends report to BMP or saves to USB, shuts down.

### Semi-automatic (§4.1.2)
| Step | Behaviour |
|---|---|
| 1 Erasure | Automatically run |
| 2 Hardware tests | Run manually |
| 3 Custom fields | Must be run manually (even if not mandatory) |
| 4 Report | Automatically sent to BMP after custom fields updated; saving is optional and manual |
| 5 Shutdown | Configurable via CT ("Automatic Restart/Shutdown") |
A shutdown/restart popup is always shown at the end of testing. Proceeds to custom fields if at least one test
completed (passed or failed), including Required tests.

### Automatic (§4.1.3)
| Step | Behaviour |
|---|---|
| 1 Erasure | Starts automatically |
| 2 Hardware tests | Run manually (software waits) |
| 3 Custom fields | Manual only if mandatory (skipped otherwise) |
| 4 Report | Automatically sent to BMP; saving optional, manual |
| 5 Restart/Shutdown | Configurable via CT |
Proceeds to custom fields if at least one manual test completed; with only automatic tests it proceeds when
erasure finishes. A shutdown/restart popup is always shown at the end of testing.

### Workflow (§4.1.4)
"The process is managed by a workflow which is fetched from BMP." See [workflows.md](workflows.md).

Datasheets describe these as "4 levels of process automation: workflow, manual, semi-automatic, automatic".

## 6.2 Starting erasure manually (§4.2.3.1, p.35)
- "Erase" button bottom-right or Ctrl+E → confirmation window (Yes / No; EULA link).
- Warning shown: if a drive has a freeze lock BDE may remove it and "the screen may momentarily turn off".

## 6.3 Remote monitoring and control (§7.23, p.95)
BMP is required in both cases (also for external asset-management integrations).
- **Monitoring:** enable remote monitoring in the image (CT) and fill BMP connection settings (CT or client Settings);
  Process control must be "Local user interface". BMP's Client Overview tab follows the process but "cannot control
  the erasure directly"; it can detect problems. BMP assigns a numeric ID shown on the screensaver (top right) and in
  the Process area.
- **Control:** Process control = "Blancco Management Portal remote" (CT). BMP can push an erasure standard or a
  workflow to target machines. When the remote session is cleared in BMP, BDE fetches a stop command on the next
  polling round, acknowledges, stops accepting remote commands and waits to be shut down manually; UI shows `#` in the
  session ID, connectivity and licence status turn red, BMP icon says "Communication with the BMP has failed...".
- Remote PDF (2021): remote and simultaneous erasures across multiple drives and locations via the console; options
  such as automatic machine shutdown after erasure, pause, cancel, resume.

## 6.4 Multitasking and hot swap
- Process area supports multitasking (see step 4).
- Hot swap (§7.16): remove/add drives and press Refresh drive list (Ctrl+R) without affecting other erasures. Only if
  "Report per Connected Device" mode is enabled. Refresh pauses all erasures and resumes them after re-detection; if a
  firmware command is running, refresh waits ("A firmware command is being executed on one of the drives. The list of
  drives will be refreshed after it finishes."). Supported for SAS/SCSI/SATA/FC/USB/NVMe visible as nodes (not behind
  pass-through RAID). NVMe hot swap officially only on SuperMicro X10SLL-F and X10SRL-F boards; hybrid appliances supported.
  "Hotplug timeout" default 60 s (≥30 s for SATA/USB only, ≥60 s for SAS/SCSI/FC/NVMe); wait 10–15 s after plugging an
  HDD. Three failed detections of the same drive → hotplug service error, reboot suggested. Some old EMC 1 GB drives
  must be inserted before boot.
