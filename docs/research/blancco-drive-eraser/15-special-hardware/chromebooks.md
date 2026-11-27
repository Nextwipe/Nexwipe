# Chromebooks with Blancco Drive Eraser

**In short**
- BDE does not boot on the Chromebook. A separate laptop/desktop runs BDE as a station; Chromebooks join it over the network (§12.2–12.3, pp.144–145).
- On each Chromebook the operator switches it to Developer mode, opens a guest browser to the station's IP address, then runs a `curl … | bash` command as root in a text terminal to pair it with BDE (§12.4–12.5, pp.145–147).
- From BDE the operator presses "Erase". The manual calls this a factory reset, optionally runs diagnostics, and produces one report per Chromebook. Rebooting turns Developer mode off again (§12.3, p.145; §12.5, p.147).
- The manual says a successful run leaves all user data erased (factory reset), a Blancco report "proving that the erasure has taken place", and ChromeOS still usable with no re-imaging needed (§12.7, pp.148–149). It does not describe the erasure method used inside the factory reset (see "What the manual claims, and what it does not").

Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), chapter 12 (pp.144–149) and §15–15.2 (pp.180–181).

Terms used here:
- **ChromeOS**: Google's operating system on Chromebooks.
- **Powerwash**: ChromeOS's own built-in factory reset. (This manual section never uses the word "Powerwash". It says "factory reset".)
- **Factory reset**: returning the device to its out-of-the-box state by removing user accounts and data.
- **Recovery mode**: a ChromeOS firmware screen, reached with a key combination at power-on, normally used to reinstall ChromeOS. Here it is only the doorway to Developer mode.
- **Developer mode**: a ChromeOS mode that turns off OS verification (the check that only Google-signed software runs) and gives root shell access. BDE needs it to run its script on the Chromebook.
- **OS verification**: ChromeOS's boot-time check that the system software is genuine. Developer mode switches it off, and a warning screen says so at each boot.
- **Virtual terminal (VT)**: a full-screen text console reached with Ctrl+Alt+F-key combinations, separate from the graphical screen.
- **Locked / enrolled**: "enrolled" means registered to an organisation's Google management (enterprise enrolment). The manual requires Chromebooks that are neither locked nor enrolled.
- **Rooted Chromebook**: a Chromebook whose system has been modified to give unrestricted administrator access.
- **GBB flags**: firmware settings ("Google Binary Block") that can force behaviour such as staying in Developer mode.
- **Firmware write protection**: hardware (often a screw or jumper) or software protection that stops the firmware being changed.
- **CT / BDE CT**: Blancco's Configuration Tool for setting up the BDE image. **BMP**: Blancco Management Portal. **DHCP server**: the network service that hands out IP addresses.

## Supported Chromebooks (§12.1, p.144)

- Any Chromebook manufactured from **2015 onwards** is supported, ARM-based or Intel-based.
- Chromebooks manufactured before 2015 are not officially supported.
- Note: **rooted Chromebooks are currently detected as normal Chromebooks**, so BDE does not flag them.

## Minimum requirements (§12.2, p.144)

- The latest CT binary to configure the Chromebook settings.
- The latest BDE image, which provides the latest Chromebook support.
- A normal Chromebook (made from 2015 onwards, **neither locked nor enrolled**).
- A network (preferably with internet, for possible Chromebook updates), including a **DHCP server** for IP addresses and a **network switch** to connect several Chromebooks at once.
- A laptop or desktop running the BDE image (preferably **without any internal drive**).
- A BMP or Blancco Cloud account for licences and reports.
- Blancco Drive Eraser licences (erasure).
- Optional: USB-to-Ethernet adapters to connect the Chromebooks to the network.

How the work is split (p.144):
- Processing happens partly on the BDE side and partly on the Chromebook. The operator prepares the Chromebook and connects it to BDE.
- Processing one machine takes **approximately 10 minutes**.
- The Chromebook must be on the network. An Ethernet cable is easiest, but wireless can also be considered.

## Prepare Blancco Drive Eraser (§12.3, pp.144–145)

Configure the image before booting BDE on its dedicated laptop/desktop. Once booted, BDE can be left running as an erasure station.

Configure the BDE image with BDE CT:
1. Turn on **"Report per connected devices"** mode.
2. Configure both the HTTP and the HTTPS port:
   - **HTTP**: turn on **"Chromebook support"**. Note the port used to connect to Chromebooks (**CB_Port**). In the Configuration Tool it is under **Process > Connected Devices > Chromebook Support > HTTP Port** (default **80**).
   - **HTTPS**: this port must be configured too.
3. Turn on the Chromebook diagnostics or hardware tests you want to run, and set up the BMP connection.
4. Boot the configured BDE on the laptop.
5. Connect the laptop to the network and note the BDE IP address (**BDE_IP_address**), shown in the **bottom-left corner** of the screen (p.145).

