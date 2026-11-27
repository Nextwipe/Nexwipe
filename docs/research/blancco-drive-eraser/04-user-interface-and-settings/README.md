# Step 4 — The user interface and settings

Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), pages 15–29 and 56–78. Section and page numbers are cited throughout as "§x.y, p.N". "BDE" = Blancco Drive Eraser; "CT" / "DECT" = Blancco Drive Eraser Configuration Tool; "BMP" = Blancco Management Portal.

## In short

- The BDE screen has three parts: a **header** (product name, version, and function buttons such as Settings, Report issue, Help, Shutdown), a **process area** (the four numbered steps: Erasure, Hardware tests, Custom fields, Report) and a **work area** (where the detail and most interaction happens). You can switch between steps while erasures run.
- The **Settings** window has tabs for General (language, keyboard, screensaver, licence container, sound, accessibility), Communication (BMP and network share), Operation (simultaneous-erasure limit, speed threshold, process timeout, disk spin-down), Networking (wired/DNS/VLAN/MTU/Wi-Fi), Network Security (proxy, Blancco Support SSH, 802.1X) and NVMe-oF. Many settings can also be pre-set or locked in the Configuration Tool.
- The bottom-left **notification icons** show time, battery, a mini asset report, network, remote control, network share, BMP connection, licences, lock state, software update, DHCP server and NVMe-oF status.
- BDE can be run **entirely from the keyboard**; there is a shortcut for almost every action (full tables below).
- The **screensaver** shows overall erasure progress and result, flags exceptions and high drive temperature, has a special "remote erasure" mode, and can be **locked** so no one can interfere with an automatic erasure.

### Jargon used on this page

