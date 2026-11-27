# Before we start — Safety rules for a tool that destroys data

## Goal
Make it impossible (not just unlikely) for the eraser to wipe the wrong thing: the boot stick, a technician's backup disk,
a laptop that wasn't meant to be wiped, or a drive whose data must be kept.

## Why
Blancco excludes its own stick by label, asks for confirmation before Erase, forbids pause during firmware commands,
and refuses some operations through adapters (research steps 05, 06, 08). We go further because we are new.

## Rules to build (in code and in the database)
1. **Never the boot stick.** The eraser finds its own stick by device ancestry (already done for the read-only station)
   **and** by a marker file; that disk can never be selected. Any stick labelled `NEXWIPE` is excluded like Blancco's `BLANCCO`.
2. **Removable media hidden by default** (USB sticks, SD cards). Showing them is a company setting.
3. **Two-key start.** An erasure starts only if (a) the technician confirms on the laptop screen ("Type ERASE" or a Yes
   dialog showing drive model + serial), **and** (b) the app has an authorised job for that drive, **or** the company's
   stick setup explicitly allows fully offline erasure. (Blancco only has (a); (b) fits NexWipe's existing job/approval system.)
4. **Allow-list of commands.** The eraser runs only command shapes on an allow-list, each bound to a drive the server
   authorised. Anything else is refused and logged. (Extends today's `nd_station/safety.py` idea.)
5. **No pause/cancel during firmware commands**; warn "do not power off" on screen; the laptop must be on mains power
   (refuse to start a firmware erase on battery below a threshold, configurable).
6. **Dry-run mode.** Every operation can run in "dry run": it prints exactly what it would do without doing it.
7. **Test-lab mode.** In development builds, only drives whose serial is on the lab list (test-lab.md) can be erased.
8. **Interrupted = not erased.** Power loss, crash or missing heartbeat is never reported as success.
9. **Audit everything.** Every command sent to a drive, with time and result, goes into the report's detail log.

## Changes to `AGENTS.md` (proposed text, only after owner decision 1)
Replace the read-only station rule with:
> "Read-only stations stay read-only. Eraser stations are a separate image and a separate station kind; only trusted
> server code can mark a station `can_erase`, after an owner/admin approves it in an AAL2 session. Eraser stations run
> only allow-listed commands against drives the server authorised, never the boot medium, and never report an
> interrupted or unverified erasure as Erased."
Also update `verify-image.sh`: the read-only image keeps refusing erase tools; the eraser image has its own check that
contains **only** the tools we allow (hdparm, nvme-cli, sg3_utils, sedutil-cli, mmc-utils) and nothing else (no mkfs on
arbitrary disks, no dd shell access for users).

## How to test
Automated tests that try to erase: the boot stick, an unauthorised drive, a USB disk, a drive during dry run, a drive not
on the lab list — all must be refused. Run on every build.

## Done when
All refusal tests pass and the owner has approved the AGENTS.md change.
