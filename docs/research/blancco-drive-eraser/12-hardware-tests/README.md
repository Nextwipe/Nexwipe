# Step 12 — Hardware tests (diagnostics for resale grading)

**In short**
- Blancco Drive Eraser (BDE) can check whether a machine's parts still work (battery, keyboard, screen, ports, Wi-Fi and so on) and put the results in the same report as the erasure. ITAD (IT asset disposition) companies use this to grade a device before reselling it.
- There are 21 tests. Some are **automatic**: the software decides the result. Some are **manual**: a person watches or listens and presses Pass or Fail.
- The admin picks which tests are offered, sets the limits that decide pass or fail, and marks tests mandatory or optional in the **Configuration Tool (CT)**, Blancco's separate program for setting up BDE.
- The step is **off by default**. When it is turned on, it is the second step of the default flow (§4.3, p.47). It is switched off completely in "Report per connected device" mode (§10, p.137).
- What a test result means: battery, CPU, memory and motherboard results come from measurements. Bluetooth, display, keyboard, speaker, webcam and similar results mostly depend on a person's judgement.

Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), §4.3 (pp.47–49) and chapter 9 (pp.114–136).

Terms used below:
- **BMP**: Blancco Management Portal, Blancco's cloud or server system that collects reports and licences.
- **CT**: Configuration Tool (see above).
- **UEFI**: the modern replacement for the old BIOS start-up firmware.
- **p.p.**: percentage points (explained under Battery Discharge).

---

## 1. The Hardware tests step in the BDE screen (§4.3, pp.47–49)

### 1.1 Turning it on and where it sits (§4.3, p.47)
- The step is **disabled by default**. The CT turns it on or off.
- When enabled, it is the **second** default step. Clicking it shows every available hardware test in the work area.

### 1.2 Tab colour and overall progress (§4.3.1, p.47)
The tab icon shows overall progress:

| Tab state | Meaning |
|---|---|
| No icon | Not started ("manual tests not started") |
| Green check mark | All tests successful |
| Red "!" icon | At least one test has failed |

The number of tests running and their status is also written under the "Hardware tests" tab label (screenshots in manual).

General colour logic used across BDE's status icons (p.47): grey = not started or not defined; yellow = there is a problem or it is not fully finished; green = successful; red = error, stopped or cancelled. Hover the mouse over an icon to see more information.

### 1.3 Work area (§4.3.2, p.47)
The work area lists the available tests and their current states. The set of tests is chosen in the CT.

### 1.4 Available tests (§4.3.2.1, p.48)
Each test is described in chapter 9 (summarised below).

### 1.5 Running tests and the Test button (§4.3.2.2, pp.48–49)
1. Select the tests you want to run. Some tests run automatically.
2. Click **Run selected tests**, or press **Ctrl+T**.
3. The **Results** column, to the right of each test name, shows its state:

| Result state | Meaning |
|---|---|
| Not performed | The test has not been run yet. |
| Successful | The test ran and the hardware worked correctly. |
| Failed | The test ran and the hardware did not work correctly. |
| Cannot be performed | The test cannot run on the current hardware setup (screenshot in manual). |

### 1.6 General rules for all tests (§9, p.114)
- There are two kinds of test. **Automatic** tests need no user action. **Manual** tests need user input and interaction; you select them on the Hardware tests page and then run them.
- The manual says tests have "three possible end results" but then lists four: **Successful, Failed, Not Performed and Not Available**. This is written exactly as it appears in the manual.
- **Untick the box** in front of a test you do not need, and it will **not be included in the report**.
- In the CT, each test can be:
  - enabled or disabled (whether it is available at all);
  - **mandatory**: it cannot be unticked in the Hardware tests step;
  - **optional**: it can be unticked.

### 1.7 Common pattern in manual tests
Most manual tests end with a dialog window. In it, the operator can type extra notes into a text field, then press:
- **Pass**, which sets the status to Successful;
- **Fail**, which sets the status to Failed;
- **Skip**, which leaves the test's current status unchanged.

The manual describes this dialog for Display, Keyboard, PC speaker, Pointing devices, SIM card presence, Speaker, USB ports and Webcam. For the PC speaker it mentions only Pass and Fail.

---

## 2. Summary of all tests (§9.1–9.21, pp.114–136)

"Type" is the label the manual gives each test. Where the manual gives no label, the cell says how the test behaves instead.