| Term | One-line meaning |
|---|---|
| BMP (Blancco Management Portal) | Blancco's central server (cloud or "On-Premise", i.e. self-hosted) that stores erasure reports, hands out licences and can control erasers remotely. The manual's footnote: "a centralized data management reporting solution to store and manage data erasure reports" (p.61). |
| CT / DECT (Configuration Tool) | Blancco software used to configure the Drive Eraser ISO image "to best fit the user's needs" (footnote, p.19). Settings baked into the image here become defaults on every machine booted from it. |
| ISO image | The bootable disk image of BDE that you put on USB/PXE/CD. |
| HASP | A physical USB licence dongle ("local HASP dongle") that holds erasure/asset licences offline. |
| Licence container | Where BDE takes licences from: the HASP dongle or BMP. |
| DHCP | The network service that hands out IP addresses automatically. |
| DNS | The service that turns host names into IP addresses. |
| IPv4 / IPv6 | The older and newer formats of network (IP) addresses. |
| Subnet mask / prefix | Defines which addresses are on the local network (e.g. 255.255.255.0, or "/64" in IPv6). |
| Gateway | The router address used to reach other networks. |
| VLAN | Virtual LAN — a logical network separated by an ID number on shared cabling. |
| MTU | Maximum Transmission Unit — largest network packet size accepted. |
| NIC | Network Interface Controller — a network card/port. |
| WLAN / SSID / WPA | Wi-Fi; the Wi-Fi network name; Wi-Fi encryption schemes. |
| WPA-PSK / WPA-EAP | Wi-Fi with a shared password vs Wi-Fi with per-user enterprise login. |
| IEEE 802.1X | Network-port/Wi-Fi login standard used in enterprise networks; the device must authenticate before getting network access. |
| PEAP / EAP-MSCHAPv2 | A common 802.1X login method using username + password inside an encrypted tunnel. |
| CA certificate | Certificate Authority certificate — used to check the server you connect to is genuine. |
| PEM / PKCS12 | Two common file formats for certificates and keys. |
| TLS | The encryption used by HTTPS. |
| Proxy | An intermediate server through which web traffic must go. |
| SSH | Secure remote command-line access to a machine. |
| VNC | A remote-desktop protocol (screen sharing). |
| NVMe-oF | NVMe over Fabrics — accessing NVMe storage over a network (TCP or RDMA) rather than a local slot, used by storage arrays. |
| RDMA / RoCEv2 | Remote Direct Memory Access; RoCEv2 is RDMA over ordinary Ethernet/IP. |
| HPE Alletra | A Hewlett Packard Enterprise storage-array product line, named in the manual as an example storage system. |
| PXE | Network booting (starting a machine from a server over the network). Not described in these pages, listed for context. |
| UTC offset | Difference between local time and universal time (e.g. +02:00). |
| BIOS / UEFI | The machine's built-in firmware; it has its own clock. |
| PSID | Physical Security ID printed on self-encrypting drives, used to factory-reset them. |
| SID block | A drive security feature that can prevent certain security commands; BDE has a dialog to disable it. |
| DCO | Device Configuration Overlay — a hidden-capacity feature on ATA drives that BDE tries to remove. |
| Hex viewer | A tool that shows raw bytes of a drive in hexadecimal. |
| FLR | Listed as a boot option ("FLR during startup"); the acronym is not expanded in these pages (see the manual's Booting Options chapter). |
| Hangul / Hiragana / Katakana / Kanji / Hanja | Korean and Japanese writing systems, relevant to the input-method shortcuts. |
| AZERTY | French-style keyboard layout where number keys need Shift. |

---

## Context from page 15 (end of chapter 1)

Page 15 is the end of the introductory chapter, not the UI. Its relevant content:

- **Warning (carried over from p.14):** a certain operation can "permanently damage the drive(s)"; this "also applies to any erasure with the 'Erase remapped sectors' option checked" (p.15; the start of the sentence is on p.14, outside this scope).
- **Note:** in general avoid shutting down the computer, exiting the program, or disconnecting any drive while it is being erased with any standard, because all erasure information is lost and the drive may be damaged (p.15).
- **§1.1 Legal Notice (p.15):** Blancco is not responsible for interference/compatibility problems caused by changes or updates to the operating systems and/or hardware BDE runs on, nor for problems caused by viruses, Trojan horses, worms, malware or spyware; keeping a virus-free environment is solely the customer's responsibility. The licence is non-transferable and personal to the licensee; it cannot be assigned or transferred (including by merger, reorganisation, sale of assets, change of control or operation of law) without Blancco's written consent.
- **§1.2 Copyright and Confidentiality (p.15):** no part of the manual may be reproduced except documentation kept by the purchaser; information may change without notice; © 2026 Blancco Oy Ltd; the document is confidential to its recipients and Blancco gives no warranty about its accuracy or completeness.

---

## Chapter 2 — The BDE user interface (p.16–18)

### Boot splash screen (§2, p.16)

When the software boots, a first splash screen lets you choose a boot option:

- Normal startup (safe resolution)
- Normal startup (native resolution)
- Installer
- FLR during startup — **default selection**
- Show startup messages
- Customized startup

Details are in the manual's "Booting Options" chapter (outside this scope).

**Memory test:** if enabled, the RAM is tested during this phase and a message about the ongoing memory test is shown ("works mostly on BIOS machines"). On machines with a lot of RAM this test can take a long time (p.16).

After the loading screen, the **main view** appears, divided into three areas: header area (1), process area (2) and work area (3) (screenshot in manual).

**Display scaling:** adjustable for readability via the *Scaling* setting in the General tab of the CT. Default 100%, up to 200% (p.16).

### §2.1 Header area (p.17)

Shows software name and version, plus **function buttons** for general tasks: changing UI language, keyboard layout, screensaver settings, communication settings, reporting an issue, help menu, and shutting down the machine.

### §2.2 Process area (p.17)

Holds the numbered steps:

| Step | Purpose | Notes |
|---|---|---|
| 1. Erasure | Detect drives, choose what to erase and how, start the erasure | |
| 2. Hardware tests | Test the machine's main components | Not available in all modes; can be turned off |
| 3. Custom fields | Fill in / update the erasure report | Can be turned off |
| 4. Report | View the report, send and/or save (back up) it | |

§2.2.1 Basic process (p.17): the steps "can be followed in order, but not necessarily".

### §2.2.2 Multitasking (p.18)

You can move freely between tabs during an active erasure. Manual's example: a machine with 3 drives — start erasing drive 1, then update the report (Custom fields), run hardware tests, or even send/save an *incomplete* report, all while drive 1 is erasing. Drives 2 and 3 can be started at the same time or individually.

### §2.3 Work area (p.18)

Shows the details for each step: available drives and erasure standards (Erasure), extra report fields (Custom fields), asset and erasure information (Report). Most user interaction happens here. If an erasure raises a warning, a **"yellow" informative message** is written into the report.

### §2.4 Popup for special drives (p.18)

If at least one extra **removable flash-based drive** is detected, a popup says: *"Device Detected — Blancco Drive Eraser has detected removable flash drive(s). Please consider removing or erasing them."*

### §2.5 Storage controller mode switching (p.18)

If BDE finds a storage controller that has several modes and whose mode can be changed, a popup asks permission to reconfigure it. Purpose: give BDE more control over the drive, which can improve erasure performance.

| Item | Value |
|---|---|
| Buttons | "Yes, proceed" (reconfigure) / "No, skip" (skip) |
| Default highlighted | "No, skip" (configurable via CT) |
| Popup time limit | 30 seconds by default (configurable via CT) |

**Warning:** during reconfiguration **all virtual volumes are deleted and the system restarts. This can result in permanent data loss.** (Virtual volumes = RAID-style logical drives built by the controller.)

### §2.6 Other popups (p.18)

If the CA certificate on BMP fails validation: *"Blancco Drive Eraser Warning — Certificate validation failed."*

---

## Chapter 3 — Header area (p.19–29)

### §3.1 Product name, version and licence control (p.19)

Top-left under the logo: product edition name — **Volume Edition**, **Enterprise Subscription Edition** or **Enterprise Volume Edition** — and software version.

### §3.2 Image usage label (p.19)

Under the version number there is a free-text label describing what this particular BDE image is for, so operators can tell apart several images with different settings. Examples: "For laptops with SSDs", "For servers, HMG1x". Configured with the CT.

### §3.3 Settings function button (p.19)

The "Settings" button opens the Settings window, which has several tabs.

#### §3.3.1 General tab (p.19–20)

| Group | Setting | Example / default shown | What it does |
|---|---|---|---|
| User Interface | Language | English – en | Language of the software. |
| User Interface | Keyboard Layout | English (United States) – us | Keyboard layout used by the system. |
| User Interface | Enable input method switching | On or off | Enables switching input method for Japanese or Korean; switch with **Shift+Space**. See chapter 5 for other keys. |
| Screensaver | Enable screensaver | On or off | Turn screensaver on/off. |
| Screensaver | Timeout (sec.) | 30 | Seconds of inactivity before screensaver starts. **Range: 5 s to 86,400 s (1 day).** |
| Licence options | License container | Local HASP | Switch the licence source between **HASP** and **BMP**. |
| Sound | Volume | 70 | Volume of sound notifications. |
| Accessibility | Screen reader enabled* | On or off | Spoken feedback about what happens in the UI. **Requires a separate ISO with the feature enabled.** |
| Accessibility | Speaking rate | 80 | Speaking speed (slider). |
| Accessibility | Key echo enabled | On or off | Reader says each button press out loud. |

\* To get the screen reader, contact Blancco for an image file with it enabled (p.20).

#### §3.3.2 Communication tab (p.20–21)

Covers BMP connectivity and the network share connection. Wireless settings can also be changed in the CT.

**Communication settings**

| Setting | Example | Details |
|---|---|---|
| Blancco Account | "Blancco Management Portal" or "Management Portal On-Premise" | Which Blancco product to talk to. With (cloud) BMP no hostname or port is needed. |
| Hostname/IP | 10.1.1.1 | Address of the server running BMP. IPv4 and IPv6 supported. |
| Port | 8443 | Port of BMP On-Premise, set when BMP was installed; **8443 by default; HTTPS always enforced.** See BMP manual. |
| Username | ExampleBMPUser | BMP On-Premise user. Username/password can be shown temporarily via the eye symbol. **3–64 characters.** |
| Password | VeryStrongPassword | BMP On-Premise password. **6–64 characters.** |
| Do Not Validate The Remote Certificate | On or Off | Hostname certificate validation is **enforced by default**; ticking this disables it for hostnames. **Certificate validation is disabled by design on IP addresses.** |

Practical meaning of the last row: if you connect by IP address rather than hostname, BDE never checks the server certificate, whatever this box says.

**Network share connection** (a shared folder on a file server where reports are saved)

| Setting | Example | Details |
|---|---|---|
| Hostname/IP | 10.1.1.1 | The manual's text says "IP-address of the server running the BMP On-Premise" (likely a copy-paste; in context it is the share's server). |
| Path | Root/folder | Folder where reports are saved. |
| Username | ExampleUser | Share user; eye symbol shows username/password temporarily. |
| Password | VeryStrongPassword | Share password. |
| Domain | example.testing.com | Optional domain. |

