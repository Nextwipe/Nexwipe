# Wiping a laptop from a USB stick via NexWipe cloud — every step

Status as of 2026-11-26. Legend:
✅ built and working · 🟡 built, only tried in a virtual machine or in tests · ❌ not built yet

The goal is wiping. The stick is the "wire" between the laptop (patient) and NexWipe cloud (ICU monitor): once the laptop runs from the stick, the cloud always knows whether it is alive and hears about every error.

---

## A. Prepare the stick (once per stick, not per laptop)

1. 🟡 **Build the NexWipe boot system.** A small Linux system that runs from the stick (`agent-handoff/usb-image/build.sh`). It must be built on a Linux computer; the result is one ~1.5 GB file.
2. 🟡 **Write it onto a dedicated stick.** This erases the stick, so the stick must be used only for NexWipe. The stick ends up with two sections: a boot section and a small private section where the stick keeps its cloud login.
3. ❌ **Put the Windows helper on the same stick**, so one stick does both jobs (the in-Windows test and booting into NexWipe). Today these are separate.
4. ✅ **Connect the stick to your company in NexWipe cloud.** Create an enrollment code in the app; the stick uses it on first boot and stays logged in after that.

## B. Get the laptop to start from the stick

5. **Plug in the stick and the charger.** A wipe can take minutes to hours, and losing power during it is a real risk.
6. **Boot the laptop from the stick.** Two ways:
   - 🟡 **Way 1, Windows still works:** run Start NexWipe, click "Restart into NexWipe" in the cloud. The helper pauses BitLocker for one restart (❌ not built), tells the laptop to boot from the stick once, and restarts.
   - **Way 2, no Windows** (wiped, locked or broken; common with used laptops): press the boot-menu key at power-on and pick the USB stick. F12 on Dell, F9 on HP, F12 on Lenovo.
   - Way 2 works on every laptop, so it is the main way. Way 1 is a shortcut.
7. **The laptop's own startup screens (BIOS) run.** What can block us here:
   - The stick isn't bootable (what happened on the HP on 2026-11-14: "The selected boot device failed").
   - A BIOS password locks the boot menu.
   - Secure Boot refuses the stick. It shouldn't: the boot system uses Debian's Microsoft-signed chain.
   - The laptop is in old "Legacy" mode instead of UEFI.
8. **The silent gap, about 30–90 seconds.** Nothing from the stick runs during this time, so the cloud can't hear from it. ❌ The cloud starts a timer, and if the stick doesn't check in within a few minutes it shows "Laptop didn't come back, check its screen."

## C. The stick is running — the "ICU wire" is connected

9. 🟡 **The NexWipe system starts** from the stick (about 30–60 s), connects to Wi-Fi or a network cable, sets its clock and logs in to the cloud.
10. 🟡 **It reports the laptop:** serial number, model and every internal drive. ❌ The cloud matches this to the same laptop record that Windows reported earlier.
11. 🟡 **Heartbeat every 30 seconds.** This is the wire: the cloud always knows whether the laptop is alive. If the heartbeats stop, the laptop shows as disconnected.

## D. Checks before the wipe (nothing is changed yet)

12. 🟡 **Identify each internal drive:** type (NVMe, SATA SSD or hard disk), model, serial and size. The stick itself is always excluded.
13. 🟡 **Find out which erase methods each drive supports.** Drives have built-in erase commands, and NexWipe uses those.
14. ❌ **Detect what would block a wipe.** Every one of these is reported, and the wipe stops:
    - **Frozen drive:** the laptop locked the SATA drive's security commands. Fixed by putting the laptop to sleep for a moment and waking it.
    - **Drive protected by a password.**
    - **RAID / Intel RST / VMD mode:** the laptop hides the real drive behind a controller.
    - **Hidden areas on the drive (HPA/DCO):** sections a normal wipe would miss.
15. ❌ **The cloud picks the method for each drive** from the company's wipe policy, for example NVMe → Sanitize, SATA SSD → Sanitize or Secure Erase, hard disk → overwrite. These follow NIST 800-88, the usual US guideline for wiping drives.

## E. Permission (two locks)

16. ❌ **A technician clicks Erase on the laptop in the cloud.** They must be signed in with their two-step code. The cloud creates a "wipe job" naming the exact drive serial and the allowed method.
17. ❌ **The stick picks up the job** on its next heartbeat.
18. ❌ **The stick reads the drive serial again** and refuses the job if it doesn't match.
19. ❌ **Someone at the laptop confirms on its screen** by typing the last 4 characters of the drive serial, so nobody can wipe a laptop remotely by mistake.
20. **Point of no return.**

## F. The wipe

21. ❌ **The stick sends the erase command to the drive.** The drive erases itself.
22. ❌ **Progress goes to the cloud on every heartbeat.** NVMe drives report a percentage; SATA drives only give an estimated time.
23. ❌ **When something goes wrong:**
    - **Network drops:** the wipe carries on (it can't be stopped once started). The stick keeps a local log and sends it when the network is back.
    - **Power is lost:** some drives restart the erase by themselves. The stick reports "interrupted", never "success".
    - **The drive errors or disappears:** reported, and the job is marked failed.

## G. Proof that it worked

24. ❌ **Verify, as a separate step.** Read back parts of the drive and confirm the old data is gone. A command saying "done" is not proof.
25. ❌ **Build an evidence bundle:** drive identity before and after, commands sent, the drive's answers, timestamps, and the versions of the boot system and tools. The stick signs it and uploads it.

## H. Close out

26. ❌ **A reviewer approves the job** in the cloud.
27. ❌ **The certificate of erasure is created.** Only real, verified jobs get one; tests and simulations never do.
28. 🟡 **The laptop moves to "Wiped", then "Ready for sale"**, and the tag is printed.
29. **Pull the stick and power off.** The laptop now has no operating system.

## I. Before wiping any customer laptop

30. ❌ **Practice on throwaway drives first.** Labelled test drives with no real data; each method run at least 3 times per drive model; each drive checked on a separate computer to confirm nothing can be recovered. Only then does a method count as "supported" for that drive model. Details: `agent-handoff/MILESTONES.md` (Stage 2).

---

## Where we are

Most of A–D is built, but only tried in a virtual machine. E–H are not built.

**Next baby step:** steps 1, 2, 6 (Way 2) and 9–11 on one real laptop — a dedicated stick, F12, the station appears in the cloud and keeps its heartbeat. That is the first time the wire is connected on real hardware. Record it in `agent-handoff/PHYSICAL_TEST_CHECKLIST.md`.

**Open question:** building the stick needs a Linux computer (or Docker / a virtual machine on the Mac).
