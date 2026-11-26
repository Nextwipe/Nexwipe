# Org sticks — prepare once, copy to many, plug in and go (section A)

Status: design, 2026-11-26. Section A of `docs/plans/usb-wipe-roadmap.md`. Nothing here erases a laptop drive.

## Why

The owner wants NexWipe to work like Blancco at scale: an organisation has hundreds or thousands of USB sticks and
around 10 technicians on different laptops. A technician only plugs a stick into a laptop and starts it; the laptop
appears on every technician's board in that org; someone clicks Accept. Technicians never prepare sticks.

Today this fails because:
- every stick needs its own **single-use** enrollment code (`ndenr_…`), so copying one prepared stick to many does not work;
- the stick that runs the Windows helper is not bootable (HP, 2026-11-14: "The selected boot device failed"), and the
  bootable image is a separate stick that needs the server address and code typed in by hand.

How Blancco does it (sources in the conversation of 2026-11-26): the admin bakes the company's account into one eraser
image with their Configuration Tool, writes it to many sticks with their Windows USB Creator (erases the stick), and any
stick connects to the company's Management Console by itself.

## Goals

1. **One org image.** An org admin prepares the stick contents once; every stick written from it is identical and
   connects to that org by itself (no typing at the laptop).
2. **Copy to many.** The same contents go onto 10 / 100 / 1,000 sticks, by our Windows writer (several sticks at once)
   or by copying a finished master stick with a USB duplicator.
3. **Each stick is its own station.** On first use a stick registers itself and gets its own identity, so 1,000 copies
   show as 1,000 separately visible and separately revocable sticks.
4. **One stick does everything.** In Windows it shows Start NexWipe (tests, Restart into NexWipe); at power-on (F12)
   it boots the NexWipe system, which connects by itself and runs from RAM.
5. **Bootable is a checked prerequisite.** The helper refuses Restart into NexWipe if its stick cannot boot, and the
   app says "This stick can't start the laptop. Prepare it with Prepare USB stick first."

## Non-goals (this section)

- Restart into NexWipe button and Y/N prompt, BitLocker pause, "didn't come back" alarm, matching the booted stick's
  report to the laptop Windows reported (section B/C).
- Anything that erases or is authorised to erase a laptop drive. Stations stay **read-only** (`agents.read_only`).
- Mac support for writing sticks (Blancco offers none either); a manual Etcher guide is enough there.
- Network (PXE) boot; installing NexWipe onto the laptop's own drive (Blancco PreInstall-style) — later.

## Anti-goals (would be failure even if it works)