Note: VNC remote-control settings are documented in the CT manual (p.21).

#### §3.3.3 Operation tab (p.22–23)

| Group | Setting | Example | Details |
|---|---|---|---|
| Erasure | Simultaneous Erasures Limit | 50 | Max erasures running at once. Below the limit, new erasures can start; above it, the excess and new erasures go into an **erasure queue** and are paused until a slot frees. The maximum supported can differ between client editions. |
| Erasure | Enable Speed Threshold | On or off — **off by default** | Fail the erasure if speed drops below "Speed Threshold". |
| Erasure | Speed Threshold (MB/s) | 0 | Range **1–10,000 MB/s**. |
| Erasure | Process timeout enabled | On or off | Cancel erasure or verification processes that run longer than a set time (time configured in CT). **Allowed range 1–8,760 hours** (1 year). **Warning: may brick drives if the process is ended during a firmware-based erasure command.** |
| Power saving | Spin Down Idle Disks | On or off | Spins down magnetic disks (HDDs) idle for **5 minutes**. Also limits starts to **max one erasure per second** to avoid power peaks. For HDDs erased in batches this can cut the power surge by **40%** (queued or finished HDDs stop drawing power), and saves energy after all drives are done but before they're removed. |

("Firmware-based erasure" = an erase command executed inside the drive itself, e.g. Secure Erase; cutting it off midway can leave the drive unusable.)

