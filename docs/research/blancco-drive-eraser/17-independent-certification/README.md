# Step 17 — Independent certification (Common Criteria EAL2)

## In short
Blancco Drive Eraser v6.9.1 was evaluated under the Australasian Information Security Evaluation Program by
Teron Labs (completed 24 May 2020, report dated 3 June 2020) at **EAL2**, a basic assurance level. The evaluated
configuration is stricter than Blancco's defaults (100% verification, hidden-area and remapped-sector removal on).

## 17.1 Identification
- TOE (target of evaluation): Blancco Drive Eraser v6.9.1. Security Target v6.0, 22 May 2020. ETR EFT-T008-ETR 1.0.
- Criteria: Common Criteria v3.1 Rev 5, Parts 2 and 3 conformant; conformance EAL 2.
- Developer: Blancco Technology Group, Joensuu, Finland. Evaluator: Teron Labs Pty Ltd, Deakin ACT, Australia.

## 17.2 Description of the product (as the evaluators state it)
- Delivered as an `.iso` that boots a computer connected to the drives. "The software runs in RAM … to analyse the
  attached data drive(s), erase the information on the data drive(s) and check the erasure activities for success or failure."
- Supports proprietary and standard algorithms; takes steps to ensure correct functioning on the hardware; generates
  "reports that are protected from tampering".
- Use: local (screen + keyboard) or remote (UI via Blancco Management Console).
- Licensing: through BMC, a HASP dongle, or a TOE configured to use BIOS time settings.

## 17.3 Evaluated configuration
Default install plus the Common Criteria Guidance Supplement (v4.0):
- Erase remapped sectors **on** and Fail erasure if not supported **on**.
- Remove hidden areas **on**.
- Enforce Blancco SSD method on SSDs **on**.
- Preserve recovery partition **off**.
- Execute self-tests on drives = **extended**, Fail erasure if unsuccessful **on**.
Algorithms in scope: Blancco SSD Erasure, CESG CPA Higher Level, DoD 5220.22-M, DoD 5220.22-M ECE, NIST 800-88 Clear,
NIST 800-88 Purge, HMG IS5 Higher, HMG IS5 Lower.

## 17.4 Recommendations from the certification authority
- Operate in the evaluated configuration and understand the environment assumptions.
- Configure verification **at 100% rather than the default 1%**, "commensurate with the importance of the completeness".
- Read the guidance and all security warnings; check and understand all drive erasure reports.
- Verify the SHA-256 of the downloaded software before use; inspect tamper-evident packaging for physical delivery.
- Understand the implications of NIST 800-88 Clear fallback and possible RAID interference.

## 17.5 Assumptions about the environment
- The user "is not negligent or hostile" and follows enterprise security policies.
- The hardware running it "is trustworthy and functioning as expected".
- The Configuration Tool (DECT) is authentic.
- The management console (when used) is authentic.

## 17.6 Testing done
Evaluators analysed the developer's tests (coverage, plans, expected vs actual results) and re-ran a sample; all
Security Functional Requirements were exercised. Vulnerability analysis including public information; penetration
tests considered elapsed time, expertise, knowledge of the TOE, window of opportunity, equipment.

## 17.7 What this does and doesn't mean
- It certifies an old version (6.9.1) in a specific configuration, not today's 7.21.0 with defaults.
- EAL2 = structurally tested; it is not a forensic proof that every drive model is fully sanitised.
- Other certifications Blancco cites (e.g. ANSSI CSPN in France) could not be read (404).
