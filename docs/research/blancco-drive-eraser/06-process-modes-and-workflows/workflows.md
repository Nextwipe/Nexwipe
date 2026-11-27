# Workflows (scripted processes)

**In short**
- A *workflow* is a flowchart you draw in Blancco's web portal (BMP or BMP On-Premise 6.0.0+) that tells Drive Eraser (BDE) what to do step by step: erase, test, ask the operator, call a web server, send a report, restart, etc. (§13, p.150).
- It needs a separate licence and the boot image must be set to the "Workflow" erasure process in the Configuration Tool (CT) (§13, §13.1, p.150).
- A workflow runs either once per machine at boot ("Computer-level", start item "Booted") or once per drive as drives are detected ("Drive-level", start item "Connected", supports hot-plug) (§13.6, p.167).
- Most actions have a green (success) and red (failure) exit; logic uses variables, report values (`REPORTPATH`) and a small expression language (§13.3–13.4.3.3, pp.151–165).
- Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), chapter 13, pp.150–175.

**Jargon used below**
- **BDE** – Blancco Drive Eraser, the bootable erasure software.
- **BMP** – Blancco Management Portal (cloud). **BMP On-Premise** – the self-hosted version of the portal.
- **CT** – Blancco Drive Eraser Configuration Tool, used to build/customise the boot image (ISO).
- **WFE** – Workflow Editor, the drag-and-drop editor inside the portal.
- **Subworkflow** – a workflow started from inside another workflow (like calling a function).
- **XML path / XmlPath** – a dotted address pointing to one field inside BDE's XML report, e.g. `blancco_data.blancco_hardware_report.disks.disk.capacity`.
- **Autopilot / Intune** – Microsoft's services for automatically enrolling a company laptop into its owner's management on first boot. A machine still "enrolled" will be claimed by its previous owner when reset, so resellers check it.
- **PSID** – Physical Security ID, a code printed on a self-encrypting drive's label that lets you factory-reset (and thereby crypto-erase) a locked drive. **TCG Opal/Enterprise** – the standards for self-encrypting drives.
- **IPMI / BMC** – the out-of-band management chip on servers (Dell iDRAC, HPE iLO, etc.). **UID LED** – a "locate me" light on a server.
- **IBR** – the manual mentions "IBR workflows" for the Locate action without defining it in these pages; it appears to refer to rack/server (in-rack) erasure workflows — treat as unconfirmed.
- **WAD client** – a Blancco client used for Autopilot detection on older BDE versions (not defined further in these pages).

---

## 1. What a workflow is and how it is started (§13, p.150)

- When BDE is configured to run the **Workflow process**, it follows the actions set in the workflow created in the Workflow Editor.
- The Workflow Editor is available in **BMP** and in **BMP On-Premise 6.0.0 or newer**.
- The feature is **licensed separately** from normal Drive Eraser licensing (contact Blancco).
- Workflows can be triggered directly from BMP On-Premise using the **"Start Workflow"** action in the *Process Management* section.

## 2. Requirements (§13.1, p.150)

- A network connection plus a BMP On-Premise installation (or a BMP account and internet connection) to manage and store workflows.
- The image must be configured with CT with these settings:
  - **Security / Erasure Process – Workflow**
  - **Default workflow** – the workflow the user set as default is used. Active by default.
  - **Workflow name** – if "Default workflow" is disabled, the workflow's name must be typed here.
- If BMP On-Premise settings are not set in CT's **"Communication"** tab, they must be entered manually after the client software boots.
- When the connection is successful, workflow fetching is retried at **30-second intervals**.
- See the CT documentation for details of the settings.

## 3. Creating and editing a workflow (§13.2, pp.150–151)

To create:
1. Open BMP On-Premise or BMP.
2. Go to **Process Management – Dynamic Workflows – Drive Eraser workflows** (or the **Workflows** tab in BMP). The button is only visible if the Workflow Editor has been enabled for your account.
3. Click **"Create"** to open the Workflow Editor. A workflow needs a name before it can be saved, and **the name cannot be edited later**.

To edit an existing one: choose the workflow → **"Manage workflow"** → **"Edit"** (opens it in the editor).

To make a workflow the default: **"Manage Workflow"** → **"Set as default"**. Only the workflow's **owner** can do this (p.151).

## 4. The Workflow Editor (§13.3, pp.151–152)

Layout:
- Left: list of actions. Middle: work area. Right: **Properties** panel for the workflow or the selected action.

Navigation:
- Zoom 50%–150% with **Ctrl + mouse scroll**.
- Pan by dragging with the left mouse button; up/down with mouse scroll; left/right with **Shift + mouse scroll**.
- A button shrinks/enlarges the properties area (icon shown in manual — screenshot in manual).

Editor versions:
- Top right has a **Workflow Editor version selector** listing all editor versions. Choosing a version needs internet access; without it only the bundled editor is available.
- The selected editor version **should match the client (BDE) image version** that will run the workflow.
- The editor version used is stored in the workflow file; next time BMP tries to use that version, otherwise it falls back to the most suitable editor.

Building:
- Drag and drop actions into the work area; remove by selecting and pressing **Delete/Del**.
- Connect actions by clicking an action's output and linking it to another action's input.
- Some actions have two outputs: **positive** (upper-right, green) and **negative** (lower-right, red). E.g. for Erase, green is taken if the erasure succeeded and red if it failed.

Workflow-level setting (p.152):
- **"Report in the XML"** checkbox — when on, BDE adds all the workflow's action information to the XML report. On by default. If turned off in a main workflow, BDE turns it off for all its subworkflows.