#### §3.3.4 Networking tab (p.23–24)

Wired network, DNS, VLAN, MTU and WLAN settings. Wireless settings (encryption type, SSID) can be changed in both BDE and CT.

- IPv4 and IPv6 both supported; **if both are active, IPv4 is prioritised.**
- Encryption type "WPA-PSK" covers WPA-PSK, WPA2-PSK and WPA3-SAE (WPA3-PSK). WPA-EAP and WPA2-EAP are also supported.
- **Note: IPv6 currently does not support Chromebooks or NVMe-oF features.**

**Wired network settings (p.24)**

| Setting | Example | Details |
|---|---|---|
| Interface | Dropdown | Which network device to configure. |
| Enabled | On or Off | If off, the settings below are inaccessible. |
| Use DHCP | On or Off | If on, IP address/Subnet mask/Gateway are greyed out. **DHCP is required when erasing storage systems such as HPE Alletra.** |
| IP address | 10.0.2.15 | IPv4 or IPv6. |
| Subnet mask / Prefix | 255.255.255.0 / 64 | Mask, or prefix length (e.g. 64) for IPv6. |
| Gateway | 10.0.2.2 | Gateway address. |

**MTU settings (for NVMe-oF)**

| Setting | Example | Details |
|---|---|---|
| Maximum Transmission Unit (MTU) | 9000 | Largest packet the device accepts; larger gives better efficiency. For systems like Alletra this would be 9000 ("jumbo frames"). |

**DNS settings**

| Setting | Example |
|---|---|
| Primary IP | 8.8.8.8 |
| Secondary IP | 4.4.4.4 |

**VLAN settings**

| Setting | Example | Details |
|---|---|---|
| VLAN ID | 1234 | Range **1–4094**. |

**Static settings from CT:** static network settings pre-configured in the CT are applied by default to the first adapter that accepts them ("First suitable interface" option). If "Loop until succeeds" is chosen in the CT, adapters are cycled until a connection to BMP succeeds (p.24).

#### §3.3.5 Network Security tab (p.24–26)

**Proxy settings**

| Setting | Example | Details |
|---|---|---|
| Protocol | HTTP | HTTP or HTTPS. |
| Hostname/IP | 10.1.1.2 | Proxy server. |
| Port | 8080 | Proxy port. |
| Username | ExampleProxyUser | |
| Password | VeryStrongPassword | |
| Do not validate the proxy certificate | disabled | When checked, skips TLS verification of the proxy's certificate. |

**Remote SSH connections**

| Setting | Example | Details |
|---|---|---|
| Allow remote connection from Blancco Support | On or off | If on, remote SSH connections are allowed; if off, none can be made to the Drive Eraser. |

**IEEE 802.1X authentication**

| Setting | Example | Details |
|---|---|---|
| Enabled | On or off | Enables 802.1X support, allowing network connection over network adapters and "WP2 [WPA2] enterprise Wi-Fi". |
| Use CA Certificate | On or off | Whether to use a CA certificate; it can be included via the CT. |
| Protocol | PEAPv0/EAP-MSCHAPv2 | 802.1X method. |
| Identity | network identity | Login identity. |
| Password | VeryStrongPassword | Password for the identity. |

Notes (p.26):

- If CA certificate is enabled, adding one is **mandatory**. Only a valid **PEM (with certificate and private key) or PKCS12** can be loaded; **max size 10,000 bytes**.
- Sensitive values (username, password, etc.) show as **"encrypted data"** when you reopen the settings.
- If 802.1X has problems, it is **disabled after one round of attempts on every NIC**; you must re-enable it manually in settings. This auto-disable only happens if **"Fallback if inaccessible"** is enabled in DECT.

