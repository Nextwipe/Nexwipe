# Plan — Reimaging devices after erasure

Mirrors: research [14-finish-restart-reimage/reimaging.md](../../../research/blancco-drive-eraser/14-finish-restart-reimage/reimaging.md)

**In short**
- NexWipe Eraser will be able to put a fresh Windows image onto many machines at once after (or without) erasure — the
  same job Blancco does. Whole feature is **Later** (fixed decision: reimaging is Later).
- Needs the same two things: Windows image network share(s) set on the "Prepare stick" page, and a workflow containing
  the **Reimage** action.
- At the end the machine boots into Windows audit mode and a small NexWipe "Post-reimage" app finishes the job.
- The report gains a "Reimaging results" section, updated again after the Windows boot.

**Jargon used below** (same terms as research, NexWipe meaning)
| Term in research | NexWipe equivalent | Phase |
|---|---|---|
| **Reimaging** – installing a ready-made OS image onto a wiped drive | Same meaning | Later |
| **WIM** – Microsoft's Windows Imaging Format (`.wim`) | Same format; NexWipe applies it with `wimlib-imagex apply` (open-source WIM tool for Linux; confirm in lab) | Later |
| **Network share** – shared folder reached over the network (e.g. `\\server\images`) | Same; eraser mounts it with `mount -t cifs` (SMB, the Windows file-sharing protocol), read-only | Later |
| **CT** – Configuration Tool | The "Prepare stick" page of the web app | Later |
| **BAR** – Blancco Asset Reimaging, separate Blancco product | n/a for NexWipe — no separate product; reimaging is part of NexWipe Eraser | Later |
| **MSC** – MDOS Smart Client, for installing Windows licences | NexWipe "licence helper" step inside the Post-reimage app; exact tool depends on the refurbisher's Microsoft programme (confirm with Microsoft refurbisher rules) | Later |
| **Digital product key / citizenship licence** – kinds of Windows licence the machine needs | Same two kinds supported; NexWipe never invents or shares keys — keys come from the company's own Microsoft allocation | Later |
| **Audit mode** – Windows start-up mode for refurbishers to finish setup before first-run screens | Same; image's `unattend.xml` boots to audit mode (confirm in lab) | Later |

---

## 1. Overview (§14, p.176)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Similar to BAR, BDE can reimage multiple devices at once | Many laptops reimaged at once, each from its own stick, all reading the same share | Each eraser mounts the share independently | Later |
| Requires 1. a network share configured in CT | Requires a share configured on the Prepare stick page | Setup file `reimage.images_share` | Later |
| Requires 2. a workflow with the Reimage action | Requires a workflow with the Reimage action ([workflows.md](../06-process-modes-and-workflows/workflows.md)) | Workflow engine | Later |

## 2. Configuration (§14.1, pp.176–177)

### 2.1 In the Configuration Tool (§14.1.1, p.176)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| At minimum, configure the Windows images network share, in the Asset reimaging menu | "Asset reimaging" section on the Prepare stick page; images share field required | Form + setup file; share password stored encrypted in the signed setup file, never shown again | Later |
| Optional "Windows drivers network share" to copy drivers and let Windows install them | Same optional drivers share field | Engine copies the drivers folder onto the new Windows drive (e.g. `C:\Drivers`) and the image's `unattend.xml` points Windows at it (confirm in lab) | Later |
| Share fields accept domain names and IP addresses | Same | Validation accepts `\\name\share` and `\\1.2.3.4\share` | Later |
| MSC used for installing digital product keys and citizenship licences | Licence helper inside Post-reimage app (see Jargon) | Windows app run in audit mode | Later |
| Asset reimaging tab is greyed out until Process is set to "Workflow" | Same: section greyed out unless process mode = Workflow | Form rule | Later |
| (Screenshots of CT settings in manual) | Our own page design; no copying of Blancco screens | Web app | Later |

### 2.2 In the workflow (§14.1.2, pp.176–177)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Prepare a workflow for reimaging; manual shows a simple example | Same; NexWipe ships a ready-made example "Reimage after erasure" workflow | Template in workflow editor | Later |
| The Erase action is not obligatory | Same: Reimage can run without Erase. Report then says plainly "No erasure performed" | Workflow validation allows it | Later |

Actions that must be paired (editor warns if the pair is missing):
| Action | Must be paired with | NexWipe builds (same) | Phase |
|---|---|---|---|
| Subworkflow | Collect results | Same pairing check (for "continue before completion") | V1 |
| Reimage | Send report | Same pairing check | Later |
| Enter PSID | Erase | Same pairing check | V1 |
| Create custom erasure | Erase | Same pairing check | V1 |
| Create custom field | Custom field editor | Same pairing check | V1 |

### 2.3 The Reimage action itself (§13.4.1, p.153)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Fetches a WIM image and reimages the machine with the WIM specified in the action | Same | Mount share → partition drive GPT (EFI + MSR + Windows) with `sgdisk` → `wimlib-imagex apply` → `bcdboot`-equivalent boot files copied from the image (confirm in lab) → hash-check the copy | Later |
| Supports citizenship licences and digital product keys | Same | Licence helper (Jargon) | Later |

| Option | Blancco behaviour | NexWipe builds (same) | Phase |
|---|---|---|---|
| Prompt | If the share path is configured correctly, a list of image names is shown at runtime | Same: eraser lists `*.wim` in the share and shows a pick list | Later |
| Use variable | Image name taken from a variable defined earlier (e.g. Set variable) | Same | Later |
| Manual entry | Type the name of an image in the shared folder | Same | Later |

## 3. Usage (§14.2, pp.177–178)

| # | Blancco does | NexWipe builds (same) | Phase |
|---|---|---|---|
| 1 | After configuring CT and the workflow, start the process | Same, after configuring the Prepare stick page and workflow | Later |
| 2 | If Reimage is set to "Prompt", a pop-up appears | Same pop-up on the laptop screen | Later |
| 3 | Choose the `.WIM` image from the drop-down (images on the share) | Same drop-down | Later |
| 4 | BDE starts reimaging; it selects the first available drive | Same rule, but "available" excludes the boot stick and all removable media (safety rule); screen shows which drive was chosen before writing | Later |
| 5 | If reimaging succeeded, the device card turns green | Same green card | Later |
| 6 | Machine must be restarted and booted to Windows — manually, or via the Finish action's restart option | Same two ways | Later |
| 6 | Windows boots in audit mode, where the Post Reimaging app launches automatically to finish | Same: NexWipe Post-reimage app (small Windows program placed by the engine, started from audit mode via `unattend.xml`; confirm in lab) installs licence, confirms drivers, reports back, then hands over to normal Windows setup | Later |
| — | (Screenshots of each step in manual) | Our own screens | Later |

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| Note (§13.4.2, p.158): Finish's Restart and Shutdown are Computer-level only | Same rule in our workflow engine | Validation | V1 |
| Shutdown wins if both are set | Same | Engine | V1 |
| So to restart into Windows automatically, use a Computer-level workflow with only Restart ticked | Same advice in the example template and help | Template | Later |

## 4. Reporting (§14.3, p.178)

| Blancco does | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| After reimaging, the erasure report includes a "Reimaging results" section | Same section: image name, image hash, target drive, start/end time, result | Report schema `reimaging` block (step 13) | Later |
| Report is updated with more information after the device reboots to Windows | Same: Post-reimage app sends Windows version, activation/licence result, driver status to the web app, which adds them to the same report (new signed version, old kept) | Agent API endpoint for post-reimage update | Later |
| Pair Reimage with a Send report action so results reach the portal | Same pairing (editor enforces, §2.2) | Workflow validation | Later |
