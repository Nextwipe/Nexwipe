# Before we start — Build a test lab

## Goal
A set of laptops and **throw-away drives** to develop and test on. Wiping is destructive, so nothing is ever tested on a
drive that holds real data — not the owner's, not a customer's, not family laptops with personal files.

## Why
Blancco's real strength is that it works on thousands of laptop models. Most failures are model-specific (freeze-lock
wake-up, Secure Boot, storage mode, drive firmware quirks — research step 07 and 15). The only way to know is to test.

## What to collect
### Laptops (target 10 for version 1, 30–50 later)
At least: 2 Dell (Latitude), 2 HP (EliteBook/ProBook), 2 Lenovo (ThinkPad), 1 Microsoft Surface, 1 Intel Mac, 1 T2 Mac,
1 cheap laptop with eMMC storage. Mix of ages (2015–2024). Refurb stock that is going to be wiped anyway is ideal.

### Drives (all marked DISPOSABLE)
| Kind | How many | Why |
|---|---|---|
| SATA hard drive (HDD) | 3 | Overwrite standards, HPA/DCO tests, bad sectors |
| SATA SSD, different makers (Samsung, Crucial, Kingston…) | 4 | Secure Erase, Sanitize, freeze lock |
| NVMe SSD, different makers | 4 | NVMe Format, Sanitize, namespaces |
| Self-encrypting drive (Opal), e.g. Samsung 8xx/9xx with Opal | 2 | Crypto erase, PSID revert |
| Old / failing drive with bad sectors | 1–2 | Error handling |
| USB-to-SATA and USB-to-NVMe adapters | 2 | Check we refuse unreliable operations through adapters |

### Sticks
10 dedicated USB sticks labelled "NEXWIPE TEST" (never the owner's personal sticks).

## How to set it up
1. Label every drive with a sticker: `DISPOSABLE-NN`, make, model, serial. Record them in a spreadsheet (later in the app).
2. Before each test, fill the drive with a **known test file set** (plan step 17 describes it): text files, photos, a fake
   "customer" document with a unique marker string like `NEXWIPE-CANARY-<drive>-<date>`. After wiping we search for the marker.
3. For HPA/DCO tests, create a hidden area on an HDD on purpose (`hdparm -N`) and put marker data in it.
4. Keep a logbook per test: laptop, drive, BIOS version, settings, standard used, result, time taken, anything odd.

## Done when
10 laptops and the drives above are labelled and listed; marker-file procedure written down and tried once.

## Risks
- Mixing a disposable drive with a real one → the safety rules (safety-rules.md) make the eraser refuse drives not on the lab list in test mode.
- Cost: used drives and laptops are cheap; budget roughly for 15–20 drives.