#### §3.3.6 NVMe-oF settings tab (p.26)

Add and adjust NVMe-oF connections. **The tab is only visible if enabled in the CT (under Process).**

| Setting | Example | Details |
|---|---|---|
| Manage NVMe-oF connections | N/A | "Add new" / "Delete" buttons. |
| Connection (number) | Connection 1 | Dropdown of added connections. |
| Protocol | TCP | **TCP** or **RDMA (RoCEv2)**. |
| Target IP | 10.10.10.5 | Target address. |
| Target port | 4420 | Target port. |

### §3.4 Report Issue function button (p.27–28)

Generates a detailed **issue report** with extra system information and logs so Blancco can understand and reproduce a problem. These reports **must be attached and emailed to Blancco Support**.

The window has two parts: a **"Describe the issue"** field (**mandatory**) and settings for saving to external media.

To save to a USB stick: plug the stick in **first**, then press "Report issue".

- **Select media** — choose the USB stick.
- **File name** — default format `Date(yyyymmdd)time(hh24miss)_report`, e.g. `20210527_092742_report` = 27 May 2021, 9:27:42 AM. Can be changed before saving.
- **Format** — only **XML**; the extension is added automatically.
- **Screenshot settings** — "Max screenshots per issue report" slider limits how many screenshots are included; buttons below remove or export screenshots.
- **Save** — writes the issue report to the USB stick.

Other buttons:

- **Send** — sends the issue report to BMP. Needs a network connection, a server running BMP, and correct BMP settings in the Settings window (see "Send-button" section).
- **Cancel** — abandon and close.

USB stick requirements:

- Pre-formatted by the user to **FAT32** ("most suitable format").
- **Single partition.**
- **Name not empty**; preferably only a–z, A–Z, 0–9.
- In good condition; if in doubt, reformat or replace.

The issue report can also be fetched via BMP (p.28).

### §3.5 Help function button (p.28)

Opens the quick-help window with general information (**in English**). A search bar finds specific information; the menu icon top-right shows the Table of Contents for navigating chapters.

### §3.6 Shutdown function button (p.29)

Used to shut down or restart after a successful erasure.

1. If the report hasn't been saved or sent, or there are unsaved report changes, a warning popup appears: "Yes" continues to the shutdown dialog, "No" returns to the main menu.
2. A confirmation popup then offers **"Shutdown"** (power off) or **"Restart"**.

---

## Context from page 56 (end of §4.5 / §4.6)

- **§4.5.2.3 Send button (p.56):** sends the report to BMP (shortcut **Ctrl+N**). **Only one report per BDE session is kept in BMP** — the latest one always replaces information from earlier sends. If sending fails, an error popup appears; if BMP settings are missing, the popup names **one missing parameter at a time** with details. If BMP credentials are incorrect/missing, a popup asks for them.
- **§4.6 Restart/Shutdown step (p.56–57):** only present if in the CT "Process" is set to "Automatic" and "Shutdown" or "Restart" is selected. When the process finishes, the machine restarts/shuts down automatically when the timer runs out, or immediately via "Restart now" / "Shutdown now".

---

## §4.7 Notification icons (p.57–65)

Located in the **lower-left corner** (the "system tray"). Hover for a tooltip (or **Ctrl+Space** from the keyboard, see §5.1.4).

### §4.7.1 Local time and current date (p.57)

- 24-hour time with **UTC offset** next to it; date as **Year-Month-Day**.
- UTC offset can only be changed via CT (General settings).
- **Time source priority: BMP → HASP → BIOS.** Once time is taken from a higher-priority source it is never switched to a lower one, unless the machine restarts and the higher source is no longer available.
- BDE can sync time with BMP and **automatically update the device's BIOS time** when connected to BMP. Time zone is set in CT.

Why it matters: the timestamp on an erasure report comes from this clock, so a BMP connection gives the most trustworthy time.

### §4.7.2 Battery charge (p.57–58)

Hidden if no battery. Two main states: **Charging** and **Discharging** (icons in manual). Colour bar inside the icon plus a percentage:

| Colour | Level |
|---|---|
| Green | ≥ 50% |
| Orange | < 50% |
| Red | < 25% |

- A **socket icon** appears top-right of the battery icon when a charger is connected.
- Tooltip shows charging status per battery.
- Charging status updates every **5 s**; battery level every **60 s**.
- Status values: **Discharging, Charging, Full, Unknown.**

