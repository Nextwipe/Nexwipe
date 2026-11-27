# Custom fields and report per connected device

**In short**
- **Custom fields** are extra labelled boxes that are added to the erasure report, for example "Asset ID" or "Customer". The admin designs them in the Configuration Tool (CT), Blancco's setup program. The operator fills them in during the Custom fields step (§4.4, pp.49–51).
- Fields can be free text, single-choice or multi-choice dropdowns. They can be mandatory, locked, or checked against a pattern (regex, a rule describing allowed text). The report cannot be saved or sent until every mandatory field is filled in.
- **Report per connected device (RPD)** gives each connected drive its own report. It is meant for loose drives that come from different owners, and for Chromebooks (§10, p.137). In this mode hardware tests are turned off and only the Erasure and Custom fields steps remain.
- In RPD mode the Erasure step has two extra actions: **Report (Ctrl+Alt+R)** and **per-drive Custom fields (Ctrl+Alt+E)**. Each drive also shows two status icons, one for its report and one for its custom fields.
- The **Report Viewer** lists saved reports. From it you can export them to USB (PDF, XML or CSV), delete them, or send them to BMP (Blancco Management Portal). This works only when BDE is installed directly on the device (§10.4, pp.140–141).

Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), §4.4 (pp.49–51) and chapter 10 (pp.137–141).

Terms used below:
- **BDE**: Blancco Drive Eraser.
- **BDV**: named next to BDE in §10.4. The manual does not expand it in this section.
- **CT**: Configuration Tool, the separate program used to configure BDE.
- **BMP**: Blancco Management Portal, where reports are collected.

---

## Part A — Custom fields step (§4.4, pp.49–51)

### A.1 What the step is (§4.4, p.49)
- It is the **third** default step.
- In it, the **erasure report can be edited before, during and after** the erasure.

### A.2 Tab colour and overall progress (§4.4.1, p.49)

| Tab colour | Meaning |
|---|---|
| Grey | Report editing not started |
| Blue (ongoing) | Text has been typed into the fields but not yet validated |
| Green (successful) | Fields filled in and validation successful |
| Red (incorrect) | Validation failed because mandatory fields were left empty |

The update status is also written under the "Custom fields" tab label (screenshots in manual).

### A.3 Work area (§4.4.2, p.49)
- Shows **Customer details**, **Operator details** and all the configured **custom fields**.
- You can fill them in with your own company's information to personalise the final report.
- **Maximum length for these fields: 255 characters.**

### A.4 Custom fields (§4.4.2.1, p.50)
Custom fields are **usually created and filled in by the Operator**, meaning the person or company carrying out the erasure.

**Field types.** The manual says "two types" but lists three:
- **Normal entry fields**: type any value. **Maximum length 1023 characters.** (This differs from the 255-character limit given in §4.4.2 for the work-area fields. Both numbers are as printed in the manual.)
- **Dropdown lists**: predefined values; you pick **one**.
- **Multi-selection dropdown lists**: you pick **one or more** predefined values.

**What the admin can set in the CT:**
- **Name**: any name, **maximum 238 characters**.
- **Default value**: any value.
- **Normal or mandatory**: mandatory fields are **highlighted in red and marked with \***. The **report cannot be sent or saved until they are filled in**.
- Example names: "Asset ID", "Asset type", "Asset value", "Destroy asset".

**Locked fields:**
- A locked field has a **predefined value the user cannot change**, and the field is **greyed out**. Only the **CT** can change it.

**Validation rules (regex):**
- **Normal entry fields** can require the input to follow a rule written in the CT as a **regular expression** (regex: a short pattern describing what text is allowed).
- If the input does not match, the **update fails** until the user enters a matching value. The **frame around the field turns red**.
- Manual example: `(A|F)[0-9]{3}` means "A" or "F" followed by 3 digits. `A245` is accepted.
- If the regex **itself is written wrongly**, it is **removed** from the field and a red warning icon **"!"** appears. This tells you the mistake was made during configuration (screenshot in manual).
- **Note:** once an invalid regex is removed, the field becomes a **normal text field**.
- For more detail, the manual refers to the CT user manual.

### A.5 Showing custom fields in the main screen (§4.4.2.1.1, p.51)
- To see and edit custom fields in the BDE screen, use the **Custom field editor** workflow action. It lets you **update several custom fields at once** before the workflow continues.
- When it is enabled, an **icon appears at the bottom of the screen**. It opens and minimises the list of custom fields. The shortcut is **Alt+M**.
- To edit a field, click it in the list and an edit view opens (screenshot in manual).

### A.6 Update button (§4.4.2.2, p.51)
The Update button **validates all changes**. Click it or press **Ctrl+D**. After that:
- All filled-in information **appears in every report**: the "Report" tab, the PDF and the XML.
- **Empty fields are left out** of the general reports (the "Report" tab and the PDF) but **still appear in the detailed XML report**.

---

## Part B — Report per connected device (chapter 10, pp.137–141)

### B.1 What RPD is and when to use it (§10, p.137)
- RPD **must be turned on in the CT**. It produces a **separate report for each connected device**.
- It is meant for:
  - **Loose drives**: drives taken out of their original computers, or out of machines such as printers. They often come from **different environments or owners** and need **separate reports**. They are connected to an **erasure station**, a dedicated computer where the erasure happens.
  - **Chromebooks**: these can be connected to BDE through **network cables and a switch** so they can be processed quickly and securely. Processing covers erasure, hardware diagnostics, custom fields and a report per device. The manual has a separate chapter on this: "Processing Chromebooks with Drive Eraser".
