# Plan — Custom fields and report per connected device

Mirrors: research [13-custom-fields-and-report/custom-fields-and-per-device-reports.md](../../../research/blancco-drive-eraser/13-custom-fields-and-report/custom-fields-and-per-device-reports.md)

**In short**
- NexWipe builds the same **custom fields**: extra labelled boxes on the report (e.g. "Asset ID", "Customer"), designed by the
  company admin on the **Stick setup** page of the web app and filled in by the technician on the laptop screen.
- Same three field types (free text, single-choice, multi-choice), same mandatory / locked / regex rules, same limits
  (255 / 1023 / 238 characters), and the report can't be saved or sent until mandatory fields are filled.
- Same **report per connected device** mode (one report per drive, for loose drives), with the same two extra actions,
  shortcuts and status icons. The Report Viewer's job is covered by the web app's report library; the on-device viewer
  comes with permanent installation (Later).

Source: Blancco manual v7.21.0 §4.4 (pp.49–51) and chapter 10 (pp.137–141) — references kept in every row.

Terms used below:

| Research term | NexWipe equivalent | Phase |
|---|---|---|
| **BDE**: Blancco Drive Eraser | **NexWipe Eraser** (the stick's eraser system and laptop screen) | V1 |
| **BDV**: named next to BDE in §10.4, not expanded there | n/a for NexWipe — an unexplained Blancco product name; NexWipe has no separate product, the eraser covers it | — |
| **CT**: Configuration Tool | **Stick setup** page in the "Prepare stick" section of the web app; settings baked into signed `nexwipe-setup.json` | V1 |
| **BMP**: Blancco Management Portal | **NexWipe web app** | V1 |

---

## Part A — Custom fields step (§4.4, pp.49–51)

### A.1 What the step is (§4.4, p.49)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| It is the **third** default step | Same: "Custom fields" is the 3rd tab on the laptop screen | Kiosk screen | V1 |
| Report can be edited before, during and after the erasure | Same | Fields stored in the engine's live report; edits allowed at any time | V1 |

### A.2 Tab colour and overall progress (§4.4.1, p.49)

| Tab colour | Blancco meaning | NexWipe builds (same) | Phase |
|---|---|---|---|
| Grey | Report editing not started | Same | V1 |
| Blue (ongoing) | Text typed but not yet validated | Same | V1 |
| Green (successful) | Fields filled in and validation successful | Same | V1 |
| Red (incorrect) | Validation failed because mandatory fields were empty | Same | V1 |
| (Status text under the tab label) | Update status written under the "Custom fields" tab label | Same | V1 |

### A.3 Work area (§4.4.2, p.49)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Shows **Customer details**, **Operator details** and all configured **custom fields** | Same three groups | Screen form | V1 |
| Fill in with your own company's information to personalise the report | Same; defaults can come from the company profile in the web app | `nexwipe-setup.json` | V1 |
| **Maximum length 255 characters** for these fields | Same limit, enforced in the form and in the engine | Validation in both | V1 |

### A.4 Custom fields (§4.4.2.1, p.50)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Usually created and filled in by the Operator (person/company doing the erasure) | Same: admin designs them, technician fills them | Stick setup page + laptop screen | V1 |
| Manual says "two types" but lists three | NexWipe lists the same three types (and says three) | — | V1 |
| **Normal entry fields**: any value, **max 1023 characters** | Same, max 1023 | Text input | V1 |
| (Note: differs from the 255 limit in §4.4.2; both as printed) | Same two limits kept as printed: 255 for customer/operator/work-area fields, 1023 for a custom text value | Validation | V1 |
| **Dropdown lists**: pick **one** predefined value | Same | Select | V1 |
| **Multi-selection dropdown lists**: pick **one or more** | Same | Multi-select | V1 |
| Admin sets **Name**: any name, **max 238 characters** | Same, max 238 | Stick setup page | V1 |
| Admin sets **Default value** | Same | Stick setup page | V1 |
| Admin sets **Normal or mandatory**; mandatory fields **highlighted red and marked \***; report can't be sent or saved until filled | Same look and same block on Save/Send | Screen + engine check | V1 |
| Example names: "Asset ID", "Asset type", "Asset value", "Destroy asset" | Same examples offered as quick-add templates | Stick setup page | V1 |
| **Locked fields**: predefined value the user can't change, **greyed out**; only the CT can change it | Same; only the Stick setup page can change it | Field flag `locked` | V1 |
| **Validation rules (regex)** on normal entry fields, written in the CT | Same on the Stick setup page | One regex flavour used both in the web app and the eraser (our choice: the common subset of JavaScript and Rust/Go regex; the page rejects anything outside it) | V1 |
| Input doesn't match → **update fails**; **frame turns red** | Same | Screen | V1 |
| Example `(A\|F)[0-9]{3}` — `A245` accepted | Same example in help; included as a test case | Unit test | V1 |
| Regex itself written wrongly → **removed** from the field and a red **"!"** appears (configuration mistake) | Same behaviour on the laptop; the Stick setup page also checks regexes when saving so this rarely happens | Engine compiles each regex at boot | V1 |
| Once removed, the field becomes a **normal text field** | Same | Engine | V1 |
| More detail in the CT user manual | Same: help page for the Stick setup page | Docs | V1 |

### A.5 Showing custom fields in the main screen (§4.4.2.1.1, p.51)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| **Custom field editor** workflow action lets you update several fields at once before the workflow continues | Same workflow action in the NexWipe workflow engine/editor | Plan step 6 workflows | V1 |
| When enabled, an **icon at the bottom of the screen** opens/minimises the list | Same | Screen | V1 |
| Shortcut **Alt+M** | Same | Screen keyboard handler | V1 |
| Click a field in the list → edit view opens | Same | Screen | V1 |

### A.6 Update button (§4.4.2.2, p.51)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Update **validates all changes**; click or **Ctrl+D** | Same, Ctrl+D | Screen | V1 |
| All filled-in information appears in every report: "Report" tab, PDF and XML | Same | Engine report | V1 |
| **Empty fields are left out** of the "Report" tab and PDF but **still appear in the XML** | Same | Renderers | V1 |

---

## Part B — Report per connected device (chapter 10, pp.137–141)

### B.1 What RPD is and when to use it (§10, p.137)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| RPD **must be turned on in the CT**; separate report for each connected device | Same switch "Report per connected device" on the Stick setup page | `nexwipe-setup.json` | V1 |
| For **loose drives** (taken out of computers or printers, different owners, need separate reports) on an **erasure station** | Same use: a desktop erasure station with loose drives (SATA ports or USB docks) | Plan step 5 detection | V1 |
| For **Chromebooks** via network cables and a switch (erasure, diagnostics, custom fields, report per device; separate chapter) | Same idea, NexWipe's Chromebook track | Plan step 15 [chromebooks.md](../15-special-hardware/chromebooks.md) | Later |
| Focus is **each connected device**, not the host machine | Same | Report model: one report per drive | V1 |
| Enabled only if BDE used **locally** | Same | Engine refuses RPD in remote mode | V1 |
| Enabled only in **"Manual" process mode** | Same | Plan step 6 | V1 |
| **Only Erasure and Custom fields steps** available | Same | Screen hides other tabs | V1 |
| **Hardware tests turned off** | Same | Engine | V1 |
| Host computer's hardware info **not** in the drive report | Same | Report builder | V1 |
| "Hardware details" shows **only drive info**: model, serial, sectors, interface, average read/write speed, etc. | Same fields | Report builder | V1 |
| **Logical drives** removed; **physical drives** shown | Same | Drive list | V1 |
| Each drive erased and reported separately | Same | Engine | V1 |
| Works with **Bootable Asset Report** and **Fingerprint** | Same ([README §13.7–13.8](README.md)) | Engine | V1 |
| **Common CF for all drives**: updating one updates every drive report (e.g. "Erasure technician") | Same field scope `common` | Field flag | V1 |
| **CF for each drive**: updates only that drive's report (e.g. "Drive ID") | Same field scope `per_drive` | Field flag | V1 |
| **Default values removed when "Per Drive" is used** | Same | Engine clears defaults on per-drive fields | V1 |
| **Hot-plugging** supported for SATA, USB, NVMe | Same | `udev` events → drive list refresh | V1 |
| **Hot-plugging** supported for SCSI, SAS, FC (Fibre Channel) | Same | `udev` | Later (servers) |
| Option must be **turned on in the CT** | Same (Stick setup page) | — | V1 |

### B.2 Erasure step in RPD mode (§10.1, p.138)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Works like normal erasure with **two extra actions** (own button and shortcut): Report and Edit Custom fields | Same two buttons | V1 |

#### Report — Ctrl+Alt+R (§10.1.1, p.138)
| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Opens reports for **all selected drives**; **Ctrl+Alt+R** or Report icon | Same | V1 |
| Reports can be **Saved (Ctrl+S)** or **Sent (Ctrl+N)** | Same | V1 |
| **Close (Esc)** | Same | V1 |

#### Custom fields — Per Drive — Ctrl+Alt+E (§10.1.2, pp.138–139)
| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Opens per-drive custom fields for all selected drives; **Ctrl+Alt+E** or Custom fields icon | Same | V1 |
| Saved with **Update (Ctrl+D)**; dialog shows **how many drives and their IDs** | Same | V1 |
| In **Workflow mode**, opening a per-drive field **highlights the drive being updated** | Same | V1 |
| **Close (Esc)** | Same | V1 |
| Changes **only per-drive** fields; common ones in the Custom fields step | Same | V1 |

### B.3 Status icons for each drive (§10.2, pp.139–140)
NexWipe draws its own icons (no copying Blancco's images), one icon slot per kind with three states each.

| Icon | State | NexWipe builds (same) | Phase |
|---|---|---|---|
| Report sending/saving | Report **not sent or saved** | Grey document icon | V1 |
| | Report **sent or saved successfully** | Green document icon with tick | V1 |
| | **Problem saving or sending** | Red document icon with "!" | V1 |
| Per-drive custom fields | **Not updated** | Grey form icon | V1 |
| | **Updated** | Green form icon with tick | V1 |
| | **Update failed** | Red form icon with "!" | V1 |

### B.4 Custom fields step in RPD mode (§10.3, p.140)

| Blancco does | NexWipe builds (same) | Phase |
|---|---|---|
| Edits the **common** custom fields, as in Part A | Same | V1 |

### B.5 Report Viewer (§10.4, pp.140–141)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Select one or more report files; **send to BMP** or **export to USB**; **view** in HTML or PDF | Same on-device viewer; until then, the web app's report library does view/export/search for all sent reports | On-device: kiosk page reading the local report store | Later (device) / V1 (web app library) |
| Needs **BDE or BDV installed directly on the device** | Same: needs NexWipe Eraser permanently installed (plan step 3 [permanent-installation.md](../03-booting/permanent-installation.md)) | — | Later |
| **"Report viewer" tab** next to Custom fields; labelled "Report" if not installed | Same labelling rule | Screen | Later |
| Checkboxes select several files; listed **newest first** | Same | Screen | Later |
| **Export**: to USB, choose location and format (**PDF, XML, CSV**) | Same three formats | Engine export | Later |
| **Delete**: **permanent**, after confirmation | Same (on the device only; copies already sent to the web app stay append-only there) | Screen | Later |
| **Send**: to BMP **only if configured**; progress bar and success/failure messages | Same | Agent API | Later |

---

## Shortcut summary

| Shortcut | Where | Action | Ref | NexWipe (same) | Phase |
|---|---|---|---|---|---|
| Alt+M | Main screen (Custom field editor workflow action) | Open or minimise the custom field list | §4.4.2.1.1, p.51 | Same | V1 |
| Ctrl+D | Custom fields step; per-drive custom field dialog | Update (validate and save) | §4.4.2.2, p.51; §10.1.2, p.138 | Same | V1 |
| Ctrl+Alt+R | RPD Erasure step | Open reports for the selected drives | §10.1.1, p.138 | Same | V1 |
| Ctrl+S | RPD report window | Save the reports | §10.1.1, p.138 | Same | V1 |
| Ctrl+N | RPD report window | Send the reports | §10.1.1, p.138 | Same | V1 |
| Ctrl+Alt+E | RPD Erasure step | Open per-drive custom fields for the selected drives | §10.1.2, p.138 | Same | V1 |
| Esc | RPD report and custom field windows | Close | §10.1.1–10.1.2, pp.138–139 | Same | V1 |

Note: Chromium in kiosk mode may reserve some Ctrl shortcuts (e.g. Ctrl+N opens a window, Ctrl+S saves the page); the kiosk
build must disable those browser defaults so the shortcuts reach the NexWipe screen (confirm in lab).

## Limits summary

| Limit (Blancco) | NexWipe (same) | Phase |
|---|---|---|
| Customer, operator and custom fields in the work area: **255 characters** (§4.4.2, p.49) | 255 | V1 |
| Normal entry custom field value: **1023 characters** (§4.4.2.1, p.50) | 1023 | V1 |
| Custom field name: **238 characters** (§4.4.2.1, p.50) | 238 | V1 |

Database: custom field definitions (per company) and values (per report/drive) need tables with `org_id` and RLS →
**migration needed**, shipped with the report tables from [README.md](README.md) §13.6.