### §4.7.3 Small asset report (p.58–59)

Tooltip shows machine model, CPU model and frequency, RAM amount and type. Full details are in the generated report (Report step).

### §4.7.4 Network (p.59–60)

Two states: everything OK / problem with network connection (icons in manual). Tooltip lists network interfaces and their status (screenshot in manual). **If the network has a problem, BMP cannot be reached either.**

At the top of the tooltip, the **network looping status** for detected NICs is shown — only when all of these hold:

- The image has a static IP enabled and configured via CT.
- BMP settings are set correctly.
- Network looping is on in CT ("Networking – DHCP (not enabled) – Interface selection" set to "First suitable interface" or "Loop until succeeds").

Looping statuses:

| Status | Meaning |
|---|---|
| Interface looping in progress | Network settings are being tried on each detected NIC. |
| Interface looping on hold (green text) | A suitable NIC was found; its name is shown. If a machine has 2+ NICs on different networks, it tries them in turn until a connection is established. |
| Interface looping disabled | A manual configuration was applied to a NIC (which disables looping), or looping was never turned on. |
| Interface looping disabled (green text) | Looping is off but BMP is reachable. The NIC used cannot be detected when looping isn't active. |

### §4.7.5 Remote control (p.60)

BDE supports **third-party remote-control software**. Settings can **only be changed in CT (Communication tab)**. Once configured, hover the icon to see mode, port and number of connected clients.

### §4.7.6 Network share (p.60)

Configured in Settings → Communication. **Icon hidden if nothing is configured.** After "Apply", BDE tries to connect; on failure the tooltip shows an error status.

### §4.7.7 Blancco Management Portal (p.61)

Three states (icons in manual):

| State | Meaning |
|---|---|
| Not set | No connection settings, so no BMP connection. Enter them in Settings – Management Portal Settings. |
| OK | Connected. |
| Problem | Connection to BMP has a problem. |

Tooltip shows BMP connection status (screenshot in manual).

### §4.7.8 Licences (p.61–62)

Shows the number of available licences and assets per machine. Two states: **no licences available** / **licences available**. Tooltip shows counts; if the licence container can't be reached, error messages appear (screenshot in manual).

- **Enterprise Subscription Edition** shows **subscription status** ("subscription / not available") instead of counts.
- Licence types:
  - **Erasure licences** — needed to erase drives. Consuming one erasure licence also lets you save/send reports.
  - **Asset licences** — if there are no erasure licences (or no drive was erased), needed to save or send a report with the machine's hardware information ("asset report").
- Licence control is either from a **local HASP dongle** or from **BMP over the network**. There must be enough licences to start an erasure or save/send an asset report.

### §4.7.9 Lock settings (p.62–63)

- Enabled in CT under General → Lock settings.
- **All-or-nothing:** it does not distinguish erasure settings from the Settings dialog — locks everything or nothing, **except language and keyboard layout** (which stay changeable).
- When locked, Settings shows a **red lock symbol** (screenshot in manual).
- Lock/unlock via the lock icon in the bottom system tray or **Ctrl+Alt+K**. Unlocking needs the **password set in CT**.

### §4.7.10 Software update (p.63–65)

