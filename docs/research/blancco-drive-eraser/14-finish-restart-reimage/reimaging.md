# Reimaging devices after erasure

**In short**
- BDE can put a fresh Windows image onto many machines at once after (or without) erasure, similar to Blancco Asset Reimaging (BAR) (§14, p.176).
- You need two things: Windows image network share(s) set in the Configuration Tool (CT), and a workflow containing the **Reimage** action (§14, p.176).
- At the end the machine must boot into Windows, which starts in audit mode and runs a "Post Reimaging" app to finish the job (§14.2, p.178).
- The erasure report gains a "Reimaging results" section, updated again after the Windows boot (§14.3, p.178).
- Source: Blancco Drive Eraser User Manual v7.21.0 (2026-10-27), chapter 14, pp.176–178; Reimage action from §13.4.1, p.153.

**Jargon used below**
- **Reimaging** – installing a ready-made operating system image onto a wiped drive so the device is ready to sell.
- **WIM** – Windows Imaging Format, Microsoft's file format for a captured Windows installation (`.wim`).
- **Network share** – a shared folder on another computer/server reached over the network (e.g. `\\server\images`).
- **CT** – Blancco Drive Eraser Configuration Tool (builds the boot image).
- **BAR** – Blancco Asset Reimaging, a separate Blancco product for reimaging.
- **MSC** – MDOS Smart Client, used for installing Windows licences (no further detail in these pages).
- **Digital product key / citizenship licence** – kinds of Windows licence that the reimaged machine needs. The manual does not define them further here; "citizenship" appears to relate to Microsoft refurbisher licensing programmes (unconfirmed).
- **Audit mode** – a special Windows start-up mode used by manufacturers/refurbishers to finish setup before the end user sees the "first run" screens.

---

## 1. Overview (§14, p.176)

Similar to Blancco Asset Reimaging (BAR), BDE can **reimage multiple devices at once**. It requires:
1. A network share configured in CT.
2. A workflow with the **Reimage** action (see [workflows.md](../06-process-modes-and-workflows/workflows.md)).

## 2. Configuration (§14.1, pp.176–177)

### 2.1 In the Configuration Tool (§14.1.1, p.176)

- At minimum, configure the **Windows images network share**. It is in the **Asset reimaging** menu.
- To copy drivers and let Windows install them on other devices, also fill in **"Windows drivers network share"**.
- Network share fields accept both **domain names and IP addresses**.
- The **MDOS Smart Client (MSC)** is used for installing **digital product keys** and **citizenship licences**.
- The **Asset reimaging tab is greyed out until the Process is set to "Workflow"**.

(Screenshots of the CT settings in manual.)

### 2.2 In the workflow (§14.1.2, pp.176–177)

- Prepare a workflow for reimaging. The manual shows a simple example (screenshot in manual); the **Erase action is not obligatory**.
- Some actions only work properly when paired with another action:

| Action | Must be paired with |
|---|---|
| Subworkflow | Collect results |
| Reimage | Send report |
| Enter PSID | Erase |
| Create custom erasure | Erase |
| Create custom field | Custom field editor |

### 2.3 The Reimage action itself (§13.4.1, p.153)

- Fetches a WIM image and reimages the machine with the WIM specified in the action.
- Supports both **citizenship licences** and **digital product keys**.
- Image selection options:

| Option | Behaviour |
|---|---|
| Prompt | If the shared folder path is configured correctly, a list of image names is shown in the UI at runtime. |
| Use variable | Image name is taken from a variable defined earlier (e.g. via a Set variable action). |
| Manual entry | You type the name of an image located in the shared folder. |

## 3. Usage (§14.2, pp.177–178)

1. After configuring CT and preparing the workflow, start the process.
2. If the Reimage action is set to **"Prompt"**, a pop-up appears.
3. Choose the `.WIM` image from the drop-down (lists images captured on a network share).
4. BDE starts reimaging. **It selects the first available drive to reimage.**
5. If reimaging succeeded, the **device card turns green**.
6. When BDE's part is finished, the machine **must be restarted and booted to Windows** — manually, or via the **restart option of the "Finish" action** — to finalise. Windows boots in **audit mode**, where the **Post Reimaging** application launches automatically to finish reimaging.

(Screenshots of each step in manual.)

Note from the workflow chapter (§13.4.2, p.158): Finish's Restart and Shutdown options are Computer-level only, and Shutdown wins if both are set — so to restart into Windows automatically, use a Computer-level workflow with only Restart ticked.

## 4. Reporting (§14.3, p.178)

- After reimaging finishes, the **data erasure report includes a "Reimaging results" section**.
- The report is **updated with more information after the device reboots to Windows**.
- Per §14.1.2, pair Reimage with a **Send report** action so the results reach the portal.