Other:
- Rename an action by selecting it and clicking the edit symbol next to its name (top right); this does not change the action's symbol (screenshot in manual).
- Bottom of window: **Save** saves all changes and exits; **Cancel** discards all changes and exits.

## 5. Available actions (§13.4, pp.152–160)

All actions can be renamed through their properties. Some actions exist **only in the new workflow editor**, available from BMP (p.152).

### 5.1 Device actions (§13.4.1, pp.152–154)

| Action | What it does | Parameters / options | Exits, limits, notes |
|---|---|---|---|
| **Start** | Workflow execution starts here. | **Computer-level**: starts when the system boots. **Drive-level**: starts when an erasable device is detected. | See §8 below for differences between modes. |
| **Erase** | Starts erasure of the drive using the default erasure settings. | **Erasure standard** dropdown: full standard name (any from the list); **Default** (pre-configured in the BDE image); **Use variable** (pass a standard via a variable such as `<VARIABLE standard>`, or type the full standard name). **Overwriting pattern type**: zeroes or periodic random patterns; works only when "NIST 800-88 Clear" is selected; "Static pattern" also lets you set the byte value; also changeable in CT; NIST 800-88 Clear allows 1–4 bytes instead of just 1 (e.g. `0xAABBCCDD`), also in CT. **Verification percentage**: a ready-made value or a variable, or a fixed value typed in (e.g. 0% for minimal verification). **Write pattern after erasure**: an extra overwrite round after the main erasure so the drive is easier to verify; options "Overwriting pattern type" and "Pattern". **Use WRITE SAME command**: faster erasure for steps with periodic patterns (SCSI and SAS drives only); enabled by default. **Configure firmware-based commands**: choose which firmware commands are allowed; all enabled by default; click the arrow to show all options. | "Enforce Blancco SSD method on SSDs" and "Enable fallback from NIST Purge to NIST Clear" **do not apply** to the Erase action — fallback/enforcement must be built into the workflow itself. If the standard or verification percentage is incorrect, the default (pre-configured in ISO) value is used. If erasure has problems (e.g. not enough licences, invalid standard) the reason is stored in `<LAST_OPERATION_START_ERROR>`, also usable in Set value, Message, Question and Server message. **Only in Drive Eraser.** (pp.152–153) |
| **Diagnose** | Runs diagnostic hardware tests (see the manual's "Hardware tests" chapter). | Tests requiring user interaction can be selected in the action's settings. | After each test a result dialog asks the operator: **YES** = "Successful", **NO** = "Failed", **SKIP** = "Not available"; if hardware is otherwise unavailable it is "Not performed". **Only in Computer-level mode and only if hardware tests are enabled in CT.** (p.153) |
| **Self-test** | Runs the drive's own self-tests to assess its state. | **Short** – performance test, under two minutes. **Extended** – longer, more thorough; can take hours depending on capacity and speed. **Conveyance** – quick test for damage from transport, several minutes. **Variable** – set the type via a variable or typed text. | (p.153) |
| **Reimage** | Reimages the machine with a Windows **WIM** image fetched from a network share. | **Prompt** – if the shared folder path is configured correctly, a list of image names is shown in the UI at runtime. **Use variable** – image name from a defined variable. **Manual entry** – type the name of an image in the shared folder. | Both **citizenship licences** and **digital product keys** are supported. See [reimaging.md](../14-finish-restart-reimage/reimaging.md). (p.153) |
| **Autopilot check** | Retrieves whether the machine is enrolled in Microsoft Autopilot/Intune. A timestamp is added to the report. | **"Recheck status if older than"** N days; **0** = immediate recheck (subject to a **2 h moratorium**). | **Green exit = Not enrolled.** **Red exit = enrolled, or an error during detection.** BDE older than **7.17** needs a WAD client run on the machine. Can take a few minutes; Blancco recommends running other actions simultaneously. **Computer-level (Booted) workflows only.** (pp.153–154) |
| **Enter PSID** | Shows the same PSID dialog as manual entry, to unlock TCG-locked drives (Opal and Enterprise). | **"Get PSID value from the variable"** – if filled, PSID is taken from that variable and no dialog is shown. Supports **secure variable** values (set via the "Set Value" action). | Must be followed by an **Erase** action that executes the **PSID Revert** command. **Drive-level only**; in a Computer-level workflow it passes green immediately. Passes green immediately if the drive is not TCG Storage compliant, or if "Reset drive to factory defaults if non-default TCG password is set" or "...if drive is in TCG locked state" is checked. Goes **red** on Cancel, if the variable has no PSID, or if the PSID is invalid. (p.154) |
| **Verify** | Starts verification of the drive using default verification settings. | **Verification standard** dropdown; a byte value between `0x00` and `0xFF` (depends on the chosen standard). | Whole workflow is **interrupted** if: not enough licences; verification cannot be started (other reason). **Only in Drive Verifier.** (p.154) |
| **Charge battery** | Pauses the workflow until the battery reaches a specified charge level, then continues. | Target charge level; a time window in minutes for progress. | **Success**: target reached or no battery found. **Failure**: charging too slow or no progress in the specified number of minutes. (p.154) |
| **Discharge battery** | Pauses the workflow until the battery discharges to a specified level. Unplug the power cord to start discharging. | Target charge level. | **Success**: level reached or no battery found. **Failure**: discharging too slow or charge level increases. **Computer-level only.** (p.154) |

### 5.2 Logic actions (§13.4.2, pp.154–158)

| Action | What it does | Parameters / options | Exits, limits, notes |
|---|---|---|---|
| **Condition** | An IF statement. The expression is evaluated and converted to Boolean; true → success (green), false → failure (red). | Expression using operators in §6.3 and the variables listed below. | (p.154) |
| **Question** | Pop-up asking the operator a pre-defined Yes/No question. | Customisable text: title, bold, italics; **"Customize background color"** checkbox + colour. Variables can be inserted via the text editor's **(x)** icon and show their values. | **Yes → Success, No → Fail.** Max **1024 characters**. (p.155) |
| **Set variable** (also called "Set value") | Assigns a new value to a variable. | Supported targets listed in the table in §6.1 below. Right-hand side may be an expression (p.165). | Workflow **interrupted** if: "Action is called on an invalid target" (drive with given ID unavailable); "Failed evaluating expression" (syntax error). (pp.155–156) |
| **Subworkflow** | Fetches the workflow named in **"Subworkflow name"** and runs it. | **"Continue to the next action before completion"**: on → parent proceeds through green as soon as the subworkflow starts, both run in parallel, and a **Collect results** action is needed to get the result; off → parent waits for the subworkflow to finish. | If the subworkflow doesn't exist or can't be fetched, **parent validation fails**. A workflow **cannot start itself** as a subworkflow. If a drive-level subworkflow is started from a computer-level workflow and fails for any drive, the action result is "failure". If the subworkflow is interrupted, the parent is interrupted. (p.156) |
| **Create custom erasure** | Creates a new erasure option (custom overwrite pattern and erasure type) for use in Erase. | **Name** (action name, default "Create Custom Erasure"); **Erasure Name** (required; shown in the UI selection); **Add step** (type, byte value, overwriting pattern type; more steps with **(+)**); **Set custom erasure name to** (stores the standard's name in a variable, used with Erase → "Use variable"). | **Only one path.** Available only through workflows, but reusable from the UI's "In-process" settings during the session; listed at the bottom under **"Custom defined standards"**. **Only in Drive Eraser.** (p.156) |
| **Collect results** | Collects results of subworkflows started with "Continue to the next action before completion" on. | Subworkflow name to wait for. | Waits for **all** subworkflows with that name. Green if all succeeded; red if at least one failed. If one was interrupted, the main workflow is interrupted here with reason **"Interrupted by subworkflow"**. If none with that name were started, it completes immediately via green. (pp.156–157) |
| **Create custom field** | Creates or updates a custom field for the device and asks the operator for its value. | **Custom field name** (action name, shown in the pop-up, customisable in WFE); **Title** (identifies the field in the report; cannot be empty — otherwise the workflow fails with "The custom field has an empty title"); **Custom field type**: Text field / Drop down list / Multi drop down list; **Default value** (Text field only); **Options** (comma-separated; drop-down types only); **Regular expression** (Text field only); **Regular expression hint**; **Required** (empty answers not accepted); **Show in custom field editor**; **Use the default value** (assigns the default and continues without asking). | If a custom field is predefined in the BDE image it stays unchanged in the report unless the user interacts with it; but a workflow-created field with an **identical title overrides** the predefined one. See the manual's "Custom fields" chapter and CT manual. (p.157) |
| **Custom field editor** | Opens a Custom Fields Editor dialog to view/update several custom fields at once before continuing. | Columns: **"Fill in the remaining horizontal space"** (default; as many columns as fit) or **"Set fixed number of columns"**. | (p.157) |
| **Add delay (sleep)** | Pauses the workflow for a set duration. | Duration in ms. | Allowed range **0–2,000,000,000 ms**. (p.157) |
| **Finish** (called "Finalize" in places) | Finalises the process. | **Show fail** – device shows the process failed. **Restart** – restart after completion (Computer-level only). **Shutdown** – shut down after completion (Computer-level only). | If no Finish is reached when the workflow runs, the **whole workflow is interrupted**. **Shutdown takes precedence** over Restart if both are set. (p.158) |

Variables listed for **Condition** (pp.154–155):

| Variable | Meaning | Notes |
|---|---|---|
| `<DRIVEATTRIBUTES REMAPPED_SECTOR_COUNT>` | Number of remapped sectors on the drive. | Drive-level only; in computer-level or if unsupported by the drive, result type is Invalid. |
| `<DRIVEATTRIBUTES UNCORRECTABLE_SECTOR_COUNT>` | Number of uncorrectable/bad sectors. | Same restriction as above. |
| `<DRIVEATTRIBUTES IS_SSD>` | Whether current drive is an SSD. | Drive-level only. |
| `<DRIVEATTRIBUTES IS_NVME>` | Whether current drive is NVMe. | Drive-level only. |
| `<DEVICECUSTOMFIELD FIELD_TITLE>` / `<DEVICECUSTOMFIELD FieldTitle>` | Value of the custom field with that title. | For "Multi drop down list" fields, a comma-separated list of the selected options. |
| `<REPORTPATH XMLPATH>` | A node in the report, for comparisons or other actions. | Example: `lessThan(<REPORTPATH blancco_data.blancco_hardware_report.hardware_tests.battery_capacity.capacity>, 80)` checks battery capacity under 80. See §9. |
| `<ENTITYINFO Name>` | Value of ENTITYINFO with that name. | |
| `<MODEL>` | Drive model (drive-level) or computer model (computer-level). | |
| `<MANUFACTURER>` | Drive vendor (drive-level) or computer vendor (computer-level). | |
| `<LAST_OPERATION_START_ERROR>` | Why an operation could not start, e.g. `"NOT_ENOUGH_LICENSES"`. | |
| `<ERASURE_PROGRESS>` | Current erasure progress, 0–100 (%). | 100 when complete. |
| `<ERASURE_TIME_LEFT>` | Estimated erasure time left, 0–int64 max (seconds). | 0 when complete. |

### 5.3 Misc actions (§13.4.3, pp.158–160)

| Action | What it does | Parameters / options | Exits, limits, notes |
|---|---|---|---|
| **Save report** / **Send report** | The manual lists "Save report" and "Send report" together with one description: sends a new report or updates the existing one. | **"Send report:"** – sends the report to BMP; forced on, cannot be changed. | If an Erase ran before this action, an **erasure report** is sent; otherwise an **asset report**. Whole workflow **interrupted** on **missing licence**. The manual gives no separate description for "Save report". (p.158) |
| **Save issue report** | Creates a new issue report and saves it to a selected destination. | Destination. | (p.158) |
| **Send issue report** | Sends an issue report (extra system info and logs to help reproduce a problem) to BMP. | **"Customized comment"** toggle + **"Problem description"** field. | If Problem description is empty or Customized comment is off, BDE inserts an auto-generated comment. When turned on, "Customized comment" automatically sends an issue report to BMP (as worded in manual). (p.158) |
| **Play sound** | Plays a sound from the device once erasure progress has completed. | **Sound sample**: Information / Warning / Error. **Duration**: seconds, default 5. | Sample repeats until the duration is met. No sound if no sound drivers or sound device misconfigured. (p.158) |
| **Message** | Informational dialog in the BDE GUI with an OK button. | Customisable title, bold, italics; "Customize background color"; may include variables (shown with values); timeout seconds. | Workflow continues after OK or after the timeout. Max **1024 characters**. (p.158) |
| **Server message** | Sends an HTTP GET/POST/PUT/PATCH/DELETE request to a URL, parses the JSON reply, and stores values into variables. | See detail table below. | (pp.158–160) |
| **Locate** | Helps find a particular drive in dense equipment by making it blink a light. | **"Turn on"**. | **Per-drive workflow**: triggers drive blinking. **Asset-level workflow**: turns the **UID LED** on/off through IPMI. Blinking can also be turned off from the **Locate** button in the BDE UI; main use is via "IBR workflows". (p.160) |
| **IPMI factory reset** | Clears IPMI data: all customer-created accounts, network configurations, IPMI event log records, etc. | — | Mainly used when user credentials are not required to perform "BMP factory reset" (manual's wording; likely means BMC). **Computer-level only.** Two paths, "Successful" and "Failed". No management controller → proceeds via success. Supported: **Dell (iDRAC), HPE (iLO), Supermicro, Quanta** ("BMP" in manual). (p.160) |

**Server message — parameters** (pp.158–160):

| Field | Rules |
|---|---|
| Method | **GET** retrieves data (no body); **POST** sends data; **PUT** replaces the target resource with the payload; **PATCH** partially modifies a resource; **DELETE** deletes a resource. |
| URL | Max **2048 characters**. May contain variables in `<>` substituted before sending. Only **HTTP and HTTPS**. With HTTPS **server certificate validation is not performed**. |
| Extra HTTP headers | Several headers separated by new lines; max **2048 characters**. May contain `<>` tags. `Content-type` and `Content-length` are always replaced with actual values for POST. Supports secure variables. |
| Content type | `application/json` or `application/x-www-form-urlencoded`. Certain expressions not allowed, e.g. `"field=value&"`. |
| Store HTTP return code to | Empty, or one assignable tag: `<VARIABLE VariableName>`, `<ENTITYINFO InfoName>`, `<DEVICECUSTOMFIELD FieldName>`. Stores the HTTP status code if one is received. |
| JSON to send as POST payload | Not used with GET. Supports secure variables. Tags allowed in JSON **values (not keys)**, e.g. `{"event":"connected","interface":"<REPORTPATH blancco_data.blancco_hardware_report.disks.disk.interface_type>"}`. |
| JSON reply from server | Values must be empty or an assignable tag (`<VARIABLE ...>`, `<ENTITYINFO ...>`, `<DEVICECUSTOMFIELD ...>`). If the reply is valid JSON and its structure matches this template, variables are assigned from the reply. |
| Request timeout (seconds) | Allowed **1–2,000,000 seconds** (from the error table, p.174). |
| Result | **Green** if any HTTP status code is received — including 404 or 500; you must check the code yourself. **Red** if no status code (connection refused, timeout, etc.). |
| Interrupts workflow | URL invalid after variable substitution; extra headers incorrect after substitution; variable cannot be assigned. |

#### Server message examples (§13.4.3.1, pp.160–161)

Valid reply template:

```json
{
  "erasureStandard": "<VARIABLE standardId>",
  "machineGrade": "<DEVICECUSTOMFIELD machineGrade>",
  "someSubObject": {
    "someArray": ["", "<ENTITYINFO someArrayElemTwo>", ""]   <= we are interested in value of the second element of the array
  }
}
```

Corresponding reply:

```json
{
  "erasureStandard": "nist-purge",
  "machineGrade": 5,
  "someSubObject": {
    "someIgnoredValue": true,
    "someArray": [12.34, 34.56, 56.78]
  }
}
```

Invalid reply template (with the manual's reasons):

```text
{
  "<MANUFACTURER>": "<VARIABLE someVariable>",                         <= Keys must be constant
  "manufacturer": "<REPORTPATH some.report.path>",                     <= REPORTPATH cannot be assigned
  "assetTag": "<VARIABLE someVariable><DEVICECUSTOMFIELD assetTag>",   <= Only one variable can be specified
  "serialNumber": 10203040                                             <= "10203040" does not specify an assignable variable.
                                                                          If a value needs to be checked, first assign it to a
                                                                          variable and then check in Condition action
  "someSubObject": {
    "someArray": ["One", "<ENTITYINFO someArrayElemTwo>", "Three"]     <= "One" and "Three" do not specify an assignable variable.
  }
}
```

## 6. Variables and expressions

### 6.1 Set variable targets (§13.4.2, pp.155–156)

| Target | Effect |
|---|---|
| `<ENTITYINFO FieldName>` | Creates/updates a value attached to an entity (computer or drive), shown in the UI and the report. Computer-level: shown between the "Process: workflow" label and the Process tabs. Drive-level: shown under each drive. |
| `<DEVICECUSTOMFIELD FieldTitle>` | Creates/updates a custom field; if none with that title exists, a new **"Text field"** custom field is created. |
| `<VARIABLE VarName>` | Changes variable VarName. Names starting **`G_`** are accessible from any workflow; others only in the current workflow. |
| `<ERASURE_PROGRESS>` | 0–100%; "invalid" before erasure starts. |
| `<ERASURE_TIMELEFT>` | 0–int64 max seconds; "invalid" before erasure starts. (Spelled without underscore here, `ERASURE_TIME_LEFT` on p.155.) |
| `<SECUREVARIABLE VarName>` | Value is **encrypted** after saving the workflow; when reopened it shows `<encrypted data>`. Usable only with **Server message** and **Enter PSID**; elsewhere gives an invalid value (e.g. empty Message box). |
| `<LAST_OPERATION_START_ERROR>` | Reason an operation could not start, e.g. `"NOT_ENOUGH_LICENSES"`. |

### 6.2 How variables behave (§13.4.3.2, pp.161–162)

- `<VARIABLE name>` stores intermediate values that **do not go into the report**.
- `G_`-prefixed variables have **global storage**, accessible from any workflow during a BDE session.
- Variables are supported in Set Value, Condition, Message and Question actions.
- In Message/Question dialogs, `**this**` renders bold and `*this*` italic.
- Stored types: **String, Integer, Boolean, JSON**. Floating-point values are **not supported** — stored as Strings, so no arithmetic on floats.
- Variables belong to the device the workflow runs on: the **target drive** for drive-level, the **Host entity** for computer-level. All drive-level workflows on the same drive (main + drive-level subworkflows) share one variable context; all computer-level workflows can access each other's variables.
- Example that gives a different value for each disk:

```text
<VARIABLE Capacity> = <REPORTPATH blancco_data.blancco_hardware_report.disks.disk.capacity> + 100
```

- A drive-level workflow must use the `G_` prefix to reach a computer-level (global) variable; in computer-level workflows the `G_` prefix is ignored. The manual also states "Accessing computer-level variables from drive-level workflow is not possible" (p.161) — this appears to mean without the `G_` prefix.
- Other notes (p.162):
  - Message and Question support **Markdown** basic syntax (https://www.markdownguide.org/basic-syntax/), e.g. `**bold**`, `*italic*`. "8. Continue" is treated as an ordered list and shown as "1. Continue"; write `8\. Continue` to avoid this.
  - Variables can be used on both sides of expressions.
  - Integer arithmetic `+ - * /` works.
  - Operations cannot be used in questions.
  - For strings, functions such as `concat(X, Y)` can be used.
  - Variables are **case-sensitive**.
  - Global variables work correctly when the main workflow is computer-level and the subworkflow is drive-level.
  - The `G_` prefix is optional in a main computer-level workflow but **required in subworkflows** to access computer-level variables.

### 6.3 Supported condition expressions (§13.4.3.3, pp.162–165)

| Operator / function | Example(s) | Behaviour |
|---|---|---|
| `AND` | `true AND false` | Boolean; non-Boolean operands converted to Boolean. |
| `OR` | `true OR false` | Boolean; non-Boolean operands converted to Boolean. |
| `==` | `10 == 10`, `'False' == false`, `'10' == 10` | Equality. Different types → both converted to String. String comparison is case-insensitive for Latin characters. If either operand is Invalid, result is always false. |
| `!=` | `true != false`, `'' != 10` | Not equal; same rules as `==`. |
| `Boolean lessThan(Int, Int)` | `lessThan(10,20)=true`, `lessThan('441',445)=true`, `lessThan(false,200)=true`, `lessThan('AB','AA')=false` | If an operand isn't an integer, tries converting both to Integer; if that fails, compares as Strings. Invalid operand → false. |
| `Boolean moreThan(Int, Int)` | `moreThan(20,10)=true`, `moreThan(0,0)=false`, `moreThan('A','AA')=false` | Same rules as lessThan. |
| `Int min(Int, Int)` | `min(10,20)=10` | Smallest; integers only, no conversion. |
| `Int max(Int, Int)` | `max(10,20)=20` | Largest; integers only, no conversion. |
| `Int length(String)` | `length("VBOX")=4` | String length; string only, no conversion. |
| `Boolean startsWith(String1, String2)` | `startsWith("Hello World","Hello")=true` | Case-sensitive; strings only. |
| `Boolean endsWith(String1, String2)` | `endsWith("Hello World","World")=true` | Case-sensitive; strings only. |
| `Boolean contains(String1, String2)` | `contains("Blancco Drive Eraser","drive")=true` | Case-insensitive for Latin characters; strings only. |
| `String mid(String, Int)` | `mid("Hello World",6)="World"` | Substring from position Int; no type conversion. |
| `String mid(String, Int1, Int2)` | `mid("Hello World",7,2)="or"` | Substring from Int1 with length Int2; no type conversion. |
| `String left(String, Int)` | `left("Hello World",3)="Hel"` | First Int characters; no type conversion. |
| `String right(String, Int)` | `right("Hello World",4)="orld"` | Last Int characters; no type conversion. |
| `String concat(String, String)` | `concat("This is ",true)="This is true"`, `concat("Number of apples is ",50)="Number of apples is 50"`, `concat(50,'')="50"` | Non-strings converted to string; can be used to convert anything to a string. |
| `Boolean isValid(Operand)` | `isValid(<REPORTPATH a/b/c>)=true` (if the path exists in report XML) | True if operand holds a String, Integer or Boolean value; false otherwise. |
| `String/Integer/Boolean/Json jsonValue(Json object, String key)` | `jsonValue(json('{"name":"John","weight":74.8,"id":234,"married":false}'),'id')==234`; same with `'married'` `== false` | Returns the value for the key; type follows the JSON value. Wrong first-argument type or missing key → Invalid. |
| `String/Integer/Boolean/Json fromPath(Json json, String path)` | `fromPath(json('{"id":127,"x":{"y":{"z":"result"}},"somekey":"string"}'),'x.y.z')=="result"`; `fromPath(json('{"id":127,"x":[{"index":0},{"index":1},{"index":2}],"somekey":"string"}'),'x.2.index')==2` | Path = keys or array indexes separated by `.`. Missing path → Invalid. |
| `JSON where(Json array, String key, String/Integer/Boolean value)` | `where(json('[{"key":1},{"key":2},{"key":3}]'),'key',2)` → `json('{"key":2}')` | Finds the object in an array containing the key-value pair; not found → Invalid. |

Operand types (p.164): String, Boolean, Integer, JSON, or Invalid (the manual says "4 types" in one place and lists five in another).
- String: `"Hello"`, `'Bye'`. Boolean: `true`, `false` (**must be lowercase**). Integer: `10`, `0`, `-500`. JSON: `{"a":"yes","b":20,"c":true,"d":[50,70]}`, `["a","b"]`, `{"a":"b"}`.
- **Invalid** is returned when an expression can't be evaluated: wrong argument types, a `<REPORTPATH>` path that doesn't exist, or a DRIVEATTRIBUTE the drive doesn't support.

Type conversion rules (pp.164–165):

| From → To | Rule |
|---|---|
| String → Boolean | true if at least one character, else false. |
| Integer → Boolean | true if > 0; false if ≤ 0. |
| Boolean → String | `"true"` / `"false"`. |
| Integer → String | its string form, e.g. 500 → `"500"`. |
| Boolean → Integer | true → 1, false → 0. |
| String → Integer | only if all numeric characters; otherwise fails. |
| Invalid → Boolean | only possible conversion; always false. |
| JSON → Boolean | `{true}`/`{false}` used as is; otherwise false. |
| JSON → String | its string representation. |
| JSON → Integer | if it holds an integer (e.g. `{10}`), used as is; otherwise fails. |

Quoting rules (p.165): string literals outside tags must be quoted (apostrophes or double quotes); if the string contains apostrophes use double quotes and vice versa.

```text
Accepted:
<MODEL> == "VBOX"
<MODEL> == 'VBOX'      <- same as line above
<MODEL> == '"VBOX"'    <- resulting string is "VBOX"
<MODEL> == "'"

Not accepted:
<MODEL> == VBOX
<MODEL> == """
```

Inside tag parameters, quotes are optional — everything after the tag name up to `>` is the parameter, and surrounding quotes are ignored:

```text
<DEVICECUSTOMFIELD Asset ID>      <- OK
<DEVICECUSTOMFIELD "Asset ID">    <- same as above
<DEVICECUSTOMFIELD 'Asset ID'>    <- same as above
<ENTITYINFO Device color>         <- OK
```

Functions can take non-constant arguments (tags, other functions):

```text
lessThan(<DRIVEATTRIBUTES REMAPPED_SECTOR_COUNT>, max(10, <DRIVEATTRIBUTES UNCORRECTABLE_SECTOR_COUNT>))
```

Set Value uses the same logic, so expressions work on its right-hand side:

```text
<ENTITYINFO Remapped> = concat("Remapped sector count: ", <DRIVEATTRIBUTES REMAPPED_SECTOR_COUNT>)
```

## 7. Autopilot status (§13.5, pp.166–167)

- BDE can check Autopilot status; BDE can be booted via **PXE** (network boot) or **USB**.
- With BMP On-Premise: BDE asks BMP On-Premise, which requests it from BMP. Without On-Premise: BDE gets it directly from BMP.
- Fetching can take **several minutes**; the workflow can erase, run diagnostics, wait, etc. meanwhile.
- Once fetched, the status is in the report under `blancco_hardware_report.system.autopilot.enrollment_status`. You can give operator instructions based on it (process, quarantine, scrap, etc.).
- Use a workflow with the **Autopilot Check** action (example in manual — screenshot in manual). The returned status can be stored in a workflow variable.
- By default Autopilot Check **pauses** the workflow until the status returns. To avoid this, put it in a **Subworkflow** with "Continue to the next action before completion" on, and use **Collect** later to rejoin the threads.

| Status | Description | Reported value |
|---|---|---|
| `NOT_PROCESSED` | Machine not processed; the WAD Client should be run first. | Not processed |
| `UNKNOWN` | Status not fetched — connection issue, unexpected error or timeout. | Unknown |
| `NOT_ENROLLED` | Not enrolled to an Autopilot account. | Not enrolled |
| `ENROLLED` | Enrolled to an Autopilot account. | Enrolled |
| `NOT_AVAILABLE` | Detection process threw an error. | Not available |
| `NO_LICENSE` | Enrolment status recheck failed: no licence. | No license |
| `RECHECK_FAILED` | Enrolment status recheck failed for any other reason. | Recheck failed |

## 8. Drive-level vs Computer-level mode (§13.6, pp.167–168)

- In the report: workflow report under **"System version"** → Computer-level; under **"Drive"** → Drive-level.
- **Drive-level**: starts when a new device is connected and detected (newly attached drives can be detected by clicking **"Refresh"**). Start action is named **"Connected"**. **Supports hot-plugging.**
- **Computer-level**: starts when the system boots. Start action named **"Booted"**. **Does not support hot-plugging.**
- Switch mode in the workflow settings by choosing the **"Start item"** as "Booted" or "Connected" (screenshot in manual).

| Action | Computer-level | Drive-level |
|---|---|---|
| Start | Booted | Connected |
| Erase | Erases **all drives present at boot time**. | Erases the single (currently detected) drive. |
| Send report | Full report with hardware details. | Drive-level report for the single (current) drive. |
| Set value | `<ENTITYINFO>` entry goes under `blancco_hardware_report.system`; `<DEVICECUSTOMFIELD>` creates a **global** custom field if missing. | `<ENTITYINFO>` entry goes under `blancco_hardware_report.disks.disk`; `<DEVICECUSTOMFIELD>` creates a **drive-level** custom field if missing. |
| Condition | Per-drive variables not evaluated; per-drive REPORTPATH paths return the value for the **first found drive**. | Per-drive variables evaluated for the current drive; drive-level REPORTPATHs automatically filtered to the current drive. |
| Finish | Finalises for the machine; can restart or shut down. | Finalises for a drive. |
| Diagnose | Starts chosen tests (hardware tests must be enabled in CT). | Not supported — skipped. |
| Subworkflow | Can start computer-level or drive-level workflows. | Can start **drive-level only**, not computer-level. |
| Create custom field | Creates a global custom field. | Creates a drive-level custom field. |

## 9. Running a workflow (§13.7, p.168)

- Boot the modified image and enter any communication and/or other settings if needed. The process then follows the workflow; whether operator interaction is needed depends entirely on the workflow.
- The UI while the workflow is fetched from BMP, and while running, is shown in screenshots (screenshot in manual).

## 10. Example workflow (§13.8, p.169)

(Diagram — screenshot in manual.)
1. **Start (Connected)** – device detected.
2. **Condition** – device condition checked. If not acceptable → the lower **Finalize** with **"Show fail"**.
3. **Set Variable (value)** – if acceptable, a value is written into the device's custom field in the report.
4. **Send Report** – report sent to BMP; if a report for this device already exists in BMP, it is updated. If sending fails → lower **Finalize** with "Show fail".
5. Process is finalised.

## 11. REPORTPATH attribute (§13.9, pp.170–173)

General notes (p.170):
- In this version **REPORTPATH can be used only in the Condition action**. (Elsewhere the manual shows it in Server message POST payloads and Set Value expressions — the versions may differ; treat "Condition only" as the conservative rule.)
- XmlPath = sequence of XML nodes separated by `.`.
- A syntax error in XmlPath **stops the workflow with INTERRUPTED** status.
- Leaf node of uint or string type → its text value is used.
- Array node (a node named "entries") → the **number of children** is used.
- Node doesn't exist → empty string `""` is used.

### 11.1 XmlPath examples (§13.9.1, pp.170–171)

```text
# Hardware report part
blancco_data.blancco_hardware_report.disks.disk.interface_type
blancco_data.blancco_hardware_report.disks.disk.capacity

# Erasure report
blancco_data.blancco_erasure_report.erasures.erasure.state
blancco_data.blancco_erasure_report.erasures.erasure.firmware_rounds

# Custom fields
user_data.fields.My custom field
```

### 11.2 Filters (§13.9.2, p.171)

Select certain nodes in an array node:

```text
blancco_data.blancco_erasure_report.erasures.erasure[target.target_id=100].failed_sectors
```

Selects erasure nodes having child `target.target_id=100`. Several filters combine as AND:

```text
blancco_data.blancco_erasure_report.erasures.erasure[target.target_id=100][target.type=disk].failed_sectors
```

Both children must exist for the node to be selected. Only `elementPath=value` conditions are supported in this version.

### 11.3 Index addressing (§13.9.3, p.171)

"Search by index" fetches an array element by position, e.g. `log_page` with index 2:

```text
<REPORTPATH blancco_data.blancco_hardware_report.disks.disk.log_pages.log_page[2]>
```

Index is **zero-based**; an index ≥ the number of elements gives **Invalid**. This can be used to build a "for" loop over all array elements (example diagram — screenshot in manual).

### 11.4 Drive-specific paths (§13.9.4, pp.171–172)

Automatically filtered by the current drive ID:

```text
blancco_data.blancco_hardware_report.disks.disk
    -> the disk node for the disk currently processed by the workflow

blancco_data.blancco_erasure_report.erasures.erasure
    -> the erasure node whose target is the current drive
```

### 11.5 Usage examples (§13.9.5, p.172)

```text
# Checking available memory
moreThan(<REPORTPATH blancco_data.blancco_hardware_report.memory.total_memory>, 4194967295)

# Number of processor cores
moreThan(<REPORTPATH blancco_data.blancco_hardware_report.processors.total_cores>, 3)

# Checking battery capacity  (only one battery is checked if the machine has several!)
lessThan(<REPORTPATH blancco_data.blancco_hardware_report.hardware_tests.battery_capacity.capacity>, 80)

# Checking drive features
<REPORTPATH blancco_data.blancco_hardware_report.disks.disk.features.feature[.=cryptoerase]> == "cryptoerase"

# Checking drive's last self test result
<REPORTPATH blancco_data.blancco_hardware_report.disks.disk.self_tests.self_test[id=1].Value> == "[0x00] completed without error"

# Checking SMART attribute
lessThan(<REPORTPATH blancco_data.blancco_hardware_report.disks.disk.smart_attributes.smart_attribute[name=Power On Hours].raw_value>, 1000)

# Check if the erasure was not cancelled
<REPORTPATH blancco_data.blancco_erasure_report.erasures.erasure.state> != "cancelled"
```

(SMART = the drive's built-in health counters, e.g. power-on hours.)

### 11.6 Limitations (§13.9.6, pp.172–173)

- `.`, `[`, `]` are delimiters and **cannot appear in XML node names** (e.g. custom field names).
- Likewise `<`, `>`, `(`, `)` cannot be used in Condition expressions.
- Some values are hard to use because of how they're reported (timestamps, resolutions, etc.), e.g.:

```text
blancco_data.blancco_hardware_report.display.resolution="1920x1080"
```

## 12. Error messages (§13.10, pp.173–175)

If the workflow cannot run, BDE shows an error. **Only one error is shown at a time**; the next appears after you fix the first (p.175).

| Error message | Explanation | Possible solution(s) |
|---|---|---|
| Unknown error | Error not recognised by the software. | Collect an issue report and send it to Blancco. |
| Invalid start item | The first action is invalid. | Check BDE version matches the workflow editor version (most probable cause: version mismatch). |
| Failed to parse expression [expression] | Listed expression could not be parsed. | Check "Condition" or "Set Value" expression syntax. |
| Unknown erasure standard | Erasure standard not recognised. | Check BDE / workflow editor versions match (most probable cause). |
| Incorrect workflow data | Workflow has incorrect data. | Check versions match; try creating the workflow from scratch. |
| Invalid operand value [value] | Listed operand has an invalid value. | Check the operand and whole expression for syntax errors. |
| Unknown hardware test [test name] | Listed hardware test is unknown. | Check versions match; most probably the test isn't supported in the old BDE version; otherwise contact the dev team. |
| Hardware test [test name] parsing failed | Parsing failed on the listed test. | Check versions match. |
| Invalid placement of parentheses in [expression] | Bad `()` placement in a "Condition" item. | Check each parenthesis is closed with its pair. |
| Unsupported DRIVEATTRIBUTES parameter [parameter name] | Listed DRIVEATTRIBUTE parameter unsupported. | Check spelling; check versions match. |
| Unsupported variable [variable name] | Listed variable unsupported. | Check spelling; check versions match. |
| Invalid subworkflow name [name of subworkflow] | Subworkflow item has an invalid name. | Name cannot be empty or longer than **255 symbols**. |
| Workflow cannot call itself | Recursive self-call. | Ensure "Subworkflow" item doesn't contain the current workflow's name. |
| Could not fetch subworkflow [name] | Listed subworkflow could not be fetched. | Check the name is correct and it exists. |
| Drive-level workflow cannot call computer-level workflow | A drive-level workflow tries to call a computer-level one. | Computer-level can call drive-level subworkflows, not the reverse. |
| Pre-configured custom field is locked | Locked custom field can't be edited by the workflow. | The BDE ISO already has a locked custom field and the workflow tries to set one with the same title via "Custom field" or "Set Value". |
| None of the optical test options were chosen. | "Diagnose" has "Optical drive" chosen but none of "Read", "Write", "Blank". | Deselect "Optical drive" or select at least one subtest. |
| Invalid regular expression "EXPRESSION". | "Regular Expression" in "Create Custom Field" is not valid. | Check the regular expression. |
| Empty question. | "Question to ask" field in "Question" is empty. | Fill it in. |
| Empty message. | "Message" field in "Message" is empty. | Fill it in. |
| The custom field has an empty title. | "Title" in "Create Custom Field" is empty. | Fill it in. |
| The custom field's dropdown/multi dropdown list does not have any option. | Drop down / Multi drop down type with empty "Options". | Fill in "Options". |
| Invalid sleep time. | "Duration (ms)" in "Sleep" invalid. | Allowed **0–2,000,000,000 ms**. |
| Unsupported URL "URL". | "URL" in "Server Message" has an unsupported protocol. | URL must start with `http://` or `https://`. |
| Invalid timeout value "TIMEOUT". | "Request timeout (seconds)" in "Server Message" invalid. | Allowed **1–2,000,000 seconds**. |
| Invalid element in JSON reply: JSON_PATH. | "JSON reply format from server" in "Server Message" invalid. | JSON_PATH must contain an assignable tag: `<VARIABLE VariableName>`, `<ENTITYINFO InfoName>` or `<DEVICECUSTOMFIELD FieldName>`. |
| Invalid extra HTTP headers. | "Extra HTTP headers" in "Server Message" invalid. | Check the field value. |
| Default value doesn't match the regular expression. | "Default Value" doesn't match "Regular Expression" in "Create Custom Field". | Change one so they match. |
| Interactive workflow items cannot be used with remote erasure control. | Workflow has operator-interactive items ("Create Custom Field", "Diagnose", "Question", "Message") but the UI is locked by remote erasure control. | Remove interactive items, or change CT "Erasure control" from "Blancco Management Portal remote" to another option. |