| § / page | Test | Type (as labelled) | What it checks | Pass/fail rule | Settings (default) |
|---|---|---|---|---|---|
| 9.1, p.114 | Battery Capacity | Manual and automatic. Runs automatically at boot. | Battery health: how much charge the battery can hold now compared with the maker's design maximum, plus charge cycles | Pass if capacity ≥ threshold. Always fails if voltage is below the discharge cut-off (about 75% of the minimum design voltage). | Threshold **60%** (CT) |
| 9.2, p.115 | Battery Discharge | Automatic | How fast the battery drains under heavy CPU load | Fails if the charge drops by more than the pass threshold within the time limit, or falls to 10% or below. Will not start below 50% charge (20% on Chromebooks). | Pass threshold **50 p.p.**, time limit **10 min** (CT) |
| 9.3, p.116 | BIOS logo | Manual | Whether the start-up logo is the maker's own or has been customised | Operator decides (S / F / P keys) | — |
| 9.4, p.117 | Bluetooth | Detection is automatic. Operator gives the verdict. | Finds and diagnoses Bluetooth adapters | Operator must pass or fail | — |
| 9.5, p.118 | CPU Basic | Automatic | Whether the processor calculates correctly | Successful or Failed | — |
| 9.6, p.118 | CPU Stress | No label | CPU temperature under stress | Fails if the temperature goes above the threshold | Threshold (no default value given); °C/°F switch (Ctrl+M); duration **3 min** |
| 9.7, p.118 | Display | Manual | Colour reproduction and dead pixels | Operator: Pass / Fail / Skip | — |
| 9.8, p.120 | Keyboard | Manual | Every key, the lock keys and their lights | Operator: Pass / Fail / Skip. CT can require a percentage of keys to be pressed before Pass is allowed. | Required-keys % (CT); layout; Full Size / Compact |
| 9.9, p.122 | Memory | Automatic | Low and extended RAM, using write/read/verify patterns | Successful or Failed | Number of passes (CT 2.12 or newer, up to **99**) |
| 9.10, p.123 | Microphone | Automatic | Records and plays back a 5-second sample | Not stated | Master volume **70%** (slider). Mic sensitivity cannot be adjusted. |
| 9.11, p.123 | Motherboard | Automatic | CMOS checksum, CMOS battery, RTC, UEFI, DMI | Successful "if any of the tests are successful" (manual wording). CMOS battery check fails if the clock is behind by more than 365 days. | 365-day threshold |
| 9.12, p.124 | Network | Automatic | Each Ethernet port's connection | Pass if the port has an IP address, or if the configured IP addresses answer a ping. Automatic fail in certain cases. | Extra IP addresses to ping (CT) |
| 9.13, p.125 | Optical devices | Manual | CD/DVD drive reading, writing and blanking | Successful if the attempted tests finish without errors | Default test set (CT) |
| 9.14, p.126 | PC speaker | No label. Operator confirms. | The built-in beeper | Operator: Pass / Fail | — |
| 9.15, p.127 | Pointing devices / Touchpad | Manual | Mouse or touchpad buttons and clicks | Operator: Pass / Fail / Skip | — |
| 9.16, p.129 | SIM card presence | Manual | Cellular modem and whether a SIM card is inserted | Operator: Pass / Fail / Skip | — |
| 9.17, p.130 | Speaker | No label. Operator confirms. | Left, right and both audio channels, including a 3.5 mm headset | Operator: Pass / Fail / Skip | Volume slider |
| 9.18, p.131 | Touchscreen | Manual | Touch response across the screen | Operator decides | — |
| 9.19, p.132 | USB ports | Manual | Each USB port: detection, read speed, write speed | Operator: Pass / Fail / Skip | Read and write sub-tests are optional |
| 9.20, p.133 | Webcam | Manual | Camera takes snapshots | Operator: Pass / Fail / Skip | — |
| 9.21, p.134 | Wi-Fi adapters | Automatic | Every Wi-Fi adapter can scan for networks | Automatic pass or fail if an SSID (network name) is configured. If no networks are found, the operator decides. | SSID (optional) |

---

## 3. Each test in detail

