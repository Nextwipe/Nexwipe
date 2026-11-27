# Plan — Step 17 — Independent certification (Common Criteria EAL2)

Mirrors: research [17-independent-certification/README.md](../../../research/blancco-drive-eraser/17-independent-certification/README.md)

## In short
Blancco Drive Eraser 6.9.1 was evaluated by an independent lab at Common Criteria **EAL2** (a basic assurance level).
NexWipe aims for the **same kind of evaluation in V2**, of a frozen NexWipe Eraser release in a stricter "evaluated
configuration" like Blancco's. Until then NexWipe **never claims any certification**. The V1 stand-in is our own
**marker testing** on every release (last section): fill lab drives with known markers, erase, and search the whole drive
with a separate tool — any marker found means the release fails, whatever our report said.

Jargon: **Common Criteria (CC)** = international standard for security evaluation of IT products; **EAL** = Evaluation
Assurance Level, 1 (lowest) to 7; **TOE** = Target of Evaluation, the exact product version evaluated; **Security Target**
= the developer's document saying what the product claims to do; **ETR** = the lab's Evaluation Technical Report.

## 17.1 Identification

| Blancco | NexWipe builds (same) | How | Phase |
|---|---|---|---|
| TOE: Blancco Drive Eraser v6.9.1 | TOE: one frozen NexWipe Eraser release (version fixed for the whole evaluation) | Release branch frozen; image SHA-256 published | V2 |
| Security Target v6.0, 22 May 2020 | NexWipe Security Target written by us (claims, threats, assumptions, security functions) | Document in `docs/certification/` | V2 |
| ETR EFT-T008-ETR 1.0 | n/a for NexWipe now — this is the lab's report; we will receive our own ETR from our lab | — | V2 |
| Criteria: Common Criteria v3.1 Rev 5, Parts 2 and 3 conformant; conformance EAL 2 | Same target level **EAL2**, Parts 2 and 3 conformant, under whichever CC version the chosen scheme currently accepts (confirm with the scheme) | Scheme choice | V2 |
| Developer: Blancco Technology Group, Joensuu, Finland | Developer: NexWipe | — | V2 |
| Evaluator: Teron Labs Pty Ltd, Deakin ACT, Australia (AISEP scheme) | An accredited CC lab, chosen in V2 (could be under AISEP or another national scheme) | Quotes from labs | V2 |

## 17.2 Description of the product (as the evaluators state it)

| Blancco (as evaluated) | NexWipe builds (same) | Phase |
|---|---|---|
| Delivered as an `.iso` that boots a computer connected to the drives; "runs in RAM … to analyse the attached data drive(s), erase the information … and check the erasure activities for success or failure" | Same: NexWipe Eraser image (written to a `NEXWIPE` stick by NexWipe Stick Creator) boots, runs in RAM, detects, erases and verifies (plan steps 3, 5, 9, 10, 11) | V1 (product) / V2 (evaluated) |
| Supports proprietary and standard algorithms | Same standard algorithms; NexWipe SSD method is public, not proprietary (plan step 9) | V1 |
| Takes steps to ensure correct functioning on the hardware | Same: self-checks at boot, drive support checks, re-identify drive after firmware commands | V1 |
| Generates "reports that are protected from tampering" | Same: signed reports + public Check page (plan step 13 §13.6) | V1 |
| Use: local (screen + keyboard) or remote (via Blancco Management Console) | Same: local kiosk screen, or remote via the NexWipe web app (plan step 4 / 6) | V1 |
| Licensing: through BMC, a HASP dongle, or BIOS time settings | NexWipe: wipe credits from the web app (no charge in V1; payment Later); offline credit packs signed by the web app; no dongle | V1 (credits) / Later (payment) |

## 17.3 Evaluated configuration
Blancco = default install plus the Common Criteria Guidance Supplement (v4.0). NexWipe builds the same as a one-click
**"Strict (evaluation) settings"** preset on the Stick setup page, available from V1, plus a guidance document in V2.

| Blancco setting in evaluated configuration | NexWipe preset (same) | Phase |
|---|---|---|
| Erase remapped sectors **on** | On | V1 |
| Fail erasure if not supported **on** | On | V1 |
| Remove hidden areas **on** | On | V1 |
| Enforce Blancco SSD method on SSDs **on** | "Use NexWipe SSD method on all SSDs" On | V1 |
| Preserve recovery partition **off** | Off | V1 |
| Execute self-tests on drives = **extended**, Fail erasure if unsuccessful **on** | Extended, Fail if unsuccessful On (`smartctl -t long`, `nvme device-self-test`) | V1 |
| (Recommendation 17.4) verification 100% | Preset also sets verification to 100% | V1 |
| Algorithms in scope: Blancco SSD Erasure, CESG CPA Higher Level, DoD 5220.22-M, DoD 5220.22-M ECE, NIST 800-88 Clear, NIST 800-88 Purge, HMG IS5 Higher, HMG IS5 Lower | Same 8 in scope (NexWipe SSD method in place of Blancco SSD Erasure); the preset limits allowed standards to these 8 | V1 (preset) / V2 (evaluated) |
| Guidance Supplement v4.0 | NexWipe guidance supplement document | V2 |