What the BDE screen then does (p.145):
1. A new drop-down list filters the view to connected drives only, connected Chromebooks only, or both.
2. Any Chromebook connected to BDE appears automatically on a **grey background**. Select it and press **"Erase"**:
   - The background turns **white**, the Chromebook serial numbers are shown, and the **progress of the factory reset** is displayed (status **Successful** or **Failed**).
   - Any custom field defined on the BDE image can be used on a processed Chromebook, e.g. to fill in its Asset ID.
   - Each processed Chromebook produces an **individual report**, which can be reviewed, saved to a USB stick or sent to the Blancco Management Portal.
3. Once a Chromebook is processed, select it and press the **"X"** button (bottom right) to remove it from the interface. **This also shuts down the Chromebook.**

## Preparing a Chromebook (§12.4, p.145)

- Before processing, the Chromebook **must be switched to Developer mode**.
- To save time you can do this ahead of time: switch it to Developer mode, shut it down, then boot it again just before processing.
- Official instructions: https://chromium.googlesource.com/chromiumos/docs/+/master/developer_mode.md
- Note: the switch to Developer mode usually takes a few minutes. Just wait.

### Enable Recovery and Developer mode, regular Chromebooks (laptops) (§12.4.1.1, pp.145–146)

1. Press **Esc + Refresh + Power** to enter Recovery mode (Refresh is usually **F3** on a standard laptop). This leads to a screen where Developer mode can be enabled.
2. When asked to insert recovery media, press **Ctrl + D**.
3. Press **Enter** when prompted.
4. When the device reboots, a message says **OS verification is off** (p.146).
5. Press **Ctrl + D** to continue booting, or wait and it boots by itself.

Note: some Chromebooks need a different combination, for example **Esc + Maximize + Power** (p.146).

### Enable Recovery and Developer mode, keyboardless Chromebooks (tablets) (§12.4.1.2, p.146)

An **external keyboard is required** to open and use the terminal.
1. Press and hold **Power + Volume-Up + Volume-Down for 10 seconds** to enter Recovery mode.
2. Move through the menus with **Volume-Up / Volume-Down** and select items with **Power**.
3. Press **Volume-Up + Volume-Down together** to enter Developer mode, then confirm.

## Process a Chromebook (§12.5, pp.146–147)

Most of the work is on the [Chromebook]. Some is on the [BDE] station.

1. [Chromebook] In Developer mode you see a Chromebook Welcome Screen. Click **"Get Started"**.
2. [Chromebook] The next screen shows whether you are on the network. Connect if not, then click **"Next"**.
   a. To use wireless, configure it here.
3. [Chromebook] If there is internet, accept the **Google terms of service**. Otherwise go to step 5.
4. [Chromebook] If there is internet, the Chromebook tries to download the latest updates. Wait until they finish.
5. [Chromebook] Click **"Browse as Guest"** to open a browser.
6. In the address bar enter the **BDE_IP_address** (e.g. `192.168.50.110`).
   a. If CB_port is **not 80**, add it (e.g. `192.168.50.110:81`).
