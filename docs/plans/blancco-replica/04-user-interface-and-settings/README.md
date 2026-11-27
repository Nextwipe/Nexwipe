# Plan — Step 4 — The user interface and settings

Mirrors: research [04-user-interface-and-settings/README.md](../../../research/blancco-drive-eraser/04-user-interface-and-settings/README.md)

Source of the Blancco facts: Blancco Drive Eraser User Manual v7.21.0, pages 15–29 and 56–78, as summarised in the research file. Section numbers ("§x.y, p.N") are kept so every row can be checked against the manual. Rows are numbered (`#`) so the owner can check that nothing was dropped: every research item has exactly one numbered row here.

Naming used in this plan: **NexWipe Eraser** = the bootable Linux system on the `NEXWIPE` stick (Blancco Drive Eraser, "BDE"). **Prepare stick page** = the page in the new "Prepare stick" section of the NexWipe web app that writes the signed `nexwipe-setup.json` (Blancco Configuration Tool, "CT"/"DECT"). **NexWipe web app** = Blancco Management Portal ("BMP"). **Laptop screen** = the local web app shown full-screen in Chromium (kiosk mode: no address bar, no tabs, no way out to a desktop) on the laptop being wiped, talking to the eraser engine on `127.0.0.1` (the laptop's own internal address — nothing leaves the machine).

## In short

- The laptop screen copies Blancco's three-part layout: a **header** (name, version, Settings, Report issue, Help, Shutdown), a **process area** (1 Erasure, 2 Hardware tests, 3 Custom fields, 4 Report) and a **work area**; the technician can switch steps while wipes run.
- The **Settings** window has the same tabs (General, Communication, Operation, Networking, Network Security, NVMe-oF) with the same defaults and limits; every setting can be pre-set or locked on the Prepare stick page.
- The bottom-left **notification icons** (clock, battery, mini asset report, network, remote control, network share, web-app connection, wipe credits, lock, software update, DHCP server, NVMe-oF) behave the same; data-centre and Chromebook icons are `Later`.
- **Every keyboard shortcut** is rebuilt with the same keys; a few keys that Chromium itself reserves need a lab check (see §5 notes).
- The **screensaver** shows overall progress, result colours, exception and temperature warnings, a remote-erasure mode and a lock mode — all `V1`.

### Jargon used on this page

Each term keeps its one-line meaning from the research and gets its NexWipe equivalent.

| # | Term | One-line meaning | NexWipe equivalent | Phase |
|---|---|---|---|---|
| 1 | BMP (Blancco Management Portal) | Blancco's central server that stores reports, hands out licences, controls erasers remotely (p.61). | The **NexWipe web app** (cloud only; no self-hosted "On-Premise" version planned — n/a for NexWipe for now, reason: one hosted app). | V1 |
| 2 | CT / DECT (Configuration Tool) | Blancco software that configures the eraser image (p.19). | The **Prepare stick page** in the web app; output is the signed `nexwipe-setup.json` on the stick. | V1 |
| 3 | ISO image | The bootable disk image put on USB/PXE/CD. | The NexWipe Eraser image, written to a stick by **NexWipe Stick Creator** (Windows 10/11 app). PXE/CD: Later. | V1 (USB) / Later (PXE) |
| 4 | HASP | USB licence dongle holding licences offline. | No dongle. Equivalent: a signed **offline credit pack** file on the stick (wipe credits, no charge in V1). | V1 |
| 5 | Licence container | Where licences come from: HASP or BMP. | "Credit source": offline credit pack or NexWipe web app. | V1 |
| 6 | DHCP | Network service that hands out IP addresses automatically. | Same; NetworkManager's DHCP client on the stick. | V1 |
| 7 | DNS | Turns host names into IP addresses. | Same; set via NetworkManager. | V1 |
| 8 | IPv4 / IPv6 | Older/newer IP address formats. | Both supported, IPv4 preferred (§3.3.4). | V1 |
| 9 | Subnet mask / prefix | Which addresses are on the local network. | Same fields in Networking tab. | V1 |
| 10 | Gateway | Router address to other networks. | Same field. | V1 |
| 11 | VLAN | Logical network separated by an ID. | Same field (Linux 802.1Q VLAN via NetworkManager). | V1 |
| 12 | MTU | Largest network packet accepted. | Same field, used for NVMe-oF. | Later |
| 13 | NIC | Network card/port. | Same ("network adapter" in the UI). | V1 |
| 14 | WLAN / SSID / WPA | Wi-Fi; network name; Wi-Fi encryption. | Same; Wi-Fi via NetworkManager + wpa_supplicant. | V1 |
| 15 | WPA-PSK / WPA-EAP | Shared password vs per-user enterprise login. | Both supported. | V1 |
| 16 | IEEE 802.1X | Device must log in before getting network access. | Same; wpa_supplicant (wired and Wi-Fi). | V1 |
| 17 | PEAP / EAP-MSCHAPv2 | Username + password inside an encrypted tunnel. | Same method offered. | V1 |
| 18 | CA certificate | Checks a server is genuine. | Same; uploaded on the Prepare stick page. | V1 |
| 19 | PEM / PKCS12 | Certificate/key file formats. | Both accepted. | V1 |
| 20 | TLS | The encryption used by HTTPS. | Same; all eraser-to-web-app traffic is HTTPS. | V1 |
| 21 | Proxy | Intermediate server for web traffic. | Same setting group. | V1 |
| 22 | SSH | Remote command-line access. | "Allow remote connection from NexWipe support" (off by default). | V1 |
| 23 | VNC | Remote-desktop protocol. | Third-party remote control of the laptop screen (§4.7.5). | Later |
| 24 | NVMe-oF | NVMe storage over a network. | Same tab and icon. | Later |
| 25 | RDMA / RoCEv2 | Remote memory access / over Ethernet. | Same protocol option. | Later |
| 26 | HPE Alletra | HPE storage array named as example. | n/a for V1 — storage arrays are data-centre work. | Later |
| 27 | PXE | Network booting. | NexWipe network boot. | Later |
| 28 | UTC offset | Local time minus universal time. | Same display; set on the Prepare stick page. | V1 |
| 29 | BIOS / UEFI | Built-in firmware with its own clock. | Same; NexWipe reads/writes that clock (§4.7.1). | V1 |
| 30 | PSID | ID printed on self-encrypting drives, used to factory-reset them. | Same; "Enter PSID" dialog, `sedutil-cli --PSIDrevert` (step 07 plan). | V1 |
| 31 | SID block | Drive security feature that can block security commands. | Same; "Disable SID block" dialog (step 07 plan). | V1 |
| 32 | DCO | Hidden-capacity feature on ATA drives. | Same; removal via `hdparm --dco-restore` (step 07 plan; confirm in lab). | V1 |
| 33 | Hex viewer | Shows raw bytes of a drive. | Same; read-only viewer in the work area. | V1 |
| 34 | FLR | Boot option "FLR during startup"; not expanded in these pages. | From research step 07: **Freeze Lock Removal** (sleep-wake cycle to unfreeze drives), NexWipe uses `rtcwake -m mem` (step 07 plan). | V1 |
| 35 | Hangul / Hiragana / Katakana / Kanji / Hanja | Korean/Japanese writing systems. | Same input methods (§5.1.6). | Later |
| 36 | AZERTY | French keyboard where number keys need Shift. | Same reason to offer Ctrl+Shift+number (§5.3). | V1 |

---

## Context from page 15 (end of chapter 1)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 37 | Warning: an operation "can permanently damage the drive(s)"; also applies to any erasure with "Erase remapped sectors" checked (p.14–15). | Same warning text (own wording) shown next to the "Erase remapped sectors" option and in the confirmation dialog. | Laptop screen; option itself in step 08 plan. | V1 |
| 38 | Note: avoid shutting down, exiting, or disconnecting a drive mid-erasure — all erasure information is lost and the drive may be damaged (p.15). | Same note on screen during wipes; Shutdown (F10) warns while any wipe runs; an interrupted wipe is never reported as "Erased". | Laptop screen + engine result rules (step 11 plan). | V1 |
| 39 | §1.1 Legal Notice: not responsible for OS/hardware changes or malware; licence non-transferable (p.15). | NexWipe's own terms (written by the owner/lawyer, not copied) shown in the web app and in the eraser's Help. | Legal text, not code. | V1 |
| 40 | §1.2 Copyright and Confidentiality (p.15). | NexWipe's own copyright line in Help/About. Blancco's text is n/a for NexWipe — it is Blancco's. | Text. | V1 |

---

## Chapter 2 — The BDE user interface (p.16–18)

### Boot splash screen (§2, p.16)

The boot menu is the first thing shown when the stick starts (GRUB menu, signed for Secure Boot via shim — details in step 03 plan).

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 41 | Option "Normal startup (safe resolution)". | Same option: start with a basic, safe screen mode. | GRUB entry with `nomodeset`-style kernel option (confirm in lab). | V1 |
| 42 | Option "Normal startup (native resolution)". | Same option: full graphics driver at the panel's own resolution. | GRUB entry, normal kernel. | V1 |
| 43 | Option "Installer". | Same option: install NexWipe Eraser onto a dedicated erasure workstation ("installed mode"). | Later — not needed to wipe Windows laptops from a stick. Until then the entry is not shown. | Later |
| 44 | Option "FLR during startup" — **default selection**. | Same option, also the **default**: Freeze Lock Removal during boot. | GRUB default entry sets a kernel flag; engine runs `rtcwake -m mem -s 5` before drive scan (step 07 plan; confirm in lab). | V1 |
| 45 | Option "Show startup messages". | Same: boot with text messages visible (for troubleshooting). | GRUB entry without `quiet`. | V1 |
| 46 | Option "Customized startup". | Same: technician types extra boot options. | GRUB edit-entry prompt with a whitelist of allowed options (no option can disable safety rules). | V1 |
| 47 | Details are in the "Booting Options" chapter. | Details in step 03 plan. | Cross-reference. | V1 |
| 48 | Memory test, if enabled, runs in this phase with a message; "works mostly on BIOS machines"; slow on machines with lots of RAM. | Same optional memory test at boot with on-screen message and the same "may take long" warning. | memtest86+ boot entry (UEFI build) — confirm in lab which laptops support it; enabled on the Prepare stick page. | V1 |
| 49 | After loading, the main view appears with header area (1), process area (2), work area (3). | Same three-area layout. | Laptop-screen web app (React, same design system as the web app). | V1 |
| 50 | Display scaling via "Scaling" in CT General tab: default **100%**, up to **200%**. | Same setting on the Prepare stick page: default 100%, max 200%. | Chromium `--force-device-scale-factor` (confirm in lab) or CSS zoom. | V1 |

### §2.1 Header area (p.17)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 51 | Shows software name and version. | Shows "NexWipe Eraser" and version. | Header component; version from the signed image manifest. | V1 |
| 52 | Function button: change UI language. | Same (inside Settings → General). | Header → Settings. | V1 |
| 53 | Function button: keyboard layout. | Same. | Header → Settings. | V1 |
| 54 | Function button: screensaver settings. | Same. | Header → Settings. | V1 |
| 55 | Function button: communication settings. | Same. | Header → Settings. | V1 |
| 56 | Function button: report an issue. | Same "Report issue" button (§3.4). | Header button. | V1 |
| 57 | Function button: help menu. | Same "Help" button (§3.5). | Header button. | V1 |
| 58 | Function button: shut down the machine. | Same "Shutdown" button (§3.6). | Header button. | V1 |

### §2.2 Process area (p.17)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 59 | Step 1. Erasure — detect drives, choose what/how, start. | Same step. | Work area screen; engine API `/drives`, `/erase`. | V1 |
| 60 | Step 2. Hardware tests — not in all modes; can be turned off. | Same; can be turned off on the Prepare stick page. | Step 12 plan. | V1 |
| 61 | Step 3. Custom fields — fill in/update report; can be turned off. | Same; can be turned off. | Step 13 plan. | V1 |
| 62 | Step 4. Report — view, send and/or save. | Same. | Step 13 plan. | V1 |
| 63 | §2.2.1 Basic process: steps can be followed in order "but not necessarily". | Same: tabs are freely clickable in Manual mode. | Router in the laptop-screen app; process modes in step 06 plan. | V1 |

### §2.2.2 Multitasking (p.18)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 64 | Move freely between tabs during an active erasure: update report, run hardware tests, even send/save an *incomplete* report while a drive erases; other drives can start together or one by one. | Same. An incomplete report is clearly marked "In progress — not a final result" and can never show "Erased" for a drive still running. | Engine runs each wipe as its own background task; UI only reads status. | V1 |

### §2.3 Work area (p.18)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 65 | Shows the details of each step (drives and standards; extra fields; asset and erasure info). Most interaction happens here. | Same. | Laptop-screen app. | V1 |
| 66 | A warning during erasure writes a **"yellow" informative message** into the report. | Same: warnings are stored as yellow "Note" lines in the report (not errors, not hidden). | Report schema field `warnings[]` (step 13 plan). | V1 |

### §2.4 Popup for special drives (p.18)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 67 | If at least one extra removable flash drive is detected: "Device Detected — … has detected removable flash drive(s). Please consider removing or erasing them." | Same popup (own wording). Removable drives stay **hidden from the erase list by default**; the `NEXWIPE` boot stick is never listed as erasable. | Engine: `lsblk` removable flag / USB transport, boot device identified by its partition ID (safety rules). | V1 |

### §2.5 Storage controller mode switching (p.18)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 68 | Detects a storage controller with several changeable modes and asks permission to reconfigure, for more drive control and better performance. | Same popup for server RAID/HBA controllers. (Laptop "RAID/Intel RST/VMD" mode is a BIOS setting — handled in step 02 plan, not by this popup.) | Vendor tools for RAID cards (e.g. `storcli`) — confirm in lab. | Later |
| 69 | Buttons "Yes, proceed" / "No, skip". | Same two buttons. | Popup. | Later |
| 70 | Default highlighted "No, skip" (configurable in CT). | Same default; configurable on the Prepare stick page. | Setup file field. | Later |
| 71 | Popup time limit 30 s by default (configurable in CT). | Same: 30 s default, configurable; on time-out the default is taken. | Setup file field. | Later |
| 72 | Warning: all virtual volumes are deleted and the system restarts — permanent data loss possible. | Same warning, typed confirmation required. | Popup. | Later |

### §2.6 Other popups (p.18)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 73 | If the CA certificate on BMP fails validation: "Warning — Certificate validation failed." | Same popup if the web app's (or proxy's) certificate fails validation; nothing is sent. | TLS check in engine HTTP client. | V1 |

---

## Chapter 3 — Header area (p.19–29)

### §3.1 Product name, version and licence control (p.19)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 74 | Edition name "Volume Edition". | n/a for NexWipe — one edition. Header shows "NexWipe Eraser" and the company's credit mode instead. | Header. | V1 |
| 75 | Edition name "Enterprise Subscription Edition". | n/a for NexWipe — no subscription in V1 (free). If payment arrives, a "Subscription" label is shown here. | Header. | Later |
| 76 | Edition name "Enterprise Volume Edition". | n/a for NexWipe — one edition. | — | V1 |
| 77 | Software version shown top-left. | Same. | Header. | V1 |

### §3.2 Image usage label (p.19)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 78 | Free-text label under the version describing what this image is for ("For laptops with SSDs"), set in CT. | Same: "Stick label" text field on the Prepare stick page, shown under the version. | `nexwipe-setup.json` field `usage_label`. | V1 |

### §3.3 Settings function button (p.19)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 79 | "Settings" opens a window with several tabs. | Same Settings window with tabs below. Every setting is pre-set from `nexwipe-setup.json`; changes made on the laptop apply to that laptop's session. | Laptop-screen dialog; engine API `/settings`. | V1 |

#### §3.3.1 General tab (p.19–20)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 80 | Language (example English – en). | Same dropdown; lists only languages that are fully translated (English in V1). | i18n files in the laptop-screen app. | V1 |
| 81 | Keyboard Layout (example English (United States) – us). | Same dropdown, default `us`. | XKB layout set in the kiosk compositor (Cage/Wayland — confirm in lab). | V1 |
| 82 | Enable input method switching (Japanese/Korean), switch with Shift+Space. | Same. | fcitx5 input method (confirm it works in the kiosk compositor). Not needed for first Windows customers. | Later |
| 83 | Enable screensaver on/off. | Same. | Laptop-screen app idle timer. | V1 |
| 84 | Screensaver Timeout (sec.) 30; range **5–86,400 s**. | Same: default 30, range 5–86,400; out-of-range values refused. | Setting validation in app and setup-file schema. | V1 |
| 85 | License container: Local HASP or BMP. | "Credit source": offline credit pack or NexWipe web app. Wipe credits are counted, no charge in V1. | Engine credit module (step 16 plan). | V1 |
| 86 | Sound Volume (example 70). | Same slider, default 70. | PipeWire/ALSA volume (`amixer`), finish/fail sounds. | V1 |
| 87 | Screen reader enabled (spoken UI feedback) — needs a separate ISO. | Same: needs a "with screen reader" stick option on the Prepare stick page. | Orca + speech-dispatcher + espeak-ng in a separate image variant (confirm Chromium accessibility in kiosk). | Later |
| 88 | Speaking rate slider (example 80). | Same, default 80. | speech-dispatcher rate. | Later |
| 89 | Key echo enabled. | Same. | Orca key echo. | Later |
| 90 | Footnote: contact Blancco for an image with the screen reader (p.20). | NexWipe: tick "Include screen reader" on the Prepare stick page (no need to contact anyone). | Prepare stick page. | Later |

#### §3.3.2 Communication tab (p.20–21)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 91 | Covers BMP connectivity and network share; wireless settings also changeable in CT. | Same tab; Wi-Fi also settable on the Prepare stick page. | — | V1 |

**Communication settings**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 92 | Blancco Account: "Management Portal" (cloud, no host/port needed) or "On-Premise". | "NexWipe web app" only — no address needed (it is fixed and pinned in the image). On-Premise: n/a for NexWipe, reason: no self-hosted version. | Allowed origins as in `src/lib/app-origins.ts`. | V1 |
| 93 | Hostname/IP (IPv4/IPv6). | n/a while there is no self-hosted version (address is fixed). | — | Later |
| 94 | Port 8443 default; HTTPS always enforced. | HTTPS always enforced (port 443, fixed). Custom port n/a, same reason. | Engine HTTP client. | V1 |
| 95 | Username 3–64 characters; eye symbol shows it temporarily. | Station sign-in uses the **stick key** (per-stick secret in the setup file), not a typed username; if a technician sign-in is added, same 3–64 limit and eye symbol. | Agent API station auth (`src/server/agent-api/`). | V1 |
| 96 | Password 6–64 characters. | Same limit if a typed password is used. | Validation. | V1 |
| 97 | "Do Not Validate The Remote Certificate": validation enforced by default; disabled by design on IP addresses. | NexWipe always validates the web-app certificate; the "do not validate" switch is **not offered** for the web app (safer; only one fixed hostname). Deviation noted. | Engine TLS. | V1 |

**Network share connection**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 98 | Hostname/IP of the share server. | Same field. | `mount.cifs` (cifs-utils) for Windows/SMB shares. | V1 |
| 99 | Path (Root/folder) where reports are saved. | Same. | Mount path + subfolder. | V1 |
| 100 | Username (eye symbol shows it). | Same. | credentials file in RAM only. | V1 |
| 101 | Password. | Same. | RAM only, shown as "encrypted data" on reopen. | V1 |
| 102 | Domain (optional). | Same. | `domain=` mount option. | V1 |
| 103 | VNC remote-control settings are in the CT manual (p.21). | Remote-control settings only on the Prepare stick page (§4.7.5). | — | Later |

#### §3.3.3 Operation tab (p.22–23)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 104 | Simultaneous Erasures Limit (example 50); extra erasures go to a paused **erasure queue** until a slot frees; max can differ by edition. | Same: default 50, queue with "Queued" status. One edition, so one maximum (set after lab tests). | Engine job scheduler (semaphore). | V1 |
| 105 | Enable Speed Threshold — **off by default**; fail erasure if speed drops below threshold. | Same, off by default; result "Not erased — too slow". | Engine measures MB/s per drive. | V1 |
| 106 | Speed Threshold (MB/s), example 0, range **1–10,000**. | Same range 1–10,000. | Validation. | V1 |
| 107 | Process timeout: cancel erasure/verification longer than a set time; range **1–8,760 h**; warning it may brick a drive if ended during a firmware erase command. | Same setting and range. Safety deviation: NexWipe **never** ends a firmware erase command early — overwrite/verify passes are stopped at the limit, a running firmware command is allowed to finish and the drive is then marked "Not erased — timed out". | Engine timer per job. | V1 |
| 108 | Spin Down Idle Disks: HDDs idle 5 min spun down. | Same, 5 minutes. | `hdparm -y` on idle HDDs (confirm in lab). | V1 |
| 109 | Also limits starts to max one erasure per second. | Same stagger. | Scheduler. | V1 |
| 110 | Cuts batch power surge by ~40% and saves energy after finishing. | Same benefit (Blancco's figure; NexWipe will measure its own in lab, not quote 40%). | Lab measurement. | V1 |
| 111 | Explainer: firmware-based erasure = command inside the drive (e.g. Secure Erase); cutting it off can leave the drive unusable. | Same explainer in help text; no pause/cancel buttons during firmware commands. | Safety rules. | V1 |

#### §3.3.4 Networking tab (p.23–24)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 112 | Wired, DNS, VLAN, MTU, WLAN settings; Wi-Fi (encryption type, SSID) changeable in BDE and CT. | Same; Wi-Fi in Settings and on the Prepare stick page. | NetworkManager (`nmcli`). | V1 |
| 113 | IPv4 and IPv6 supported; IPv4 prioritised if both. | Same. | NetworkManager / `gai.conf` preference (confirm in lab). | V1 |
| 114 | "WPA-PSK" covers WPA-PSK, WPA2-PSK, WPA3-SAE; WPA-EAP and WPA2-EAP supported. | Same set. | wpa_supplicant. | V1 |
| 115 | Note: IPv6 does not support Chromebooks or NVMe-oF. | Same limitation recorded; matters only when those ship. | — | Later |

**Wired network settings (p.24)**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 116 | Interface dropdown. | Same. | `nmcli device`. | V1 |
| 117 | Enabled on/off; off greys out the rest. | Same. | UI. | V1 |
| 118 | Use DHCP; greys out IP/mask/gateway. | Same. | NetworkManager `ipv4.method auto`. | V1 |
| 119 | DHCP required for storage systems such as HPE Alletra. | Same rule when storage arrays ship. | — | Later |
| 120 | IP address (IPv4 or IPv6). | Same. | `ipv4.addresses`. | V1 |
| 121 | Subnet mask / Prefix. | Same. | — | V1 |
| 122 | Gateway. | Same. | — | V1 |

**MTU settings (for NVMe-oF)**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 123 | MTU (example 9000, "jumbo frames" for Alletra). | Same field. | `ethernet.mtu`. | Later |

**DNS settings**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 124 | Primary IP (example 8.8.8.8). | Same. | `ipv4.dns`. | V1 |
| 125 | Secondary IP (example 4.4.4.4). | Same. | `ipv4.dns`. | V1 |

**VLAN settings**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 126 | VLAN ID, range **1–4094**. | Same range. | `nmcli connection add type vlan`. | V1 |

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 127 | Static settings from CT go to the first adapter that accepts them ("First suitable interface"); "Loop until succeeds" cycles adapters until BMP is reached (p.24). | Same two options on the Prepare stick page; success = reaching the NexWipe web app. | Engine network loop script over `nmcli`. | V1 |

#### §3.3.5 Network Security tab (p.24–26)

**Proxy settings**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 128 | Protocol HTTP or HTTPS. | Same. | Engine HTTP client proxy config. | V1 |
| 129 | Hostname/IP (example 10.1.1.2). | Same. | — | V1 |
| 130 | Port (example 8080). | Same. | — | V1 |
| 131 | Username. | Same. | — | V1 |
| 132 | Password. | Same. | — | V1 |
| 133 | "Do not validate the proxy certificate" (default disabled). | Same, default off, with a red warning when on. The web app's own certificate is still checked end to end. | — | V1 |

**Remote SSH connections**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 134 | "Allow remote connection from Blancco Support": on = SSH allowed, off = none possible. | "Allow remote connection from NexWipe support", **off by default**; on = SSH with a NexWipe support key only (no passwords), shown in the tray while active. | OpenSSH server not started unless switched on. | V1 |

**IEEE 802.1X authentication**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 135 | Enabled — 802.1X over adapters and WPA2 enterprise Wi-Fi. | Same. | wpa_supplicant (wired + Wi-Fi). | V1 |
| 136 | Use CA Certificate (added via CT). | Same; uploaded on the Prepare stick page. | — | V1 |
| 137 | Protocol PEAPv0/EAP-MSCHAPv2. | Same. | — | V1 |
| 138 | Identity. | Same. | — | V1 |
| 139 | Password. | Same. | — | V1 |
| 140 | If CA certificate enabled, adding one is mandatory; only valid PEM (cert + key) or PKCS12; **max 10,000 bytes**. | Same rules and 10,000-byte limit. | Validation on the Prepare stick page and on the laptop. | V1 |
| 141 | Sensitive values show as "encrypted data" when reopened. | Same. | Secrets never sent back to the UI. | V1 |
| 142 | On problems, 802.1X is disabled after one round of attempts on every NIC and must be re-enabled manually — only if "Fallback if inaccessible" is enabled in DECT. | Same, with the same "Fallback if inaccessible" option on the Prepare stick page. | Engine network loop. | V1 |

#### §3.3.6 NVMe-oF settings tab (p.26)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 143 | Tab visible only if enabled in CT (under Process). | Same switch on the Prepare stick page. | — | Later |
| 144 | Manage connections: "Add new" / "Delete". | Same. | `nvme connect` / `nvme disconnect` (nvme-cli). | Later |
| 145 | Connection (number) dropdown. | Same. | — | Later |
| 146 | Protocol TCP or RDMA (RoCEv2). | Same. | `nvme connect -t tcp|rdma`. | Later |
| 147 | Target IP (example 10.10.10.5). | Same. | `-a`. | Later |
| 148 | Target port (example 4420). | Same default 4420. | `-s`. | Later |

### §3.4 Report Issue function button (p.27–28)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 149 | Creates an issue report with system info and logs, to be emailed to Blancco Support. | Same issue report; sent to NexWipe support through the web app (no email needed). | Engine collects `journalctl`, `dmesg`, `lspci`, `lsblk`, engine logs; **secrets removed**. | V1 |
| 150 | "Describe the issue" field — mandatory. | Same, mandatory. | UI validation. | V1 |
| 151 | To save on USB: plug stick in first, then press Report issue. | Same instruction. | — | V1 |
| 152 | Select media — choose the USB stick. | Same; the `NEXWIPE` boot stick and drives queued for erasure are not offered. | `lsblk` removable list. | V1 |
| 153 | File name default `yyyymmdd_hhmmss_report`, editable. | Same format, editable. | — | V1 |
| 154 | Format: XML only, extension added automatically. | Same: XML, `.xml` added. | — | V1 |
| 155 | Screenshot settings: "Max screenshots per issue report" slider; remove/export buttons. | Same. | Screenshots from Ctrl+P (§5.4.1.2). | V1 |
| 156 | Save — writes to the USB stick. | Same: writes one new file only, never formats or deletes anything. | Mount, write, `sync`, unmount. | V1 |
| 157 | Send — to BMP; needs network, BMP and correct settings. | Same: to the web app. | Agent API endpoint. | V1 |
| 158 | Cancel — abandon and close. | Same. | — | V1 |
| 159 | USB stick pre-formatted FAT32. | Same requirement; other formats refused with a clear message. | — | V1 |
| 160 | Single partition. | Same. | — | V1 |
| 161 | Name not empty; preferably a–z, A–Z, 0–9. | Same. | — | V1 |
| 162 | In good condition; reformat or replace if in doubt. | Same advice text. | — | V1 |
| 163 | Issue report can also be fetched via BMP. | Same: visible on the station's page in the web app. | Web app page. | V1 |

### §3.5 Help function button (p.28)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 164 | Quick-help window in English. | Same, English, works offline. | Help pages bundled in the image. | V1 |
| 165 | Search bar. | Same. | Client-side text search. | V1 |
| 166 | Menu icon top-right shows Table of Contents. | Same. | — | V1 |

### §3.6 Shutdown function button (p.29)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 167 | Shut down or restart after a successful erasure. | Same. | `systemctl poweroff` / `reboot`. | V1 |
| 168 | If report not saved/sent or has unsaved changes: warning, "Yes" continues, "No" returns. | Same. Extra: also warns while any wipe is still running (§1 note). | — | V1 |
| 169 | Confirmation popup: "Shutdown" or "Restart". | Same. | — | V1 |

---

## Context from page 56 (end of §4.5 / §4.6)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 170 | §4.5.2.3 Send button (Ctrl+N) sends report to BMP. | Same. | Agent API. | V1 |
| 171 | Only one report per session kept in BMP; the latest replaces earlier sends. | Same in what users see: the latest send is the current report. Deviation: earlier sends are kept as "superseded" in the append-only history (NexWipe rule: audit history is never deleted). | Upsert by session id + history row. | V1 |
| 172 | Send fails → error popup; missing settings named one at a time; wrong/missing credentials → popup asks for them. | Same behaviour. | — | V1 |
| 173 | §4.6 Restart/Shutdown step only if Process = Automatic and Shutdown/Restart chosen in CT; timer, or "Restart now"/"Shutdown now". | Same, configured on the Prepare stick page. | Step 06 / step 14 plans. | V1 |

---

## §4.7 Notification icons (p.57–65)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 174 | Lower-left corner tray; hover for tooltip, or Ctrl+Space. | Same. | Tray component; tooltips keyboard reachable. | V1 |

### §4.7.1 Local time and current date (p.57)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 175 | 24-hour time with UTC offset; date Year-Month-Day. | Same format. | — | V1 |
| 176 | UTC offset changed only via CT. | Same: only on the Prepare stick page. | Setup file. | V1 |
| 177 | Time source priority BMP → HASP → BIOS; never drops to a lower source unless restarted without the higher one. | Same rule: **web app → offline credit pack (time it was signed, only as a lower bound) → BIOS clock**. The report records which source was used. | Engine clock module. | V1 |
| 178 | Syncs time with BMP and updates the BIOS clock automatically; time zone set in CT. | Same. | `hwclock --systohc` after sync (confirm in lab); time zone from setup file. | V1 |
| 179 | Why it matters: report timestamps come from this clock. | Same; report shows the time source. | Step 13 plan. | V1 |

### §4.7.2 Battery charge (p.57–58)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 180 | Hidden if no battery. | Same. | `/sys/class/power_supply/BAT*`. | V1 |
| 181 | Two main icons: Charging / Discharging. | Same (own icons). | — | V1 |
| 182 | Green ≥ 50%. | Same. | — | V1 |
| 183 | Orange < 50%. | Same. | — | V1 |
| 184 | Red < 25%. | Same. | — | V1 |
| 185 | Socket icon top-right when charger connected. | Same. | `/sys/class/power_supply/AC*/online`. | V1 |
| 186 | Tooltip shows charging status per battery. | Same. | — | V1 |
| 187 | Charging status every 5 s; level every 60 s. | Same intervals. | Engine poll. | V1 |
| 188 | Status values Discharging, Charging, Full, Unknown. | Same four values (map other kernel values, e.g. "Not charging", to Unknown — confirm in lab). | sysfs `status`. | V1 |

### §4.7.3 Small asset report (p.58–59)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 189 | Tooltip: model, CPU model and frequency, RAM amount and type; full details in Report. | Same. | `dmidecode -t system,memory`, `/proc/cpuinfo` (step 05 plan). | V1 |

### §4.7.4 Network (p.59–60)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 190 | Two states: OK / problem. | Same. | NetworkManager state. | V1 |
| 191 | Tooltip lists interfaces and their status. | Same. | `nmcli device status`. | V1 |
| 192 | Network problem means BMP can't be reached either. | Same message ("web app can't be reached"). | — | V1 |
| 193 | Looping status shown only when: static IP set in CT, BMP settings correct, and looping on ("First suitable interface"/"Loop until succeeds"). | Same three conditions. | — | V1 |
| 194 | "Interface looping in progress". | Same status. | — | V1 |
| 195 | "Interface looping on hold" (green) — suitable NIC found, name shown; tries NICs in turn. | Same. | — | V1 |
| 196 | "Interface looping disabled" — manual config applied, or never on. | Same. | — | V1 |
| 197 | "Interface looping disabled" (green) — off but BMP reachable; NIC unknown. | Same. | — | V1 |

### §4.7.5 Remote control (p.60)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 198 | Supports third-party remote-control software; settings only in CT; tooltip shows mode, port, connected clients. | Same: VNC server option set only on the Prepare stick page; tooltip shows mode, port, client count. | `wayvnc` with password, LAN only (confirm in lab). | Later |

### §4.7.6 Network share (p.60)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 199 | Configured in Settings → Communication; icon hidden if not configured. | Same. | — | V1 |
| 200 | After "Apply" BDE tries to connect; failure shown in tooltip. | Same. | `mount.cifs` result. | V1 |

### §4.7.7 Blancco Management Portal (p.61)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 201 | State "Not set" — no settings. | Same ("Not set up — stick has no company key"). | — | V1 |
| 202 | State "OK" — connected. | Same. | Heartbeat to agent API. | V1 |
| 203 | State "Problem". | Same. | — | V1 |
| 204 | Tooltip shows connection status. | Same. | — | V1 |

### §4.7.8 Licences (p.61–62)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 205 | Shows available licences and assets per machine. | "Wipe credits" icon shows credits (no charge in V1; counting kept). | Engine credit module (step 16 plan). | V1 |
| 206 | Two states: none available / available. | Same. | — | V1 |
| 207 | Tooltip counts; errors if container unreachable. | Same. | — | V1 |
| 208 | Enterprise Subscription Edition shows subscription status instead. | Shown only if a subscription is ever introduced. | — | Later |
| 209 | Erasure licences needed to erase; one also lets you save/send reports. | Same counting idea: one erase credit per wiped drive, includes report. | — | V1 |
| 210 | Asset licences needed to save/send a report without erasure ("asset report"). | Same: "asset credit". | — | V1 |
| 211 | Licences from HASP or BMP; must have enough to start erasure or save/send asset report. | Same rule, sources = offline credit pack or web app. In V1 credits are free and topped up automatically. | — | V1 |

### §4.7.9 Lock settings (p.62–63)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 212 | Enabled in CT under General → Lock settings. | Same switch on the Prepare stick page. | Setup file. | V1 |
| 213 | All-or-nothing, except language and keyboard layout. | Same. | — | V1 |
| 214 | Red lock symbol in Settings when locked. | Same. | — | V1 |
| 215 | Lock/unlock via tray icon or Ctrl+Alt+K; unlock needs the CT password. | Same; password stored only as a hash (argon2id) in the signed setup file. | — | V1 |

### §4.7.10 Software update (p.63–65)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 216 | Only installed mode can update over the air. | Same (installed mode is Later). Sticks are updated by re-preparing them in the web app. | — | Later |
| 217 | Check via icon or Ctrl+U. | Same. | — | Later |
| 218 | No updates → message. | Same. | — | Later |
| 219 | Updates available → yellow blob + prompt, "Yes" updates. | Same. | Signed update package. | Later |
| 220 | Check frequency configured in DECT. | Same on the Prepare stick page. | — | Later |

### §4.7.11 DHCP server (p.65)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 221 | DHCP server settings only when Chromebook support enabled. | Same. | `dnsmasq`. | Later |
| 222 | Static IP must be configured first. | Same. | — | Later |
| 223 | Icon in work area; green dot after first lease. | Same. | — | Later |
| 224 | DHCP client selectable from CT networking settings. | Same. | — | Later |
| 225 | Hover shows up to 5 latest leases. | Same. | — | Later |
| 226 | Lease time 1 hour; no CT pre-configuration; reboot keeps settings. | Same. | — | Later |

### §4.7.12 NVMe-oF (p.65)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 227 | Shows created NVMe-oF connections; settings in Settings menu. | Same. | nvme-cli. | Later |
| 228 | Requires DHCP. | Same. | — | Later |
| 229 | Green blob once ≥1 connection. | Same. | — | Later |
| 230 | Page 66 stray footnote: "The software will wait until the step is finished." | Same behaviour where steps wait (step 06 plan). | — | V1 |

---

## Chapter 5 — Keyboard controls (p.67–72)

Lab notes for all rows below: shortcuts are handled by the laptop-screen app (`keydown` listener). Chromium reserves some keys (notably **Ctrl+N, Ctrl+T, Ctrl+W**) so a web page cannot always catch them; plan is a Chromium kiosk policy/launch configuration or, if that fails, a small kiosk browser (e.g. WPE `cog`) — **confirm in lab**. Every shortcut gets one automated browser test.

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 231 | Whole program usable with keyboard only. | Same. | Focus order + shortcuts. | V1 |

### §5.1 Generic controls (p.67–68)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 232 | Tab: move focus left→right, top→bottom, circular. | Same. | Native tab order + focus trap. | V1 |
| 233 | Shift+Tab: reverse. | Same. | Native. | V1 |
| 234 | Popup X cannot be reached with Tab; use Esc. | Same. | `tabindex=-1` on X. | V1 |
| 235 | During keyboard hardware test, shortcuts are used with Alt (Alt+Tab, Alt+S…). | Same. | Step 12 plan. | V1 |
| 236 | Arrow keys: scroll areas, drop-downs, slider, move between elements. | Same. | — | V1 |
| 237 | Space: toggle checkbox, press button, open link, expand drop-down. | Same. | Native. | V1 |
| 238 | Ctrl+Space: show tray tooltips. | Same. | — | V1 |
| 239 | Ctrl+Shift+Space: previous information tip. | Same. | — | V1 |
| 240 | Ctrl+Enter: apply and close Settings / Erasure settings. | Same. | — | V1 |
| 241 | Shift+Space: toggle Japanese/Korean input; Space for Kanji. | Same. | fcitx5. | Later |
| 242 | Alt+Shift: rotate input methods. | Same. | fcitx5. | Later |
| 243 | Esc: collapse drop-down; close popup without saving; exit hardware test. | Same. | — | V1 |

### §5.2 Header area keys (p.68–69)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 244 | Header buttons reached only with function keys. | Same. | — | V1 |
| 245 | F1 Help. | Same. | — | V1 |
| 246 | F2 Settings. | Same. | — | V1 |
| 247 | F3 Report issue. | Same. | — | V1 |
| 248 | F6 (Japanese) Hiragana. | Same. | fcitx5-mozc. | Later |
| 249 | F7 (Japanese) Katakana. | Same. | fcitx5-mozc. | Later |
| 250 | F8 (Japanese) half-width kana. | Same. | fcitx5-mozc. | Later |
| 251 | F9 (Japanese) Wide Latin. | Same. | fcitx5-mozc. | Later |
| 252 | F9 (Korean) Hanja. | Same. | fcitx5-hangul. | Later |
| 253 | Alt+Shift rotate input methods (header). | Same. | fcitx5. | Later |
| 254 | F10 Shutdown with the unsaved-report warning. | Same. | — | V1 |
| 255 | Rule: first button left of Shutdown = F1, next = F2, etc. | Same rule, applied automatically from the button list. | — | V1 |

### §5.3 Process area keys (p.69)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 256 | Ctrl+number or Ctrl+Shift+number (preferred on AZERTY). | Both work. | Match `event.code` (`Digit1`…), not the typed character. | V1 |
| 257 | Ctrl+1 first visible step. | Same. | — | V1 |
| 258 | Ctrl+2 second visible step. | Same. | — | V1 |
| 259 | Ctrl+3 third visible step. | Same. | — | V1 |
| 260 | Ctrl+4 fourth visible step. | Same. | — | V1 |
| 261 | n-th visible step is always Ctrl+n (steps can be hidden). | Same. | — | V1 |

### §5.4 Work area keys (p.69–72)

**§5.4.1 Erasure step**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 262 | Ctrl+R refresh drives (when "Report per Connected Device" + "Hotplug" on). | Same, with those options (step 08 plan). | Engine rescans `lsblk`/udev. | Later |
| 263 | Ctrl+P screenshot. | Same; kept for the issue report. | Compositor screenshot (`grim`, confirm in lab). | V1 |
| 264 | Ctrl+J "Enter PSID" dialog. | Same. | Step 07 plan. | V1 |
| 265 | Ctrl+M toggle "Show Empty Slots". | Same (needs drive-bay info). | Enclosure slots via SES. | Later |
| 266 | Ctrl+N show NVMe namespaces. | Same. | `nvme list-ns`. | V1 |
| 267 | Ctrl+F search visible drives. | Same. | — | V1 |
| 268 | Ctrl+A select/deselect all drives. | Same; boot stick never selectable. | — | V1 |
| 269 | Ctrl+L locate selected drive. | Same (blinks drive LED). | `ledctl locate=` (ledmon). Laptops have no drive LEDs. | Later |
| 270 | Ctrl+Alt+L locate all drives. | Same. | ledmon. | Later |
| 271 | Ctrl+H Hex viewer. | Same, read-only. | Engine reads sectors (`pread`). | V1 |
| 272 | Ctrl+Alt+R Per Drive report. | Same (with "Report per Connected Device"). | — | Later |
| 273 | Ctrl+Alt+E edit Per Drive custom fields. | Same. | — | Later |
| 274 | Ctrl+Alt+P pause selected erasures. | Same; ignored (with message) for drives inside a firmware command. | — | V1 |
| 275 | Ctrl+Alt+U unpause. | Same. | — | V1 |
| 276 | Ctrl+Alt+C cancel selected erasures. | Same, same firmware exception; cancelled = "Not erased". | — | V1 |
| 277 | Ctrl+G "Erasure settings" window. | Same. | Step 08 plan. | V1 |
| 278 | Ctrl+E press Erase. | Same — opens the confirmation dialog, never erases without it. | — | V1 |
| 279 | Ctrl+Alt+S SID block disabling dialog. | Same. | Step 07 plan. | V1 |
| 280 | Alt+M minimised dialogs list / open. | Same. | — | V1 |
| 281 | NVMe namespace = logical division of one NVMe drive; "Locate" not explained. | Same explainer; "Locate" = blink the bay LED (NexWipe's meaning; confirm in lab). | Help text. | V1 |

**§5.4.2 Hardware tests step**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 282 | Ctrl+T run marked tests. | Same. | — | V1 |
| 283 | Ctrl+A select/deselect all tests. | Same. | — | V1 |

**§5.4.3 Custom fields step**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 284 | Ctrl+D update report. | Same. | — | V1 |
| 285 | Alt+M minimise custom fields editor. | Same. | — | V1 |

**§5.4.4 Report step**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 286 | Ctrl+S save report. | Same. | — | V1 |
| 287 | Ctrl+N send report. | Same. | — | V1 |
| 288 | Ctrl+M Standard / Advanced views. | Same. | — | V1 |

**§5.4.5 Software updates (p.72)**

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 289 | Ctrl+U: check / download-and-install / retry, depending on icon text. | Same three behaviours. | — | Later |

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 290 | Ctrl+Alt+K lock/unlock settings (§4.7.9). | Same. | — | V1 |
| 291 | Ctrl+M, Ctrl+N, Ctrl+A mean different things per step. | Same; shortcuts are registered per active step. | — | V1 |

---

## Chapter 6 — Screensaver (p.73–78)

### §6.1 Presentation (p.73–74)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 292 | Erasure progress bar. | Same. | Full-screen overlay in the laptop-screen app. | V1 |
| 293 | Overall percentage. | Same. | — | V1 |
| 294 | Overall time left. | Same. | Engine estimate. | V1 |
| 295 | Green icon = successful; red icon = failed/cancelled. | Same; "successful" only when the result is truly "Erased" (verified). | — | V1 |
| 296 | On/off via CT and Settings; timeout in Settings (5–86,400 s). | Same. | — | V1 |
| 297 | State: ongoing erasures. | Same. | — | V1 |
| 298 | State: all finished successfully. | Same. | — | V1 |
| 299 | State: at least one failed or cancelled. | Same. | — | V1 |
| 300 | State: paused. | Same. | — | V1 |

### §6.2 Exception notifications (p.75)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 301 | Success with at least one exception (e.g. "DCO area removal failed") → icon shifts green/yellow; on/off only via CT. | Same, switch only on the Prepare stick page. | CSS animation. | V1 |
| 302 | Not notified: the informative "Device is SSD, see manual" message always shown for successful SSD erasure. | Same exclusion for NexWipe's own SSD note. | — | V1 |

### §6.3 Temperature warning (p.76)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 303 | NVMe or SATA drive high temperature → "!" on yellow. | Same. | `smartctl -A` / `nvme smart-log` / `drivetemp` hwmon. | V1 |

### §6.4 Remote erasure (p.76–77)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 304 | When controlled remotely by BMP (activated in CT): "REMOTE ERASURE — This computer is being remotely erased. Please do not shutdown…". | Same screen (own wording) when the web app controls the laptop (step 06 plan). | — | V1 |
| 305 | Progress display includes the remote-erasure message once erasure starts. | Same. | — | V1 |
| 306 | Differences: text above the percentage; BMP identifier number top-right. | Same; top-right shows the laptop's NexWipe number from the web app. | — | V1 |
| 307 | Success: success symbol + message. | Same. | — | V1 |
| 308 | Failure: "!" + message. | Same. | — | V1 |

### §6.5 Screensaver lock (p.78)

| # | Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|---|
| 309 | Forces screensaver on at erasure start, cannot be exited, mouse and keyboard off; enabled in CT; Automatic process only. | Same. | App swallows all input; compositor blocks VT switching (confirm in lab). | V1 |
| 310 | Releases if the standard isn't supported. | Same. | — | V1 |
| 311 | Releases if licences can't be consumed. | Same (credits). | — | V1 |
| 312 | Releases if the erasure failed. | Same. | — | V1 |
| 313 | Releases if mandatory custom fields are empty. | Same. | — | V1 |
| 314 | Releases on network / BMP problem. | Same (web app). | — | V1 |
| 315 | Releases if success + sent but manual shutdown is needed. | Same. | — | V1 |

---

## How we test (all of this step)

- Automated browser tests of the laptop-screen app against a fake engine: every numbered row above that is `V1` has at least one test (layout, settings limits, icon states, each shortcut, each screensaver state).
- Lab laptops (Windows machines from several makers): keyboard-only run, touchpad, touchscreen; battery colours at real charge levels; network looping with two adapters; 802.1X on a test switch. Destructive steps only on disposable lab drives.

## Done when

A technician can do a Manual, Semi-automatic and Automatic run on a lab laptop using only the keyboard, every `V1` row is checked off, and every `Later` row is either hidden on screen or shown as "Planned".
