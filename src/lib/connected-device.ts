// Display helpers for the Connected devices pages. The payload is untrusted station input:
// every value is type-checked and length-capped here before it reaches the screen.
import { formatBytes } from "@/lib/queries";
import { summarizeCapabilities } from "@/lib/discovery";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
const arr = (v: unknown, max: number): Obj[] => (Array.isArray(v) ? v.slice(0, max).map(obj) : []);
const str = (v: unknown, max = 120): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const bool = (v: unknown, yes = "Yes", no = "No"): string | null =>
  v === true ? yes : v === false ? no : null;

export interface Row {
  label: string;
  value: string;
}
export interface Section {
  title: string;
  rows: Row[];
  items?: Row[][];
  empty?: string;
}

function rows(pairs: Array<[string, string | null]>): Row[] {
  return pairs
    .filter((p): p is [string, string] => p[1] !== null)
    .map(([label, value]) => ({ label, value }));
}

/** Battery health in percent: reported value, else full-charge / design capacity. */
export function batteryHealthPct(b: Obj): number | null {
  const h = num(b["health_pct"]);
  if (h !== null) return Math.round(h);
  const full = num(b["full_charge_capacity_mwh"]),
    design = num(b["design_capacity_mwh"]);
  return full !== null && design ? Math.round((full / design) * 100) : null;
}

const IFACE: Record<string, string> = {
  sata_hdd: "SATA HDD",
  sata_ssd: "SATA SSD",
  nvme_ssd: "NVMe SSD",
};

/** Short facts for one row of the Connected devices list. */
export function deviceSummary(payload: unknown) {
  const p = obj(payload),
    sys = obj(p["system"]),
    os = obj(p["os"]);
  const drives = arr(p["drives"], 16).filter(
    (d) => d["is_boot_medium"] !== true && d["removable"] !== true,
  );
  const storage = drives.reduce((t, d) => t + (num(d["capacity_bytes"]) ?? 0), 0);
  const bat = arr(p["batteries"], 4)[0];
  return {
    title:
      [str(sys["manufacturer"], 80), str(sys["model"])].filter(Boolean).join(" ") ||
      "Unknown laptop",
    cpu: str(sys["cpu"]),
    ram: num(sys["ram_bytes"]) ? formatBytes(num(sys["ram_bytes"])) : null,
    storage:
      storage > 0
        ? `${formatBytes(storage)} · ${drives.length} drive${drives.length === 1 ? "" : "s"}`
        : null,
    battery: bat ? batteryHealthPct(bat) : null,
    os: [str(os["name"]), str(os["version"], 60)].filter(Boolean).join(" ") || null,
  };
}

/** Where the report came from, from the station's enrolled platform. */
export function stationContext(platform: string | null | undefined): string {
  return platform?.toLowerCase().startsWith("windows")
    ? "Running inside Windows (NexWipe helper)"
    : "Booted from the NexWipe stick";
}

export function canRebootToUsb(platform: string | null | undefined): boolean {
  return !!platform?.toLowerCase().startsWith("windows");
}

/**
 * A Rescan/Reboot/test request blocks a new one only for 2 minutes after its last status change —
 * the same window the database uses — so a request the laptop never answered cannot lock the button.
 */
export function isCommandPending(
  status: string | null | undefined,
  statusAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (status !== "requested" && status !== "delivered") return false;
  const t = statusAt ? Date.parse(statusAt) : NaN;
  return Number.isFinite(t) && now - t < 120_000;
}

/** The complete test suite needs NexWipe for Windows 0.6.2 or newer (older helpers restart or ignore it). */
export const SUITE_MIN_HELPER = "0.6.2";
export function helperRunsSuite(version: string | null | undefined): boolean {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
  if (!m) return false;
  const have = Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]);
  const [a = 0, b = 0, c = 0] = SUITE_MIN_HELPER.split(".").map(Number);
  return have >= a * 1e6 + b * 1e3 + c;
}

/** A station is online when its last heartbeat is recent. The boot-stick station heartbeats every 30 s. */
export function isOnline(lastHeartbeat: string | null | undefined, now = Date.now()): boolean {
  if (!lastHeartbeat) return false;
  const t = Date.parse(lastHeartbeat);
  return Number.isFinite(t) && now - t < 90_000;
}

export type StickRow = {
  id: string;
  agent_id: string;
  device_code: string | null;
  reported_at: string | null;
  last_reported_at: string | null;
  agents: { status: string | null; last_heartbeat_at: string | null } | null;
};

const ms = (t: string | null | undefined) => Date.parse(t ?? "") || 0;

/** Each stick's most recently reported laptop (a stick is on one laptop at a time). */
function latestPerStick<T extends StickRow>(rows: T[]): Map<string, T> {
  const latest = new Map<string, T>();
  for (const r of rows) {
    const cur = latest.get(r.agent_id);
    if (!cur || ms(r.last_reported_at) > ms(cur.last_reported_at)) latest.set(r.agent_id, r);
  }
  return latest;
}