### 9.1 Battery Capacity (pp.114–115)
- **What it checks:** the charge capacity and charge cycles of **every battery** connected to the machine. The manual labels it "manual and automatic". It compares the battery's **current maximum charge capacity** with the **maximum capacity stated by the manufacturer**. In simple terms, this is "battery health".
- **When it runs:** automatically when the machine boots. It can also be run through the workflow feature, or run again from the BDE screen.
- **How to read the number:** a brand-new battery scores close to **100%**. A very old battery that can no longer hold a charge scores close to **0%**.
- **How charged the battery is right now does not matter.** The same battery gets the same result whether it is full or empty.
- **Pass/fail:** the default threshold is **60%** and can be changed in the CT. Capacity **equal to or above** the threshold means Successful. Below it means Failed.
- **Voltage override:** the test **fails whatever the capacity** if the current voltage is below the **discharge cut-off voltage**, which is about **75% of the minimum design voltage**. Low voltage means the battery is damaged. In that case an error message shows the current voltage and the minimum design voltage.
- **Battery not listed?** BDE could not read the battery's current charge or its maximum capacity. Battery makers supply this information, and some do not follow industry standards, so detection fails. The manual says there is "unfortunately nothing that Blancco Drive Eraser can do about it".

### 9.2 Battery Discharge (pp.115–116)
- **What it checks:** how fast the battery drains. Labelled automatic.
- **Before you start:** the device must be **unplugged**. The battery should be at **50% or more**, which reduces the risk of the machine freezing during the test.
- **Safety limits:**
  - The test **cannot start** below **50%** charge. On **Chromebooks** the minimum is **20%**.
  - The test **stops automatically** when the charge has dropped by the pass threshold, or when it goes **below 10%**. Blancco calls 10% the "minimum security charge"; it is a built-in limit.
  - Both limits exist to stop the machine shutting down unexpectedly, which would lose **both the licence(s) and the report**.
- **Pass/fail:** the test **fails if the battery loses more than the pass threshold within the time limit**. Default pass threshold: **50 percentage points**. Default time limit: **10 minutes**. Both can be changed in the CT.
- **Percentage point (p.p.):** the difference between two percentages. Example from the manual: with a 25 p.p. threshold, a test that starts at 80% fails if the charge drops below 80% − 25 = 55%.
- **Worked examples from the manual** (minimum starting charge 50%):
  - Case 1: the battery is at 40% when the test runs. The test **does not start**.
  - Case 2: the battery is at 60% and the threshold is 40 p.p. The test **passes if the charge at the end is above 60 − 40 = 20%**.
  - Case 3: the battery is at 75% and the threshold is 70 p.p. It "should" pass if the charge ends above 75 − 70 = 5%. However, the 10% minimum security charge fails the test if the charge reaches **10% or less** at any point. The charge must stay above 10% the whole time.
- **What the report shows:** for example `10m1s, 100%->91% (9/50)`. That is the test duration, the charge before and after, and the charge drop compared with the threshold.
- **Warnings:**
  - The test puts the **CPU under heavy load**, which is what drains the battery. Running it on a poor battery **can make the erasure fail, which might corrupt the drive**. If the CPU overheats, consider adding external cooling.
  - Laptops with **more than one battery are seen as one battery**. Depending on the motherboard's battery manager, the batteries may be used one after the other or at the same time.
  - **Hot-swapping batteries** (changing them while the machine is running) is **not supported** by the battery tests.

### 9.3 BIOS logo (pp.116–117)
- **What it checks:** whether the BIOS logo matches the manufacturer's logo or has been **customised**. Labelled manual. In resale terms, it can reveal a corporate-branded start-up screen.
- The BIOS logo is shown **only on UEFI machines**. **Apple devices such as MacBooks show no image.**
- When run, the test displays the machine's current BIOS logo, if one is available (screenshot in manual).
- **Ending the test:** after confirming the logo, press **Esc**. Or use the shortcut keys **S** (Skip), **F** (Fail) or **P** (Pass), or the matching buttons.

