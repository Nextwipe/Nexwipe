# Plan — Step 6 — Process modes (how much is automatic)

Mirrors: research [06-process-modes-and-workflows/README.md](../../../research/blancco-drive-eraser/06-process-modes-and-workflows/README.md)

## In short
NexWipe Eraser runs the same five numbered steps: 1 Erasure, 2 Hardware tests, 3 Custom fields, 4 Report, 5 Restart/Shutdown.
The company picks the process mode only on the "Prepare stick" page of the NexWipe web app; it is baked into the signed
`nexwipe-setup.json` on the stick and the laptop screen only shows it. Workflow mode replaces the fixed steps with a
workflow fetched from the web app (detail: [workflows.md](workflows.md)). The web app can also watch, or fully drive,
machines remotely. All of this is **V1** except server/data-centre hot-swap parts (**Later**).

Jargon: **process mode** = how many of the five steps start by themselves. **Engine** = the NexWipe program on the stick
that does the real work; the laptop screen (Chromium kiosk, a full-screen browser with no address bar) talks to it on
127.0.0.1 (the laptop's own address). **Heartbeat** = a small "I'm alive, here is my progress" message the eraser sends
to the web app every few seconds.

## In short (research section) — parity rows
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Every run follows numbered steps 1 Erasure, 2 Hardware tests, 3 Custom fields, 4 Report, 5 Restart/Shutdown | Same five steps, same order, shown as a step bar at the top of the laptop screen | Engine keeps a `process_state` (current step + status per step); kiosk UI draws the bar | V1 |
| Process mode chosen only in CT | Mode chosen only on the "Prepare stick" page | `process.mode` field in signed `nexwipe-setup.json`; engine refuses unsigned/changed files | V1 |
| Workflow mode replaces fixed steps with a script from the portal | Same: workflow fetched from the web app | See [workflows.md](workflows.md) | V1 |
| BMP can monitor or fully control machines remotely | Web app can monitor or fully control erasers | §6.3 below | V1 |

## 6.1 The four processes (§4.1, p.30–31)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "Processes define how the erasure process is handled and how much user interaction it requires." | Same concept: four modes controlling how much the technician has to click | Enum `manual / semi_automatic / automatic / workflow` in setup file | V1 |
| Configured process is visible in the UI | Laptop screen shows "Process: Manual" (etc.) next to the step bar | Kiosk UI reads mode from engine `/status` | V1 |
| Process "can only be changed via the CT software" | Mode can only be changed on the "Prepare stick" page (re-make or re-sync the stick); no switch on the laptop | Setup file is signed by the web app; engine has no API to change mode | V1 |

### Manual (§4.1.1)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| User starts erasure | Technician presses Erase (§6.2) | Engine waits for `POST /erase` from the kiosk after typed confirmation | V1 |
| User runs tests | Technician starts hardware tests by hand | Tests tab "Run" buttons (step 12) | V1 |
| User updates custom fields | Technician fills custom fields by hand | Custom fields tab (step 13) | V1 |
| User sends report to BMP or saves to USB | Technician presses "Send to NexWipe" or "Save to USB" | Report tab; send = HTTPS to agent API; save = write signed report to a chosen removable drive (never the boot stick's system area) | V1 |
| User shuts down | Technician presses Shutdown | `systemctl poweroff` from engine after report-backup check (step 14) | V1 |

### Semi-automatic (§4.1.2)
| Step | Blancco behaviour | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 Erasure | Automatically run | Erasure starts by itself after drive detection | Engine auto-starts with the stick's default standard; still never touches the boot stick or hidden removable media; the "are you sure" step is replaced by the setup-time confirmation on the Prepare stick page (owner ticks "this stick erases automatically") | V1 |
| 2 Hardware tests | Run manually | Technician runs them | Same as Manual | V1 |
| 3 Custom fields | Must be run manually (even if not mandatory) | Custom fields screen always opens and waits for "Done" | Engine blocks step 4 until custom-field step is confirmed | V1 |
| 4 Report | Automatically sent to BMP after custom fields updated; saving optional and manual | Report sent to the web app as soon as custom fields are confirmed; "Save to USB" stays a manual button | Engine calls agent API report endpoint; retries while offline | V1 |
| 5 Shutdown | Configurable via CT ("Automatic Restart/Shutdown") | Configurable on Prepare stick page (options in step 14) | `finish.action` in setup file | V1 |

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| A shutdown/restart popup is always shown at the end of testing | Same popup: "Restart / Shut down / Stay on" | Kiosk modal raised by engine event `tests_finished` | V1 |
| Proceeds to custom fields if at least one test completed (passed or failed), including Required tests | Same rule: move to step 3 once ≥1 test has a result (pass or fail), Required tests included | Engine rule `tests_completed >= 1` | V1 |

### Automatic (§4.1.3)
| Step | Blancco behaviour | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 1 Erasure | Starts automatically | Same as Semi-automatic | Engine auto-start | V1 |
| 2 Hardware tests | Run manually (software waits) | Engine waits for the technician's manual tests | Engine state `waiting_for_tests` | V1 |
| 3 Custom fields | Manual only if mandatory (skipped otherwise) | Screen opens only if a field is marked Required; otherwise skipped | Engine checks `required` flags from setup file | V1 |
| 4 Report | Automatically sent to BMP; saving optional, manual | Same | Agent API report endpoint | V1 |
| 5 Restart/Shutdown | Configurable via CT | Configurable on Prepare stick page | Step 14 options | V1 |

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Proceeds to custom fields if at least one manual test completed | Same rule | Engine rule | V1 |
| With only automatic tests it proceeds when erasure finishes | Same: if the stick has only automatic tests, move on when erasure ends | Engine rule `no_manual_tests → advance on erasure_done` | V1 |
| A shutdown/restart popup is always shown at the end of testing | Same popup | Kiosk modal | V1 |

### Workflow (§4.1.4)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "The process is managed by a workflow which is fetched from BMP." | Process is managed by a workflow fetched from the NexWipe web app | Engine downloads the workflow JSON from the agent API; full detail in [workflows.md](workflows.md) | V1 |

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Datasheets describe "4 levels of process automation: workflow, manual, semi-automatic, automatic" | Marketing/help text describes the same four levels (own wording) | Help page in web app; feature listed "Planned" until built (AGENTS.md honesty rule) | V1 |

## 6.2 Starting erasure manually (§4.2.3.1, p.35)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| "Erase" button bottom-right | Erase button bottom-right of the laptop screen | Kiosk UI | V1 |
| Ctrl+E shortcut | Ctrl+E opens the same confirmation | Kiosk key handler | V1 |
| Confirmation window (Yes / No) | Confirmation window listing every drive to be wiped (model, serial, size); technician types `ERASE` then presses Yes, or No to go back | NexWipe safety rule: typed confirmation | V1 |
| EULA link in the confirmation | Link to NexWipe's own terms of use | Static page bundled on the stick (works offline) | V1 |
| Warning: if a drive has a freeze lock BDE may remove it and "the screen may momentarily turn off" | Same warning (own wording): "Some drives are locked; NexWipe may put the laptop to sleep for a few seconds to unlock them — the screen may go dark briefly." | Freeze-lock removal uses `rtcwake -m mem -s 5` (sleep and wake) then `hdparm -I` re-check (step 07; confirm in lab) | V1 |

## 6.3 Remote monitoring and control (§7.23, p.95)
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| BMP is required in both cases | The NexWipe web app is required for both monitoring and control | Eraser must have network + stick key enrolled | V1 |
| Also required for external asset-management integrations | Same: integrations go through the web app, never directly to the eraser | Server-side integrations only | Later |

**Monitoring**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Enable remote monitoring in the image (CT) | "Remote monitoring" switch on Prepare stick page | `remote.monitoring: true` in setup file | V1 |
| Fill BMP connection settings (CT or client Settings) | Web app address + stick key filled automatically by the Prepare stick page; can also be entered on the laptop's Settings screen if missing | Setup file `connection` block; kiosk Settings form | V1 |
| Process control must be "Local user interface" | Same option name idea: "Control: on this laptop" (monitoring only) | `remote.control: local` | V1 |
| BMP's Client Overview tab follows the process | Web app "Live erasures" page follows each machine (step, per-drive %, speed, time left, errors) | Heartbeat every few seconds to agent API; react-query page refreshing by org id; progress table with short retention (migration needed) | V1 |
| BMP "cannot control the erasure directly" in monitoring mode | Same: monitoring mode has no buttons that change the machine | UI shows read-only view; API rejects commands when `control=local` | V1 |
| BMP can detect problems | Web app flags problems (stalled progress, errors, offline machine) | Rules on heartbeat data (e.g. no heartbeat for 2 min → "offline") | V1 |
| BMP assigns a numeric ID shown on the screensaver (top right) | Web app gives each running session a short number, shown top right of the laptop screensaver | Number returned in first heartbeat reply | V1 |
| …and in the Process area | Same number shown in the step-bar area | Kiosk UI | V1 |

**Control**
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Process control = "Blancco Management Portal remote" (CT) | Process control = "Controlled from NexWipe web app" (Prepare stick page) | `remote.control: web` | V1 |
| BMP can push an erasure standard to target machines | Web app can push an erasure standard to one or many selected machines | Command table (deliver-once, expires after a few minutes); engine picks commands up on each heartbeat; only owner/admin/technician of that company; every command in audit log | V1 |
| BMP can push a workflow to target machines | Same for workflows | Same command channel | V1 |
| When the remote session is cleared in BMP, BDE fetches a stop command on the next polling round | Same: "End remote session" in the web app; eraser receives stop on its next heartbeat | Command `stop_remote` | V1 |
| …acknowledges | Eraser acknowledges the stop | Ack row written by agent API (service role) | V1 |
| …stops accepting remote commands | Same; engine ignores any later commands for this session | Engine flag `remote_closed` | V1 |
| …waits to be shut down manually | Same; screen says "Remote session ended — shut down this laptop by hand" | Kiosk banner | V1 |
| UI shows `#` in the session ID | Session number replaced by `#` | Kiosk UI | V1 |
| Connectivity and licence status turn red | Connection and wipe-credit indicators turn red | Kiosk notification area | V1 |
| BMP icon says "Communication with the BMP has failed..." | Web-app icon tooltip: "Lost contact with NexWipe web app" (own wording) | Kiosk UI | V1 |
| Remote PDF (2021): remote and simultaneous erasures across multiple drives and locations via the console | Web app can start erasures on many machines in many sites at once | Same command channel, multi-select on Live erasures page | V1 |
| Option: automatic machine shutdown after erasure | Remote command "shut down after erasure" | Command sets engine finish action | V1 |
| Option: pause | Remote pause (refused while a firmware command runs — safety rule) | Engine stops issuing new overwrite writes and remembers the last block written; firmware commands cannot be paused | V1 |
| Option: cancel | Remote cancel (refused during firmware commands; result becomes "Not erased", never "Erased") | Engine cancel | V1 |
| Option: resume | Remote resume | Engine resumes overwrite from last confirmed block | V1 |

## 6.4 Multitasking and hot swap
| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Process area supports multitasking (see step 4) | Several drives erase at the same time, each with its own card | Engine runs one worker per drive (Rust/Go threads) | V1 |
| Hot swap (§7.16): remove/add drives and press Refresh drive list (Ctrl+R) without affecting other erasures | Same: Refresh button + Ctrl+R; other erasures carry on | Engine re-scans `lsblk`/`/sys/block` + udev events | V1 |
| Only if "Report per Connected Device" mode is enabled | Same condition: hot swap only when "one report per drive" mode is on (step 13) | Engine checks setup flag | V1 |
| Refresh pauses all erasures and resumes them after re-detection | Same | Engine pauses overwrite workers, re-detects, resumes | V1 |
| If a firmware command is running, refresh waits ("A firmware command is being executed on one of the drives. The list of drives will be refreshed after it finishes.") | Same wait and same meaning (own wording) | Engine queues refresh until firmware command returns | V1 |
| Supported for SAS/SCSI/SATA/FC/USB/NVMe visible as nodes | SATA, USB, NVMe on laptops/desktops | udev hotplug | V1 |
| …SAS/SCSI/FC | Same for SAS/SCSI/Fibre Channel | sg3_utils rescan (`rescan-scsi-bus.sh`, confirm in lab) | Later |
| Not behind pass-through RAID | Same limit: drives hidden behind a RAID card are not hot-swappable | Detection marks them | Later |
| NVMe hot swap officially only on SuperMicro X10SLL-F and X10SRL-F boards | NexWipe will list only boards it has tested itself; none for V1 (laptop NVMe isn't hot-swappable anyway) | Lab-tested board list | Later |
| Hybrid appliances supported | n/a for NexWipe until tested — server hardware | Lab list | Later |
| "Hotplug timeout" default 60 s | Same setting, default 60 s | Setup file `hotplug.timeout_s` | V1 |
| ≥30 s allowed for SATA/USB only | Same minimum: 30 s if only SATA/USB | Prepare stick page validation | V1 |
| ≥60 s for SAS/SCSI/FC/NVMe | Same minimum: 60 s when NVMe (or SAS/SCSI/FC, Later) is used | Validation | V1 |
| Wait 10–15 s after plugging an HDD | Same advice shown on screen after plug-in | Kiosk hint | V1 |
| Three failed detections of the same drive → hotplug service error, reboot suggested | Same: after 3 failed detections show "Drive detection keeps failing — restart the laptop" | Engine counter per serial/slot | V1 |
| Some old EMC 1 GB drives must be inserted before boot | Same note in help: some old drives must be plugged in before boot | Help text; n/a to laptops | Later |