- Only the **installed mode** of BDE can do over-the-air updates ("installed mode" is the result of the "Installer" boot option, §2 p.16; details are in the manual's installation chapter).
- Check via the bottom-of-screen icon or **Ctrl+U**.
- No updates → a message says so (screenshot in manual).
- Updates available → icon shows a **yellow blob** and a prompt; click "Yes" and BDE starts updating.
- Update check frequency is configured in DECT.

### §4.7.11 DHCP server (p.65)

- DHCP server settings appear in Networking settings **only when the image has Chromebook support enabled** (BDE then acts as the DHCP server for connected Chromebooks).
- A **static IP must be configured first**.
- When enabled, an icon appears in the work area; a **green dot** shows once at least one IP has been leased.
- A DHCP client can be selected from CT's networking settings.
- Hover shows up to the **5 latest leases**.
- **Lease time: 1 hour.** Pre-configuration through CT is not possible, but a reboot does not change the settings.

### §4.7.12 NVMe-oF (p.65)

Shows successfully created NVMe-oF connections in the work-area icon tray. Settings are in the Settings menu. **Requires DHCP** (Networking settings). Once at least one connection is established, an icon with a **green blob** appears.

(Page 66 contains only a stray footnote: "The software will wait until the step is finished.")

---

## Chapter 5 — Keyboard controls (p.67–72)

BDE can be run **with the keyboard only (no mouse).**

### §5.1 Generic controls (p.67–68)

| Key | Behaviour | Ref |
|---|---|---|
| Tab | Moves focus between work-area elements, active buttons in the lower-right, and other elements (e.g. Erasure-step search bar); in menus, between tabs and fields. Order: left→right, top→bottom, circular. | §5.1.1, p.67 |
| Shift+Tab | Same, reversed (right→left, bottom→top). | §5.1.1 |
| Esc (for popup X) | The X button at top-right of popups/dialogs **cannot be reached with Tab**; use Esc to close. | §5.1.1 |
| Alt+Tab, Alt+S, etc. | During the **keyboard hardware test**, shortcuts are used together with Alt. | §5.1.1 |
| Arrow keys | In scrollable areas (Report step, Hex viewer, Help, EULA): scroll up/down/left/right. In drop-downs (erasure standards, languages, keyboard layouts): scroll the list. On a slider handle (verification slider): move it. In a scrollable container of elements: move between elements, e.g. between drives and hardware tests. | §5.1.2, p.67 |
| Space | Check-box: toggle. Button: press. Link: open. Drop-down: expand and select items. | §5.1.3, p.67–68 |
| Ctrl+Space | Show tooltips of the bottom-left notification icons. | §5.1.4, p.68 |
| Ctrl+Shift+Space | Go to the previous information tip. | §5.1.4 |
| Ctrl+Enter | Apply changes and close the window in Settings and Erasure settings. | §5.1.5, p.68 |
| Shift+Space | Toggle Japanese/Korean input: Hangul for Korean, Hiragana for Japanese. For Kanji press Space (multiple times for more options). | §5.1.6, p.68 |
| Alt+Shift | Rotate between language input methods. | §5.1.6.1, p.68 |
| Esc | Expanded drop-down: collapse. Open popup/dialog: close **without saving** (= Cancel/Close/x). During a hardware test: exit the test. | §5.1.7, p.68 |

### §5.2 Header area keys (p.68–69)

Header buttons are reached **only** with function keys.

| Key | Action | Ref |
|---|---|---|
| F1 | Help button (Help window) | §5.2.1 |
| F2 | Settings button | §5.2.1 |
| F3 | Report issue button | §5.2.1 |
| F6 (Japanese) | Convert to Hiragana | §5.2.2 |
| F7 (Japanese) | Convert to Katakana | §5.2.2 |
| F8 (Japanese) | Convert to half-width kana | §5.2.2 |
| F9 (Japanese) | Convert to Wide Latin | §5.2.2 |
| F9 (Korean) | Toggle Hanja | §5.2.2 |
| Alt+Shift | Rotate input methods (Japanese and Korean) | §5.2.2 |
| F10 | Shutdown button (same unsaved-report warning as §3.6: "Yes" continues, "No" returns) | §5.2.3, p.69 |

F1–F3 may differ between software versions; the rule is always: the **first button left of Shutdown is F1, the next one left is F2**, and so on (§5.2.1, p.68).

### §5.3 Process area keys (p.69)

Use **Ctrl+number** or **Ctrl+Shift+number** (the latter preferred, especially on AZERTY keyboards).

| Key | Action |
|---|---|
| Ctrl+1 | First defined and visible step |
| Ctrl+2 | Second defined and visible step |
| Ctrl+3 | Third defined and visible step |
| Ctrl+4 | Fourth defined and visible step |

The mapping depends on configuration (steps can be hidden); the n-th visible step is always Ctrl+n.

### §5.4 Work area keys (p.69–72)

**§5.4.1 Erasure step** (drives, options and Erase button also reachable with Tab/arrows)

| Key | Action | Ref |
|---|---|---|
| Ctrl+R | Refresh drives — available when "Report per Connected Device" and "Hotplug" options are enabled | §5.4.1.1, p.69 |
| Ctrl+P | Take a screenshot | §5.4.1.2 |
| Ctrl+J | Open "Enter PSID" dialog | §5.4.1.3 |
| Ctrl+M | Toggle "Show Empty Slots" | §5.4.1.4, p.70 |
| Ctrl+N | Show NVMe namespaces belonging to a drive | §5.4.1.5 |
| Ctrl+F | Search visible drives | §5.4.1.6 |
| Ctrl+A | Select/deselect all drives for erasure | §5.4.1.7 |
| Ctrl+L | Locate the selected drive | §5.4.1.8 |
| Ctrl+Alt+L | Locate all drives | §5.4.1.9 |
| Ctrl+H | Open the Hex viewer | §5.4.1.10 |
| Ctrl+Alt+R | Show Per Drive report | §5.4.1.11 |
| Ctrl+Alt+E | Edit Per Drive custom fields | §5.4.1.12 |
| Ctrl+Alt+P | Pause erasures of selected drives | §5.4.1.13 |
| Ctrl+Alt+U | Unpause erasures of selected drives | §5.4.1.14 |
| Ctrl+Alt+C | Cancel erasures of selected drives | §5.4.1.15 |
| Ctrl+G | Open "Erasure settings" window | §5.4.1.16 |
| Ctrl+E | Press Erase (start erasure) | §5.4.1.17 |
| Ctrl+Alt+S | Trigger SID block disabling dialog | §5.4.1.18, p.71 |
| Alt+M | When there are minimised dialogs and none open: first press opens a list of minimised dialogs, second press opens the focused one; if only one exists it opens directly | §5.4.1.19, p.71 |

("NVMe namespace" = a logical partition-like division inside one NVMe drive. The manual does not explain here what "Locate" does physically.)

**§5.4.2 Hardware tests step** (checkboxes/buttons via Tab)

| Key | Action |
|---|---|
| Ctrl+T | Run the marked tests |
| Ctrl+A | Select/deselect all tests |

**§5.4.3 Custom fields step** (fields and Update button via Tab)

| Key | Action |
|---|---|
| Ctrl+D | Update the report |
| Alt+M | Minimise the custom fields editor dialog |

**§5.4.4 Report step** (Tab for elements, arrows to scroll)

| Key | Action |
|---|---|
| Ctrl+S | Save the report |
| Ctrl+N | Send the report |
| Ctrl+M | Switch between Standard and Advanced views |

**§5.4.5 Software updates (p.72)**

| Key | Action depending on icon text |
|---|---|
| Ctrl+U | "Click to check for updates." → starts checking. "Click on the icon to download and install." → starts the update. "Click on the icon to retry" → retries. |

**Other shortcut mentioned outside chapter 5:** Ctrl+Alt+K — lock/unlock settings (§4.7.9, p.63).

Note: Ctrl+M, Ctrl+N and Ctrl+A mean different things depending on the active step.

---

## Chapter 6 — Screensaver (p.73–78)

### §6.1 Presentation (p.73–74)

Shows the current erasure state on the monitor:

- Erasure progress bar
- Overall percentage of the erasure(s)
- Overall time left

Gives an overview of ongoing erasures and their result: **green icon = successful**, **red icon = failed/cancelled**. Turned on/off via CT and the Settings window; timeout (seconds) set in Settings (range 5–86,400 s, §3.3.1).

States illustrated (screenshots in manual): ongoing erasures; all finished successfully; at least one failed or cancelled; paused.

### §6.2 Exception notifications (p.75)

If erasures succeeded but at least one **exception** was reported (e.g. "DCO area removal failed"), the success icon **shifts colour between green and yellow** — meaning something in the report needs attention. Can only be turned on/off via CT.

The only exception *not* notified: the purely informative message **"Device is SSD, see manual for more information"**, always shown when an SSD is successfully erased.

### §6.3 Temperature warning (p.76)

If an **NVMe or SATA** drive detects high temperature, the screensaver shows a **"!" on a yellow background**.

### §6.4 Remote erasure (p.76–77)

When BDE is remotely controlled by BMP (remote control must be activated in CT), a screen shows: *"REMOTE ERASURE — This computer is being remotely erased. Please do not shutdown unless you are certain the process has been completed."*

- Once erasure starts, the progress display includes the remote-erasure message.
- Differences from the normal screensaver: text above the erasure percentage, and the **BMP identifier number in the top-right corner**.
- Success: success symbol plus the remote-erasure message.
- Failure: failure symbol (!) plus the remote-erasure message.

### §6.5 Screensaver lock (p.78)

When active, it **forces the screensaver on when the erasure starts** and makes it **impossible to exit**; **mouse and keyboard are turned off.** Must be enabled in CT and is **only available in the Automatic process**.

The lock releases automatically when user interaction is needed, e.g.:

- The erasure standard is not supported (erasure cannot proceed).
- Erasure licences cannot be consumed (erasure cannot proceed).
- The erasure failed (user can check, restart manually, or save/send the report).
- Mandatory custom fields are empty (report cannot be sent).
- Network problem or BMP communication problem (report cannot be sent).
- Erasure succeeded and report was sent, but the machine must be shut down manually (automatic shutdown/restart is off).
