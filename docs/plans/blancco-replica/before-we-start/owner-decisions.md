# Before we start — Decisions only the owner can make

## Why this exists
Some choices change the whole direction or cost money. I (Claude) recommend; the owner decides. Work on the eraser
(plan steps 03–13) should not start until decisions 1 and 2 are made. Record the answers at the bottom of this file.

---

## Decision 1 — Allow destructive stations
**What it means:** today the rules say every station is read-only and the stick image contains no erase tools
(`AGENTS.md`: "Physical stations enroll read-only…", `verify-image.sh` refuses erase tools). An eraser can't exist under
those rules. We need a new, separate kind of stick: the **Eraser stick**, allowed to erase, under strict safety rules (safety-rules.md).
- **Option A (recommended):** keep today's read-only stick as is (testing/inventory), and add a separate Eraser image with
  its own build, its own allow-list, and stations marked `can_erase` only by trusted server code after owner approval.
- Option B: turn the existing stick into the eraser. Simpler, but one bug could make every stick dangerous.

## Decision 2 — How the screen on the laptop is built
Blancco shows a full graphical program on the laptop (plan step 04).
- **Option A (recommended):** a small local web app shown full-screen in Chromium ("kiosk"). Same skills as the website,
  easy to make look good, works with mouse, touch and keyboard.
- Option B: a native Linux app (Qt/GTK). Smaller and faster, but a second technology to learn.
- Option C: text screen only (like today's station). Cheapest, but not "exactly like Blancco".

## Decision 3 — How customers pay (licences / wipe credits)
Blancco charges one licence per erased drive (plan step 01, licences).
- **Option A (recommended):** prepaid wipe credits per company; one credit is *reserved* when an erasure starts and
  *used* only when a signed report with result "Erased" reaches the app; refunded if Not erased. Offline sticks get a
  signed "offline credit pack".
- Option B: monthly subscription with unlimited wipes.
- Option C: free (the "free replica" idea) — then billing is skipped, but the credit counting still helps abuse control.
Payment provider: decide later (Stripe is common).

## Decision 4 — Which outside proof to aim for first
Blancco shows a Common Criteria EAL2 certificate and others (plan step 17).
- **Option A (recommended):** first an independent **data-recovery lab test** of our wipes on a set of drives (cheaper,
  faster, gives a written report), then a formal evaluation (ADISA or Common Criteria) once the product is stable.
- Option B: go straight to a formal certification (6–12 months, expensive).

## Decision 5 — Scope of version 1
- **Option A (recommended):** laptops and desktops only (SATA/NVMe SSDs, hard drives, eMMC), Windows/Linux machines,
  Intel and T2 Macs later. Servers/RAID/data-centre extras (plan step 15) after version 1.
- Option B: everything Blancco does in version 1 (adds ~6 months).

---

## Answers (fill in)
| # | Decision | Owner's answer | Date |
|---|---|---|---|
| 1 | Destructive stations | **Yes, sticks may erase drives — option A.** A brand-new section in the NexWipe web app with "Prepare stick"; that stick carries everything needed and, started on a donor laptop, runs the whole Blancco-style flow. Today's stick/sections are left as they are | 2026-11-26 |
| 2 | Laptop screen technology | **A — graphical screen built like our website** (local web app, full-screen Chromium on the laptop being wiped) | 2026-11-26 |
| 3 | Payment model | **Free for now** (option C). Credit counting can come later | 2026-11-26 |
| 4 | First outside proof | **Parked for V2** | 2026-11-26 |
| 5 | Version 1 scope | **Any device that runs Windows, from any manufacturer** (Dell, HP, Lenovo, Acer, Asus, Surface, …), laptops first; desktops included at no extra cost (the customer is an IT warehouse that resells laptops and may not have desktops). Macs out (including Boot Camp). Not Chromebooks or servers | 2026-11-27 |

---

## Open questions raised while writing the mirror plan (2026-11-27)
| # | Question | Where | My recommendation |
|---|---|---|---|
| A | Are desktops included in V1 ("any device that runs Windows")? | step 15 | Yes — same eraser works |
| B | Are Macs running Windows (Boot Camp) excluded from V1? | step 15 | Yes, exclude (Macs need special handling) |
| C | Approve the new AGENTS.md wording that allows a separate eraser stick (read-only stick stays read-only) | step 18, `safety-rules.md` | Approve |
| D | Booting the eraser directly on Intel Chromebooks conflicts with the rule "Chromebooks never get drive-erasure jobs" — keep the rule? | step 15 `chromebooks.md` | Keep the rule; Chromebooks are Later anyway |
| E | Windows Autopilot check needs Microsoft partner/API access — pursue it? | step 06 `workflows.md` | Later; show as "Planned" |
| F | Crypto erase on Opalite/Pyrite/Ruby drives: Blancco's manual contradicts itself | step 07 | V1 only on Opal; others after lab proof |
| G | Verification default: Blancco 1% (NIST standards force 10%) | step 10 | Keep 1% for parity, with a one-click "Strict" preset (100%) |

### Owner's answers to A–G (2026-11-27)
"I like your recommended answers." Customer context: an IT warehouse that resells laptops.
- **A** Desktops: included (same eraser, no extra work), but laptops are the focus.
- **B** Macs: out, including Macs running Windows.
- **C** AGENTS.md: approved; wording improved and applied in `AGENTS.md` and `agent-handoff/AGENTS.md` (2026-11-27). `eraser/AGENTS.md` is written when the `eraser/` folder is created.
- **D** Keep "Chromebooks never get drive-erasure jobs".
- **E** Autopilot check: Later, shown as "Planned".
- **F** Crypto erase only on Opal drives in V1; Opalite/Pyrite/Ruby after lab proof.
- **G** Verification default 1% (same as Blancco) + one-click "Strict" preset with 100%.