/**
 * Laptops connected right now: each active, online stick's most recently reported laptop (a stick
 * is on one laptop at a time, so older laptops it reported are not connected any more). The same
 * laptop on two sticks appears once (newest report). Newest first.
 */
export function connectedLaptops<T extends StickRow>(rows: T[], now = Date.now()): T[] {
  const latest = latestPerStick(rows);
  const byLaptop = new Map<string, T>();
  for (const r of latest.values()) {
    if (r.agents?.status !== "active" || !isOnline(r.agents?.last_heartbeat_at, now)) continue;
    const key = r.device_code ?? r.id;
    const cur = byLaptop.get(key);
    if (!cur || ms(r.last_reported_at) > ms(cur.last_reported_at)) byLaptop.set(key, r);
  }
  return [...byLaptop.values()].sort((a, b) => ms(b.last_reported_at) - ms(a.last_reported_at));
}

/**
 * Where a stick stands relative to one of the laptops it reported. "moved": it reported another
 * laptop since. "misfiled": it is back on this laptop, but the server files test results under the
 * stick's laptop with the newest *first* report (migrations 0024-0026), which is another laptop.
 */
export function stickPosition(
  stickRows: Array<{ id: string; reported_at: string | null; last_reported_at: string | null }>,
  discoveryId: string,
): "current" | "moved" | "misfiled" {
  const top = (k: "reported_at" | "last_reported_at") =>
    stickRows.reduce<(typeof stickRows)[number] | null>((m, r) => (!m || ms(r[k]) > ms(m[k]) ? r : m), null)?.id;
  if (top("last_reported_at") !== discoveryId) return "moved";
  return top("reported_at") === discoveryId ? "current" : "misfiled";
}

type DiscoveryLike = StickRow & { device_id: string | null };

/**
 * One card per laptop. The same laptop (same device code) reported by several sticks collapses to a
 * single entry: the representative is an online stick if any (so Add/actions work), else the most
 * recent report; the laptop is online if a stick is on it now (connectedLaptops); `linked` is any
 * report already in inventory; `sticks` is how many reported it. Cards are ordered by most recent report.
 */
export function groupLaptopCards<T extends DiscoveryLike>(rows: T[], now = Date.now()) {
  // A row is online when it is its stick's latest laptop and the stick is online (an older laptop the
  // stick moved away from is not). Two sticks on the same laptop both count, so either can act.
  const latest = latestPerStick(rows);
  const onlineIds = new Set(
    [...latest.values()]
      .filter((r) => r.agents?.status === "active" && isOnline(r.agents?.last_heartbeat_at, now))
      .map((r) => r.id),
  );
  const onlineOf = (r: T) => onlineIds.has(r.id);
  const byReport = (a: T, b: T) =>
    Date.parse(b.last_reported_at ?? "") - Date.parse(a.last_reported_at ?? "");
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const key = r.device_code ?? r.id;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }
  const out = [...groups.values()].map((g) => {
    const rep = [...g].sort((a, b) => {
      const ao = onlineOf(a),
        bo = onlineOf(b);
      if (ao !== bo) return ao ? -1 : 1;
      return byReport(a, b);
    })[0]!; // groups are never empty
    return {
      rep,
      anyOnline: g.some(onlineOf),
      linked: g.find((r) => r.device_id) ?? null,
      sticks: g.length,
    };
  });
  out.sort((a, b) => byReport(a.rep, b.rep));
  return out;
}