### 9.4 Bluetooth (p.117)
- Automatically **detects and diagnoses Bluetooth adapters** on the machine.
- Detected adapters are shown on screen and listed in the **Hardware report**. Some show a name, but usually a **MAC address** (the adapter's unique hardware ID) is shown (screenshot in manual).
- **When the test finishes, the operator must pass or fail it.**

### 9.5 CPU Basic (p.118)
- Checks that the **processor works** by testing its ability to calculate. Labelled automatic.
- Result: **Successful** or **Failed**.

### 9.6 CPU Stress (p.118)
- **Measures CPU temperature** and compares it with the set threshold.
- **Failed** if the temperature goes **above** the threshold. **Successful** if it stays below.
- Switch between **Celsius and Fahrenheit** with the toggle or **Ctrl+M**.
- The test duration can be set. Default: **3 minutes**.
- The manual gives no default temperature threshold.

### 9.7 Display (pp.118–120)
- Tests **colour reproduction and the condition of the screen**. Labelled manual. The colours are chosen to make **defective pixels** easy to spot, because screens are built from red, green and blue (RGB) dots.
- **Screens shown in order:** red, green, blue, black, white (each with its colour name written in slowly flashing letters), then a **grid of straight horizontal and vertical lines** (screenshots in manual).
- **Keys:** **Space** goes to the next screen, **Backspace** to the previous one, **Esc** exits before the end.
- **At the end:** type optional notes, then press **Pass** (Successful) or **Fail** (Failed). **Skip** leaves the status unchanged.

### 9.8 Keyboard (pp.120–122)
- Tests that the **keyboard works**. Labelled manual.
- **Layout:** the on-screen keyboard uses the layout chosen in Settings. You can change it in the test's dropdown: **US** (standard), **FI** Finnish, **DE** German, **BE** Belgian, **FR** French, **JP** Japanese.
- **Key colours:** **red** = not pressed yet (default), **yellow** = pressed, **green** = released.
  - A key that **stays yellow** is probably **stuck**.
  - A key that **stays red** with no sign on screen that a key is being pressed **may not work**.
- **Size:** switch between **Full Size** and **Compact**. Compact means no number pad. (Example screenshot of Compact in manual.)
- **CT setting:** the **percentage of keys that must be pressed** before the test can be passed.
- **Non-standard keys:** the Windows/Command keys, **AltGr**, and some Japanese-keyboard keys are not mapped to their on-screen key, so they **stay red even if they work**. Instead, any key press makes the keyboard picture's **background flash from white to grey**. The manual says this is "presently the best way" to check these keys.
- **Lock keys and Fn:**
  - **Scroll Lock, Caps Lock and Num Lock** switch on and off when pressed during the test. This also tests their **indicator lights**. Make sure they are left in a sensible position when the test ends.
  - **Fn** also switches on and off during the test. It usually does **not** make the background flash. It may be needed, for example, to activate Num Lock or to act as a number pad on a small keyboard. Leave it in a sensible position afterwards.
- **Shortcuts during the test use Alt**, for example Alt+F, Alt+P, Alt+S, Alt+Tab and Alt+Esc. **Alt+Esc exits and ends the test.**
- **At the end:** notes, then Pass / Fail / Skip as in §1.7.

### 9.9 Memory (pp.122–123)
- Checks the computer's **low and extended memory** (RAM). Labelled automatic. Each **data pattern** is written to memory, then read back and verified.
- How long it takes depends on **memory size and processor speed**.
- Result: **Successful** or **Failed**.
- The **number of passes** can be changed in **CT 2.12 or newer**.
- **Note:** this is a **fast** memory test. For a long, thorough check, use specialist software such as **Memtest86+**, **memtester** (on Chromebooks), or set the memory test to a large number of passes (**maximum 99**).

### 9.10 Microphone (p.123)
- The user tests the microphone by **recording and playing back a 5-second sample** through the mic and speakers. Labelled automatic.
- **Amplitude meters** (sound-level bars) show both input and output levels.
- **System master volume** is **70% by default** and can be changed with a slider.
- **Microphone sensitivity cannot currently be adjusted.**
- The manual does not say how the pass or fail result is decided.

### 9.11 Motherboard (pp.123–124)
- Automatically checks the following, where available:
  - **CMOS checksum**: a check on the small memory that stores BIOS settings;
  - **CMOS battery**: the coin cell that keeps the clock and settings alive;
  - **RTC**: the real-time clock;
  - **UEFI**;
  - **DMI**: the firmware table that describes the hardware (model, serial number and so on).
- **Pass rule as written in the manual:** "If any of the tests are successful, then the result will be Successful. Otherwise the result will be Failed."
- **CMOS battery check:** if the BIOS clock is **behind** the reference time by **more than 365 days**, the test fails with the message **"Internal clock is off, check CMOS battery"**. When this happens, **no other parts of the test are reported**.
- After the machine has synchronised its time with BMP, a **cold reboot or shutdown** (fully powering off, not just restarting) is needed before the CMOS battery test can be run again.

### 9.12 Network (p.124)
- Automatically detects a network connection and gives **Successful** or **Failed**. Labelled automatic.
- **One test per Ethernet port.** Two ports means two separate tests.
- **CT setting:** extra IP addresses to **ping** (send a "are you there?" message to), **separated by spaces**. The test succeeds if the configured addresses answer the ping.
- **Automatic pass:** the port has an **IP address**.
- **Automatic fail:**
  - interface looping is in progress;
  - the interface is turned off;
  - no cable is connected;
  - no IP address is found, or none of the configured addresses answer a ping, even when the interface is on and a cable is connected.
- While the test runs, the **"End test" button counts down** and ends the test automatically when it reaches zero.

### 9.13 Optical devices (pp.125–126)
- Tests CD/DVD drives. Labelled manual. Three possible sub-tests: **reading**, **writing** and **blanking** (wiping a rewritable disc).
- **CT setting:** which sub-tests run by default (only write, write + read, only read, write + read + blank, and so on).
- All connected optical drives are shown with their capabilities. If all sub-tests are selected, the tests actually offered depend on what the drive can do.
- **Which disc to insert:**
  - **CD-RW or DVD-RW** (rewritable): BDE can write, read, and then blank the disc at the end.
  - **–R only** (write-once) disc: it must already have been burnt with the **Blancco pattern** (Blancco's reference test data). Only the reading test can be selected. Other tests are not possible and will show error pop-ups.
  - **A drive that cannot write**: only the reading test, using a Blancco-pattern disc.
- **Blancco-pattern disc images** (download links given in the manual):
  - `https://blancco.hosted-by-files.com/products/drive_eraser/download/Test_media/Test_CD_for_HW_Test.zip`
  - `https://blancco.hosted-by-files.com/products/drive_eraser/download/Test_media/Test_DVD_for_HW_Test.zip`
- Getting started can take **up to a few minutes**, depending on the hardware.
- **Results:**
  - Attempted tests complete and OK: **Successful**.
  - Attempted tests complete but errors found: **Failed**.
  - Test skipped entirely, or it could not run (for example the tray is open, or a –R disc is inserted for the writing test): **Not performed**.

### 9.14 PC speaker (pp.126–127)
- Checks the **built-in beeper**. Press the **"Play sound"** button or **Space** and the PC speaker beeps. The user then confirms whether the sounds were heard.
- **Esc** ends the test early.
- **Note:** the PC speaker is **not the same as the normal speakers**. It lets software and firmware give feedback, mostly as beeps. Many modern devices **do not have one**.
- **At the end:** notes, then **Pass** (Successful) or **Fail** (Failed). (Screenshot of beeps playing in manual.)

### 9.15 Pointing devices / Touchpad (pp.127–129)
- Tests a **mouse, trackball, touchpad or other pointing device**. Labelled manual.
- The user clicks the **right, left and middle buttons** and clicks the **circled areas on the right and left of the screen**.
- **Button colours:** **red** = not pressed (default), **yellow** = pressed, **green** = released.
- **Esc** exits before the end.
- **Note:** many laptop touchpads have only two buttons. To trigger the middle button, **press both buttons at the same time**.
- (Screenshots of the start state and the partly completed state in manual.)
- **At the end:** notes, then Pass / Fail / Skip.

### 9.16 SIM card presence (pp.129–130)
- Checks whether the machine has a **SIM card** inserted. Labelled manual. It finds the **cellular modem** and checks whether a SIM card is in it.
- The modem appears in the report under **`cellular_modems`**. It is detected as a **PCIe** device or a **USB** device, depending on how it is connected.
- Works only with modems that have **Linux drivers**. Modems with **only Windows drivers are not supported**.
- Many laptops have **no cellular modem** but still have a physical SIM slot in the case. Such a slot does nothing, and **BDE cannot detect a SIM card in it**.
- Pressing the test button checks for a SIM. During the test, the SIM card's **MCC** (Mobile Country Code) and **MNC** (Mobile Network Code) are shown on screen. If a SIM was found, these codes are also **shown on the test icon**.
- **At the end:** notes, then Pass / Fail / Skip.

### 9.17 Speaker (pp.130–131)
- Press the **"Play sound"** button or **Space** to play sound samples. The user then confirms whether they were heard.
- A **headset on a 3.5 mm audio jack** can also be tested this way.
- The order is **left channel, then right, then both**. An amplitude meter shows the output level, and a **slider** sets the volume.
- **Note:** this is **not** the PC speaker test.
- **Esc** ends the test early. (Screenshot in manual.)
- **At the end:** notes, then Pass / Fail / Skip.

### 9.18 Touchscreen (p.131)
- Checks the touchscreen. Labelled manual. The screen shows **red grid squares that turn green when touched**.
- By touching areas or painting with a finger, the user **decides manually** whether the test passes or fails.
- If the touchscreen is **not detected or is missing**, a pop-up message says so (screenshot in manual).

### 9.19 USB ports (pp.132–133)
- Checks the USB ports. Labelled manual. A **USB storage device, preferably a USB memory stick**, must be plugged into each port being tested.
- **Three sub-tests:**
  - **Detection** (**mandatory**): the plugged-in stick is shown on screen.
  - **Read** (optional): the stick is read and the **read speed** is shown.
  - **Write** (optional): the stick is written to and the **write speed** is shown.
- **The port type is worked out from the connection speed** with the stick. For example, a USB 2.0 stick in a USB 3.0 port is reported as USB 2.0. **Use a stick that supports the newest USB standard** so the port type is detected correctly every time.
- Once started, **every port with a suitable stick plugged in is tested**. Press **Esc** when all ports are done, and a dialog opens.
- **At the end:** notes, then Pass / Fail / Skip.
- **Note:** using the **same stick over and over with the write test turned on can wear it out** and cause failed tests. This is especially true of old flash drives without **wear levelling** (a feature that spreads writes across the memory so no single part wears out first).

### 9.20 Webcam (pp.133–134)
- Checks the detected webcam. Labelled manual. When the test starts, the webcam takes a **snapshot and shows it** on screen.
- Taking a few snapshots (press **Space**) is enough to show the camera works. **Esc** exits.
- **At the end:** notes, then Pass or Fail. **Skip** leaves the status unchanged.

### 9.21 Wi-Fi adapters (pp.134–136)
- Tests **every detected Wi-Fi adapter**. Labelled automatic.
- After you press the test button, testing happens in the background with **no user action needed**. Wi-Fi **does not need to be enabled in the configuration first**. It can also test an active adapter that is currently connected to BMP.
- **Software lock vs hardware lock:** the test first checks for a Wi-Fi **software lock** and unlocks it. If Wi-Fi is blocked by a **hardware lock** (usually a physical switch on the laptop), the test **fails with an error message**, because software cannot override it and the user has to act. This also applies to external USB Wi-Fi devices.
- **Note:** some manufacturers need extra firmware or special handling for their adapters to work on a network. In that case the test fails **even though nothing is wrong with the hardware**. BDE cannot detect this situation, which is why some hardware fails.
- **How it scans:** in **listening mode**, so **no passwords are needed**. It does not connect to networks or send traffic. The basic setup needs only **one dummy Wi-Fi access point** within range broadcasting **any SSID** (network name).
- The test **cannot tell 2.4 GHz and 5 GHz networks apart**. The test access point must use a band the hardware supports. All hardware should support at least **2.4 GHz**, according to the standard.
- **Results:**
  - **No networks found:** the **user** passes or fails the test.
  - **SSID configured:** **automatic pass** if the network is reachable **and** an IP address was obtained. **Fails** if either condition is not met.
- **In the report:** results for each adapter appear in the **"Wi-Fi Adapter"** section. If a test fails, the reason is written in the comment field.
- **Scan networks** scans again. Otherwise the test ends automatically when the countdown on the **End test** button runs out.

---

## 4. Keyboard shortcuts in this step

| Shortcut | Where | Action |
|---|---|---|
| Ctrl+T | Hardware tests step | Run selected tests (§4.3.2.2, p.48) |
| Esc | BIOS logo, Display, PC speaker, Pointing devices, Speaker, USB ports, Webcam | End or exit the test |
| S / F / P | BIOS logo | Skip / Fail / Pass (§9.3, p.117) |
| Ctrl+M | CPU Stress | Switch between °C and °F (§9.6, p.118) |
| Space / Backspace | Display | Next / previous screen (§9.7, p.118) |
| Alt+F, Alt+P, Alt+S, Alt+Tab, Alt+Esc | Keyboard | Shortcuts during the keyboard test. Alt+Esc ends the test (§9.8, p.121). |
| Space | PC speaker, Speaker | Play sound (§9.14, §9.17) |
| Space | Webcam | Take a snapshot (§9.20, p.133) |

## 5. Points of interest for NexWipe
These are observations, not facts from the manual:
- Blancco treats many tests as **operator judgement** (Pass/Fail buttons with a free-text note). Only battery, CPU, memory, motherboard, network and Wi-Fi with an SSID produce results based on measurements.
- Every threshold that decides pass or fail is set by the admin centrally in the CT, not by the technician. Defaults: battery capacity 60%; discharge 50 p.p. in 10 min; CPU stress 3 min; memory passes up to 99; CMOS clock 365 days.
- Safety rules protect the licence and the report from a sudden power-off: no discharge test below 50% charge (20% on Chromebooks), and a hard stop at 10%.