7. [Chromebook] A Blancco Welcome Screen appears, "Welcome to Blancco Chromebook Diagnostics" (screenshot in manual). Follow its instructions (p.147):
   i. Switch to a virtual terminal with **Ctrl+Alt+F2**, **Ctrl+Alt+Right Arrow** or **Ctrl+Alt+Refresh**.
   ii. Log in as **`root`** at `localhost login:`.
   iii. Type `curl 192.168.56.102/s/519 | bash` and press Enter. (The manual's example IP here differs from the step 6 example. Presumably the welcome screen shows the exact command for your station. The manual does not say so explicitly.)
   iv. Return to the web view with **Ctrl+Alt+F1** or **Ctrl+Alt+Left Arrow**.

   The screen should now say **"Connection established"**, meaning BDE and the Chromebook are paired and can communicate.
   - The Chromebook shows its ID in the top right (e.g. **CB-3**).
   - The Chromebook should also appear in the BDE interface.
8. [BDE] Select the Chromebook and **erase** it. The same ID (e.g. CB-3) is shown in BDE. This enables the diagnostics in the Chromebook browser. If no Chromebook diagnostics were configured in BDE CT, skip to step 10.
9. [Chromebook] The diagnostics can now be run from the browser (see Hardware tests below).
10. [Chromebook] When the diagnostics are done, review them, then press **"Upload to Blancco Drive Eraser"** to upload the report to BDE.
11. [BDE] Review the report, fill in any custom field, then send the report to BMP.
    a. The Chromebook's box in BDE shows icons for the status of the diagnostics, the custom-field update and the report sending.
12. [Chromebook or BDE] The Chromebook is now processed and **must be rebooted**. **Developer mode is turned off during the reboot.** Use **"Reboot now"** on the Chromebook, or the **"X" / "Dismiss"** button in BDE.

## Chromebook hardware tests (§12.6, pp.147–148)

If configured, Chromebooks can run hardware tests on memory, CPU, battery capacity and battery discharge (p.147). The full list of tests you can choose is in the table below.

A test icon (screenshot in manual) shows the test state. Its colour shows the current state, and hovering the mouse over it shows a text hint.

| Colour | Hint | Meaning |
|---|---|---|
| Gray | Hardware tests not executed | Tests have not been started, are not running and have not finished. |
| Yellow | Hardware tests running | Tests are running. The icon **blinks** in this state. |
| Red | One or more hardware tests failed | At least one test failed. |
| Green | Hardware tests successful | All tests passed. |

Tests available when erasing Chromebooks (p.148):

| Test | What it does |
|---|---|
| Battery Capacity | Checks charge capacity and charge cycles of all batteries. It compares current charge capacity with the manufacturer's stated maximum. Default threshold **60%**: below fails. Adjustable in CT. |
| Battery Discharge | Tests the battery discharge rate. The **power cord must be unplugged**. Charge should be **50% or more** to run it (the initial charge is configurable), to reduce the risk of the machine hanging. **Cannot start below 20% charge.** Thresholds are in percentage points (p.p.), the difference between two percentages. Example: with a 25 p.p. pass threshold, a test starting at 80% fails if charge drops below 80% − 25 p.p. = 55%. |
| CPU Basic | Checks the processor by testing its calculation capabilities. Result is Successful or Failed. |
| Display | Tests colour reproduction and display condition. The colours are chosen so defective pixels are easy to spot (displays use the RGB colour model). |
| Keyboard | Pressed keys appear in a text area. Some keys are not captured (e.g. function keys). A pressed key turns **green** (working), **yellow** (might be stuck) or **red** (might not be working). |
| Memory | Checks low and extended memory. Each data pattern is written to memory, then read and verified. Takes longer. Duration depends on memory size and processor speed. Successful or failed. |
| Touchpad | Tests the pointing device. The user clicks the mouse buttons and the circled areas on the right and left of the screen. A button on screen goes **red** (not yet pressed) → **yellow** (pressed) → **green** (released). |
| Webcam | The detected webcam streams video on screen. A browser pop-up appears first: click **"Allow"** to turn the webcam on. |

## Process outcome (§12.7, pp.148–149)

The manual says a successfully processed Chromebook will have:
- All its user data erased (**factory reset**).
- A Blancco report **"proving that the erasure has taken place"**, including hardware and diagnostic information from the Chromebook.
- After rebooting back to user mode (not Developer mode), the original OS (**ChromeOS**) is reusable, with **no need to re-image** the Chromebook.

### What the manual claims, and what it does not

This is a reading of pp.144–149 only. It adds no outside facts.
- **Claimed**: the "Erase" action on BDE runs a factory reset over the network, with status Successful/Failed (p.145). User data is erased by that factory reset, and the report is described as proof that "the erasure has taken place" (p.149).
- **Not stated in these pages**: which erasure method or standard is used, whether storage is overwritten or verified sector by sector, or how the factory reset is carried out on the device. The outcome is described only as "factory reset".
- **Not stated**: anything about removing enterprise enrolment or locks. The manual instead requires Chromebooks to be "neither locked, nor enrolled" before processing (p.144).
- **Developer mode** is expected to switch off on the final reboot (p.147), but §15.2 says some devices may stay stuck in it (see below).

## Troubleshooting (§15, §15.1, §15.2, pp.180–181)

### General: getting help (§15, p.180)

- See the Blancco Support Knowledge Base (https://support.blancco.com/space/KB) or open a ticket at support.blancco.com. Collect information about the affected machine beforehand.
- Generate an issue report in BDE:
  1. After reproducing the issue, click **"Report issue"** (or press **F3**).
  2. Write a short description of the problem.
  3. Save the issue report to a USB stick or send it to BMP.
  4. Submit a ticket at http://support.blancco.com:
     a. Press "Submit a Ticket".
     b. Press "Next".
     c. Fill in your details and the problem description, and attach the issue report.
     d. Press "Submit".

### §15.1 Required files not found (p.180)

Message on the Chromebook:
> Some of the required files were not found
> Please reboot and wait longer for the ChromeOS welcome screen to appear before switching to the terminal
> If the problem persists, please create an issue report from Blancco Drive Eraser and contact Blancco Support

- **Cause**: the terminal was opened before the device had time to initialise all components and drivers on the welcome screen.
- **Fix**: reboot and wait until the Welcome Screen (after the Google logo) is fully shown. Then the terminal can safely be opened. If it still happens, wait longer on the Welcome Screen.
- On some machines (e.g. **Lenovo ThinkPad 13 Chromebook**) the problem is in the installed ChromeOS (e.g. **ChromeOS 94**). The fix is to update ChromeOS via the **OTA** (over-the-air) update.
- If the **last line** of the message is not shown, there are communication problems between BDE and the device.

### §15.2 Device stays in Developer mode after erasure (pp.180–181)

- These report exceptions may mean the Chromebook is **stuck in Developer mode** and it cannot be turned off:
  - "Some internal attributes (GBB flags) have abnormal values."
  - "Firmware write protection via hardware is disabled."
  - "Firmware write protection via software is disabled or its range is zero."
- The device may have some protection (software or hardware, e.g. write protection or a write-protect screw) that stops that mode being disabled. The manual refers you to the Chromebook's own user documentation.