/** Every section on the device detail page, in display order. */
export function deviceSections(payload: unknown): Section[] {
  const p = obj(payload),
    sys = obj(p["system"]),
    os = obj(p["os"]),
    sec = obj(p["security"]),
    st = obj(p["station"]);
  const ram = num(sys["ram_bytes"]);
  const out: Section[] = [
    {
      title: "System",
      rows: rows([
        ["Manufacturer", str(sys["manufacturer"], 80)],
        ["Model", str(sys["model"])],
        ["Serial number", str(sys["serial"])],
        ["SKU", str(sys["sku"])],
        ["Chassis", str(sys["chassis"], 60)],
        ["Asset tag (firmware)", str(sys["asset_tag"])],
        ["System UUID", str(sys["uuid"], 64)],
        ["Motherboard", str(sys["board"])],
      ]),
    },
    {
      title: "Processor",
      rows: rows([
        ["CPU", str(sys["cpu"])],
        ["Cores", num(sys["cpu_cores"])?.toString() ?? null],
        ["Threads", num(sys["cpu_threads"])?.toString() ?? null],
      ]),
    },
  ];

  const mods = arr(p["memory_modules"], 32);
  out.push({
    title: "Memory",
    rows: rows([
      ["Total", ram ? formatBytes(ram) : null],
      ["Modules", mods.length ? String(mods.length) : null],
    ]),
    items: mods.map((m) =>
      rows([
        ["Slot", str(m["slot"], 60)],
        ["Size", num(m["size_bytes"]) ? formatBytes(num(m["size_bytes"])) : null],
        ["Type", str(m["type"], 40)],
        ["Speed", num(m["speed_mhz"]) ? `${num(m["speed_mhz"])} MHz` : null],
        ["Manufacturer", str(m["manufacturer"], 80)],
        ["Part number", str(m["part_number"], 80)],
        ["Serial", str(m["serial"], 80)],
      ]),
    ),
  });

  const drives = arr(p["drives"], 16);
  out.push({
    title: "Storage",
    rows: [],
    empty: "No drives reported",
    items: drives.map((d) =>
      rows([
        ["Model", str(d["model"])],
        ["Serial", str(d["serial"])],
        ["Type", IFACE[String(d["interface"])] ?? "Unsupported / other"],
        ["Capacity", num(d["capacity_bytes"]) ? formatBytes(num(d["capacity_bytes"])) : null],
        ["Firmware", str(d["firmware"], 60)],
        ["Connection", str(d["transport"], 40)],
        [
          "Note",
          d["is_boot_medium"] === true
            ? "NexWipe stick · not recorded"
            : d["removable"] === true
              ? "Removable · not recorded"
              : null,
        ],
        ["Drive advertises", capabilityText(d)],
      ]),
    ),
  });

  const bats = arr(p["batteries"], 4);
  out.push({
    title: "Battery",
    rows: [],
    empty: "No battery reported",
    items: bats.map((b) => {
      const h = batteryHealthPct(b);
      return rows([
        ["Health", h !== null ? `${h}%` : null],
        ["Cycle count", num(b["cycle_count"])?.toString() ?? null],
        [
          "Design capacity",
          num(b["design_capacity_mwh"]) ? `${num(b["design_capacity_mwh"])} mWh` : null,
        ],
        [
          "Full-charge capacity",
          num(b["full_charge_capacity_mwh"]) ? `${num(b["full_charge_capacity_mwh"])} mWh` : null,
        ],
        ["Status", str(b["status"], 40)],
        ["Chemistry", str(b["chemistry"], 40)],
        ["Manufacturer", str(b["manufacturer"], 80)],
        ["Name", str(b["name"], 80)],
        ["Serial", str(b["serial"], 80)],
      ]);
    }),
  });

  out.push({
    title: "Graphics",
    rows: [],
    empty: "Not reported",
    items: arr(p["gpus"], 8).map((g) =>
      rows([
        ["Name", str(g["name"])],
        ["Memory", num(g["vram_bytes"]) ? formatBytes(num(g["vram_bytes"])) : null],
        ["Driver", str(g["driver_version"], 60)],
      ]),
    ),
  });
  out.push({
    title: "Network",
    rows: [],
    empty: "Not reported",
    items: arr(p["network_adapters"], 16).map((n) =>
      rows([
        ["Name", str(n["name"])],
        ["Type", str(n["kind"], 20)],
        ["MAC address", str(n["mac"], 40)],
      ]),
    ),
  });

  const bl = arr(sec["bitlocker"], 16).map(
    (v) => `${str(v["volume"], 20) ?? "?"} ${str(v["protection"], 10) ?? "unknown"}`,
  );
  out.push({
    title: "Firmware & security",
    rows: rows([
      ["Boot mode", str(sys["boot_mode"], 20)?.toUpperCase() ?? null],
      ["Secure Boot", bool(sys["secure_boot"], "On", "Off")],
      ["BIOS vendor", str(sys["bios_vendor"], 80)],
      ["BIOS version", str(sys["bios_version"], 80)],
      ["BIOS date", str(sys["bios_date"], 40)],
      [
        "TPM",
        bool(
          sec["tpm_present"],
          str(sec["tpm_version"], 40) ? `Present (${str(sec["tpm_version"], 40)})` : "Present",
          "Not found",
        ),
      ],
      ["BitLocker", bl.length ? bl.join(" · ") : null],
    ]),
  });
  out.push({
    title: "Operating system",
    rows: rows([
      ["Name", str(os["name"])],
      ["Version", str(os["version"], 60)],
      ["Build", str(os["build"], 60)],
      ["Architecture", str(os["architecture"], 40)],
    ]),
    empty: "Not reported (booted from the NexWipe stick)",
  });
  out.push({
    title: "Reported by",
    rows: rows([
      ["Program version", str(st["agent_version"], 40)],
      ["Image version", str(st["image_version"], 60)],
      ["Kernel / OS", str(st["kernel"])],
    ]),
  });
  return out;
}

/** "Drive advertises" text: erase features from the drive's own identify data. Nothing has been run. */
function capabilityText(d: Obj): string | null {
  if (d["is_boot_medium"] === true || d["removable"] === true) return null;
  const c = summarizeCapabilities(d["capabilities"]);
  if (!c) return null;
  return c.unknown ?? [...c.advertised, ...c.notes].join(" · ");
}

/** Postgres "column/table does not exist": the database has not received migration 0018 yet. */
export function needsDbUpdate(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "42703" || code === "42P01";
}