## 17.4 Recommendations from the certification authority

| Blancco (authority's advice) | NexWipe builds (same) | Phase |
|---|---|---|
| Operate in the evaluated configuration and understand the environment assumptions | Same advice in our guide; the preset (17.3) makes it one click; reports show "Strict settings: yes/no" | V1 |
| Configure verification **at 100% rather than the default 1%** | Same recommendation next to the slider (plan step 10 §10.8) | V1 |
| Read the guidance and all security warnings; check and understand all drive erasure reports | Same in the guide; web app highlights reports with exceptions | V1 |
| Verify the SHA-256 of the downloaded software before use | Same: SHA-256 of NexWipe Stick Creator and the eraser image published in the Prepare stick section; Stick Creator checks the image hash before writing | V1 |
| Inspect tamper-evident packaging for physical delivery | n/a in V1 — NexWipe does not ship physical sticks; if we ever do, same tamper-evident packaging | Later |
| Understand the implications of NIST 800-88 Clear fallback | Same: the Purge → Clear fallback switch explains that the report will then say Clear (plan step 8 §8.6) | V1 |
| Understand possible RAID interference | Same note in the guide | Later (servers) |

## 17.5 Assumptions about the environment

| Blancco assumption | NexWipe equivalent (same) | Phase |
|---|---|---|
| The user "is not negligent or hostile" and follows enterprise security policies | Same assumption written in our Security Target and guide | V2 (ST) / V1 (guide) |
| The hardware running it "is trustworthy and functioning as expected" | Same | V2 / V1 |
| The Configuration Tool (DECT) is authentic | Same for the Stick setup page and `nexwipe-setup.json`: the file is signed by the web app and the eraser refuses an unsigned or altered one | V1 |
| The management console (when used) is authentic | Same for the NexWipe web app: eraser talks only to allowed origins over HTTPS with certificate checks | V1 |

## 17.6 Testing done

| Blancco (what evaluators did) | NexWipe builds (same) | Phase |
|---|---|---|
| Evaluators analysed the developer's tests (coverage, plans, expected vs actual results) and re-ran a sample; all Security Functional Requirements exercised | Same preparation: we keep test plans with expected vs actual results for every security function (engine unit tests, `tests/db` checks, lab marker tests below) so a lab can analyse and re-run them | V1 (tests) / V2 (evaluation) |
| Vulnerability analysis incl. public information; penetration tests considering elapsed time, expertise, knowledge of the TOE, window of opportunity, equipment | Same: an independent penetration test of the eraser and web app before the evaluation | V2 |

## 17.7 What this does and doesn't mean

| Blancco fact | NexWipe rule (same honesty) | Phase |
|---|---|---|
| It certifies an old version (6.9.1) in a specific configuration, not today's 7.21.0 with defaults | Same honesty: if NexWipe is certified, we name the exact version and configuration, and never imply other versions are certified | V2 |
| EAL2 = structurally tested; not a forensic proof that every drive model is fully sanitised | Same statement in our docs; per-model proof comes from marker testing (below) | V1 |
| Other certifications Blancco cites (e.g. ANSSI CSPN in France) could not be read (404) | n/a — about Blancco's sources; NexWipe may consider ANSSI CSPN, ADISA product claims test or other schemes in V2 | V2 |
| (Until then) | NexWipe never says "certified", "independently validated" or "verified hardware"; reports say e.g. "NIST 800-88 Purge level reached — checked by NexWipe" | V1 |

## V1 stand-in: our own marker testing (not in the research — added as the V1 stand-in)
Runs on every release before it can be published. Only on DISPOSABLE lab drives ([test-lab.md](../before-we-start/test-lab.md)).

| Step | What we do | How | Phase |
|---|---|---|---|
| 1 | Fill each lab drive with known files containing unique marker strings and common file headers (photos, documents) | Script on a lab machine, writes markers across the whole drive incl. near the end | V1 |
| 2 | Erase with each standard in scope (at least the 8 from 17.3, all 33 over time) | NexWipe Eraser | V1 |
| 3 | Read the **whole** drive raw with a separate tool (not our engine) and search for every marker and file header | `dd`/`grep`-style independent checker on a different boot system | V1 |
| 4 | Any hit = release fails, even if our report said Erased | Release checklist | V1 |
| 5 | Run free recovery tools (PhotoRec, TestDisk) — expect nothing recoverable | Lab machine | V1 |
| 6 | Record drive model × standard × result in a "method support table"; publish it | Docs + web app | V1 |
| 7 | (V2) Send a set of NexWipe-wiped drives to an independent data-recovery lab for a written report | External lab | V2 |