- The "loose drive erasure process" differs from the usual step-by-step laptop process. The focus is **no longer the host machine** (the computer running BDE) but **each connected device**.

**RPD can be enabled only if:**
- BDE is used **locally**; and
- BDE is in **"Manual" process mode**.

**What changes when RPD is on:**
- **Only the Erasure and Custom fields steps** are available.
- **Hardware tests are turned off.**
- The host computer's hardware information is **not** included in the drive report.
- Under "Hardware details" the report shows **only drive information**: model, serial number, sectors, interface, average read/write speed and so on.
- **Logical drives** (partitions or volumes) are removed, and **physical drives** (the actual disks) become visible.
- Each drive can be **erased and reported separately**.
- RPD works together with the **Bootable Asset Report** setting and the **Fingerprint** setting.
- There are **2 kinds of custom field (CF)**:
  - **Common CF for all drives**: updating one updates **every** drive report. Example: "Erasure technician".
  - **CF for each drive**: updating one updates **only that drive's** report. Example: "Drive ID".
- **Default values for custom fields are removed when the "Per Drive" option is used.**
- **Hot-plugging** (connecting a drive while the system is running) is supported for **SATA, SCSI, SAS, USB, NVMe and FC** (Fibre Channel) drives.
- The option must be **turned on in the CT**.

### B.2 Erasure step in RPD mode (§10.1, p.138)
It works like a normal erasure, with **two extra actions**, each with its own button and shortcut: **Report** and **Edit Custom fields**.

#### Report — Ctrl+Alt+R (§10.1.1, p.138)
- Opens the reports for **all selected drives**. Press **Ctrl+Alt+R** or click the Report icon.
- Once open, the reports can be **Saved (Ctrl+S)** or **Sent (Ctrl+N)**.
- **Close (Esc)** closes the window.

#### Custom fields — Per Drive — Ctrl+Alt+E (§10.1.2, pp.138–139)
- Opens the **per-drive custom fields for all selected drives** so they can be edited. Press **Ctrl+Alt+E** or click the Custom fields icon.
- Changes are saved with **Update (Ctrl+D)**. The dialog shows **how many drives are being updated and their IDs**.
- In **Workflow mode**, opening a per-drive custom field also **highlights the drive being updated** (screenshot in manual).
- **Close (Esc)** closes the window.
- **Note:** this changes **only the per-drive custom fields**. To change the common ones, go to the **Custom fields step**.

### B.3 Status icons for each drive (§10.2, pp.139–140)
Each drive shows **two icons**. The icon images are screenshots in the manual; only their meanings are listed here.

| Icon | State |
|---|---|
| Report sending/saving | Report **not sent or saved** |
| | Report **sent or saved successfully** |
| | **Problem saving or sending** the report |
| Per-drive custom fields | Per-drive custom fields **not updated** |
| | Per-drive custom fields **updated** |
| | Per-drive custom fields **update failed** |

### B.4 Custom fields step in RPD mode (§10.3, p.140)
This step edits the **common (not per-drive)** custom fields. It works as described in Part A.

### B.5 Report Viewer (§10.4, pp.140–141)
- Lets you **select one or more report files** and **send them to BMP** or **export them to a USB stick**. You can also **view** a report in **HTML or PDF** format.
- **Note:** this needs **BDE or BDV installed directly on the device**.
- The **"Report viewer" tab** is next to the Custom fields tab. If BDE is not installed, the tab is labelled "Report" instead.
- Tick the checkboxes to select several files. Files are listed **newest first**.
- **Actions on the selected files:**
  - **Export**: saves them to a USB stick. You choose the **location and format (PDF, XML, CSV)** first.
  - **Delete**: **permanently** deletes them, after a confirmation.
  - **Send**: sends them to BMP (**only if BMP is configured**). A **progress bar** and **success or failure messages** appear during sending.

---

## Shortcut summary

| Shortcut | Where | Action | Ref |
|---|---|---|---|
| Alt+M | Main screen (Custom field editor workflow action) | Open or minimise the custom field list | §4.4.2.1.1, p.51 |
| Ctrl+D | Custom fields step; per-drive custom field dialog | Update (validate and save) | §4.4.2.2, p.51; §10.1.2, p.138 |
| Ctrl+Alt+R | RPD Erasure step | Open reports for the selected drives | §10.1.1, p.138 |
| Ctrl+S | RPD report window | Save the reports | §10.1.1, p.138 |
| Ctrl+N | RPD report window | Send the reports | §10.1.1, p.138 |
| Ctrl+Alt+E | RPD Erasure step | Open per-drive custom fields for the selected drives | §10.1.2, p.138 |
| Esc | RPD report and custom field windows | Close | §10.1.1–10.1.2, pp.138–139 |

## Limits summary
- Customer, operator and custom fields in the work area: **255 characters** (§4.4.2, p.49).
- Normal entry custom field value: **1023 characters** (§4.4.2.1, p.50).
- Custom field name: **238 characters** (§4.4.2.1, p.50).