- The writer can pick or damage a disk that is not a USB stick (the PC's own drive, an external backup disk).
- A lost stick or a leaked org key lets someone act beyond reporting hardware into that org, or cannot be shut off.
- Cloned sticks share one identity, so Rescan / Restart / tests go to the wrong laptop.
- Any UI claims a stick or laptop is "verified", or shows simulated/unbuilt work as available.

## Constraints (from AGENTS.md and the project)

- Migrations only through Lovable by the owner; each ships with a rollback and a local rehearsal; `tests/db` re-run.
- Enrollment, credentials and revocation live in SQL RPCs; the app UI is not the security boundary.
- `agent-handoff/` must never contain erasing tools → the stick writer lives outside it (`stick-writer/`).
- Stations enroll read-only; only trusted server code may unlock one.
- Production links only from `src/lib/app-origins.ts`.
- Org is on Lovable Pro. GitHub repo is being made private.

## Approaches considered

| | Approach | Trade-off | Chosen |
|---|---|---|---|
| 1 | App copies boot files onto an existing FAT32 stick, nothing erased | One click in the browser, keeps the stick's files; needs FAT32, per-stick | No — owner wants Blancco's model |
| 2 | Download image, write with balenaEtcher/Rufus | Works on any stick; second program; no org key in it | Fallback (Mac, manual) |
| 3 | **Our Windows writer erases and writes dedicated sticks with one org image (Blancco model)** | One tool, bulk, matches the market leader; we own a disk-erasing tool, so its disk checks are critical | **Yes** |

Org key handling: baked into the stick (Blancco model, zero typing) — chosen by the owner — rather than typed at each start.

## Design

### 1. Org stick key (database, one migration)

- New per-org **stick key**: created by an owner/admin (AAL2) in Agents & stations; stored only as a hash; shown once.
  Settings: label, optional expiry (default: none), optional max number of sticks.
- Multi-use: any stick holding it may register. Registration creates a normal **read-only** station with its own
  credential (existing 90-day expiry + rotation), linked to the key.
- **Revoke key** → no new registrations. **Disconnect all sticks of this key** → revokes every station registered with
  it (existing revocation behaviour). Single lost stick → revoke that station, as today.
- Wrong-key attempts are rate-limited server-side (per source and globally) so keys cannot be guessed.
- Existing single-use enrollment codes keep working unchanged.
- Enroll API (`POST /api/public/agent/v1/enroll`) accepts either `ndenr_…` (single-use) or the stick key; the station
  sends the stick's own serial so the server can show and de-duplicate it.

### 2. Stick contents and layout

- Generic boot image built by GitHub (A1, done): signed shim → GRUB → Debian kernel → read-only NexWipe system, plus the
  small `ND-STATE` partition for the stick's own credential.
- **Layout change:** the boot section must be visible to Windows (today it is an EFI System Partition, which Windows
  hides). Use a layout Windows mounts and UEFI laptops boot from — e.g. MBR with one FAT32 partition like Rufus, or GPT
  "basic data" — **verified** in the virtual PC and on a real laptop before it replaces the current layout.
- GRUB finds the stick by a marker file, not by partition label.
- On the visible section the writer adds: the Windows helper (`Start NexWipe.cmd`, `nexwipe.ps1`, `nexwipe-test.html`)
  and `nexwipe-setup.json` (server address from `app-origins.ts`, org stick key, org name for display).
- **Boot from RAM:** the boot menu loads the NexWipe system into memory (`toram`), so a pulled stick does not stop a
  running session; laptops without enough RAM fall back to running from the stick (behaviour to verify).

### 3. NexWipe Stick Writer (Windows, `stick-writer/`)

Downloaded from **Prepare USB stick** as a zip (writer + this org's `nexwipe-setup.json`). Run as administrator.
1. Lists **only** disks that are USB-attached and removable, not the Windows/boot/page-file disk, and ≤ 256 GB.
2. Admin ticks one or more sticks; the writer shows model, size and current volume names; admin types `ERASE`.
3. Downloads the current boot image from our storage (pieces in parallel, resumable, fingerprint-checked) once,
   caches it, then writes each selected stick, reads it back to verify, and copies helper + setup file onto it.
4. Prints a result per stick (OK / failed + reason). Has a `-SelfTest` mode like the helper (disk filter, checks).
- Master-stick route: a finished stick can be cloned by a USB duplicator; each clone registers itself on first use.

### 4. Image distribution

- On every successful build on `main`, GitHub uploads the image in pieces (≤ 45 MB each) plus `latest.json` (version,
  size, SHA-256 of whole image and of each piece) to a **private** storage bucket.
- The app's server function returns short-lived download links to signed-in org admins only; the writer uses them.
- Needs: one bucket migration (Lovable), one upload secret in GitHub (owner).

### 5. Connect by itself

- **Boot system:** at start, reads `nexwipe-setup.json` from the boot section; if not yet registered, registers with
  the stick key; saves its own credential in `ND-STATE` (existing encrypted storage bound to this stick). No typing.
- **Windows helper:** same file; its saved login is keyed by the stick's USB serial so cloned files never share an
  identity.
- Laptops then appear on the org's board and in the "Laptop connected" pop-up for every technician (built, 0027).

### 6. App

- Prepare USB stick: manage stick keys (create, revoke, disconnect all, uses count) and **Download Stick Writer**.
- Agents & stations lists sticks with the key they registered through.
- Nothing listed as available in the dashboard panel until verified on a real laptop.

### 7. Scale

- Windows helper checks in every 5 s; station heartbeats every 30 s. Before 1,000 sticks: idle check-in 15–30 s,
  load-test simulated sticks against the local database, confirm plan limits.

### 8. Decisions made after the builder check (designer's calls, reviewable)

- **Writer access.** "Download Stick Writer" is offered when a stick key is created (the key is shown once and is
  inside that zip; the admin keeps the zip and reuses it for later batches; a lost zip = create a new key). The writer
  asks the server for image download links **using the stick key itself**; the image holds no secrets, so any key
  holder may download it. No admin sign-in inside the writer.
- **One stick = one stick record.** The server keeps one *stick* per physical stick; the Windows helper and the boot
  system each keep their own credential (helper on the visible section, boot system encrypted in `ND-STATE`), both
  linked to that one stick. Max-sticks, uses count, "Disconnect all" and the UI count sticks, not credentials.
- **Stick identity = random stick ID created on first use**, written to the visible section (`nexwipe-stick-id`),
  never by the writer, so clones of an unused master each create their own. The USB serial is reported for display
  only (cheap sticks repeat or omit it). The `ND-STATE` encryption binding uses the stick ID instead of the serial.
  The writer warns before duplicating a stick that already has a stick ID. A stick ID seen from two laptops at the same
  time is flagged "possible copy" in the app; a known stick ID registering again gets a new credential and the old
  one is revoked (re-written or reset stick), without counting again toward the max.
- **Gated release.** GitHub uploads every `main` build as a *candidate*; it becomes the version the writer downloads
  only after a manual **promote** step, done after the build has booted in the virtual PC (`latest.json` points at the
  promoted version). Per-org version pinning: later.

- **Storage (owner, 2026-11-26): Lovable storage only, no service role key.** GitHub uploads through our own upload
  endpoint in the app, authenticated by a random `STICK_UPLOAD_TOKEN` we generate: kept as a Lovable secret if possible,
  otherwise only its hash is stored in the database via the migration. The token can only upload stick files. The real
  token lives in GitHub Actions secrets only. Fallback if Lovable storage refuses the size: Cloudflare R2.
- **Network (owner, 2026-11-26): both.** Cable always works with no setup (DHCP, as today). Wi-Fi is optional: the admin
  types a network name and password when preparing sticks, and they go only into that batch's `nexwipe-setup.json`
  (never stored in our database). The boot system joins it at start; the station screen's W key still works. Because
  anyone holding a stick can read that file, the app advises a separate bench/guest Wi-Fi, not the office network.
- **Second section and Windows:** Windows may offer "You need to format the disk" for the `ND-STATE` section it cannot
  read. Step 1 checks this on real Windows; if it happens, the boot system keeps its credential as an encrypted file on
  the visible section instead and `ND-STATE` is dropped (one section only).

## Order of work

1. Stick layout change + `toram` + marker-file GRUB (verify in virtual PC).
2. Org stick key migration + enroll API + tests (rollback, rehearsal, `tests/db`).
3. Boot system and helper read `nexwipe-setup.json` and self-register.
4. Image upload to private storage + download links.
5. Stick Writer + self-test.
6. App: keys + Download Stick Writer.
7. Real test: owner's Windows laptop writes a spare stick; boot a laptop by F12 and via Start NexWipe; laptop appears.

## Testing

- Virtual PC (QEMU on the Mac): new layout boots; `toram`; self-registration against the local app/database.
- `tests/db`: stick key create/revoke/expiry/max uses/rate limit, read-only enforcement, cross-org isolation.
- Writer self-test: disk filter refuses non-USB, system disk, > 256 GB; checksum mismatch stops writing.
- Real hardware: owner's Windows laptop + spare stick (the owner's personal sticks are never used).

## Left to the builder

Exact table/RPC names, key format, rate-limit numbers, piece size, writer UI wording, storage bucket name,
whether the writer is PowerShell or a small compiled program (PowerShell preferred: same as the helper).
