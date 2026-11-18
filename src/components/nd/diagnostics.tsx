import { useState } from "react";
import {
  Battery,
  Camera,
  CheckCircle2,
  CircleDashed,
  Keyboard,
  Laptop,
  LayoutGrid,
  Mic,
  Monitor,
  MousePointer2,
  PlugZap,
  Sparkles,
  Usb,
  Volume2,
  Wifi,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { ToneBadge, SimulatedBadge, type Tone } from "@/components/nd/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyboardMap } from "@/components/nd/keyboard-map";
import { formatDateTime } from "@/lib/queries";

export type DiagnosticResult = {
  id: number;
  test: string;
  outcome: string;
  result: unknown;
  detail: string | null;
  is_simulated: boolean;
  created_at: string;
  agents?: { name: string } | null;
};

type KeyboardPayload = {
  layout?: string;
  keys_registered?: string[];
  keys_flagged?: string[];
  extra_keys?: string[];
  note?: string;
};

type Part = KeyboardPayload & {
  outcome?: string;
  values?: Record<string, string | number | boolean | null>;
};

const OUTCOME: Record<string, { label: string; tone: Tone }> = {
  pass: { label: "Pass", tone: "success" },
  fail: { label: "Fail", tone: "danger" },
  incomplete: { label: "Incomplete", tone: "neutral" },
  skipped: { label: "Skipped", tone: "neutral" },
};

const TEST_LABEL: Record<string, string> = {
  keyboard: "Keyboard test",
  full: "Complete test suite",
};

// Same order and names as the station's test (agent-handoff/station/nd_station/hwtest.py).
const PART_LABEL: [string, string][] = [
  ["keyboard", "Keyboard"],
  ["display", "Display"],
  ["webcam", "Webcam"],
  ["microphone", "Microphone"],
  ["speakers", "Speakers"],
  ["touchpad", "Touchpad"],
  ["battery", "Battery"],
  ["charging", "Charging port"],
  ["wifi", "Wi-Fi"],
  ["ports", "USB ports"],
  ["hinges", "Hinges"],
  ["body", "Screen & case"],
];

const VALUE_LABEL: Record<string, string> = {
  health_pct: "health %",
  charge_pct: "charge %",
  cycles: "cycles",
  picture_detail: "picture detail",
  peak_level: "peak level",
};

function obj<T>(v: unknown): T {
  return (v && typeof v === "object" ? v : {}) as T;
}

/** Passed count and failed part names of a complete-suite result; null for other tests. */
export function suiteSummary(
  r: Pick<DiagnosticResult, "test" | "result">,
): { passed: number; failed: string[]; unfinished: string[] } | null {
  if (r.test !== "full") return null;
  const tests = obj<{ tests?: Record<string, Part> }>(r.result).tests ?? {};
  const parts = PART_LABEL.filter(([k]) => tests[k]);
  return {
    passed: parts.filter(([k]) => tests[k]!.outcome === "pass").length,
    failed: parts.filter(([k]) => tests[k]!.outcome === "fail").map(([, label]) => label),
    unfinished: parts
      .filter(([k]) => !["pass", "fail"].includes(tests[k]!.outcome ?? ""))
      .map(([, label]) => label),
  };
}

/** The keyboard part of a result: the whole result for "keyboard", result.tests.keyboard for "full". */
function keyboardOf(r: DiagnosticResult): KeyboardPayload | null {
  if (r.test === "keyboard") return obj<KeyboardPayload>(r.result);
  if (r.test === "full")
    return obj<{ tests?: { keyboard?: Part } }>(r.result).tests?.keyboard ?? null;
  return null;
}

function outcomeBadge(outcome: string | undefined) {
  const o = OUTCOME[outcome ?? ""] ?? { label: outcome ?? "?", tone: "neutral" as Tone };
  return <ToneBadge tone={o.tone}>{o.label}</ToneBadge>;
}

function valuesLine(values: Part["values"]): string {
  return Object.entries(values ?? {})
    .filter(([, v]) => v !== null && v !== "")
    .map(
      ([k, v]) =>
        `${VALUE_LABEL[k] ?? k.replace(/_/g, " ")}: ${v === true ? "yes" : v === false ? "no" : v}`,
    )
    .join(" · ");
}

const PART_ICON: Record<string, LucideIcon> = {
  keyboard: Keyboard,
  display: Monitor,
  webcam: Camera,
  microphone: Mic,
  speakers: Volume2,
  touchpad: MousePointer2,
  battery: Battery,
  charging: PlugZap,
  wifi: Wifi,
  ports: Usb,
  hinges: Laptop,
  body: Sparkles,
};

const TILE_TONE: Record<string, string> = {
  pass: "border-success/30 bg-success-soft text-success",
  fail: "border-danger/30 bg-danger-soft text-danger",
};

/** One plain-words verdict for a laptop's latest suite, from the suite's own outcome. */
export function suiteVerdict(
  r: Pick<DiagnosticResult, "test" | "outcome" | "result"> | null | undefined,
): { tone: Tone; label: string } {
  if (!r) return { tone: "neutral", label: "Not tested" };
  if (r.outcome === "pass") return { tone: "success", label: "All passed" };
  if (r.outcome === "fail") {
    const n = suiteSummary(r)?.failed.length || 1;
    return { tone: "danger", label: `${n} problem${n === 1 ? "" : "s"} found` };
  }
  return { tone: "warning", label: "Test not finished" };
}

function partDetail(k: string, p: Part): string {
  return k === "keyboard"
    ? `${p.keys_registered?.length ?? 0} keys registered` +
        (p.extra_keys?.length ? `, ${p.extra_keys.length} extra (Fn / media)` : "")
    : valuesLine(p.values);
}

/** Picture grid of the suite's parts: green pass, red fail, grey not finished. Tap a part for its details. */
function PartsGrid({ r, onKeyboardMap }: { r: DiagnosticResult; onKeyboardMap: () => void }) {
  const tests = obj<{ tests?: Record<string, Part> }>(r.result).tests ?? {};
  const parts = PART_LABEL.filter(([k]) => tests[k]);
  const [open, setOpen] = useState<string | null>(null);
  const sel = open ? tests[open] : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {parts.map(([k, label]) => {
          const p = tests[k]!;
          const Icon = PART_ICON[k] ?? CircleDashed;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={open === k}
              onClick={() => setOpen(open === k ? null : k)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-semibold transition-shadow ${TILE_TONE[p.outcome ?? ""] ?? "border-border bg-muted text-muted-foreground"} ${open === k ? "ring-2 ring-ring" : ""}`}
            >
              <Icon className="size-6" aria-hidden />
              {label}
              <span className="sr-only">: {OUTCOME[p.outcome ?? ""]?.label ?? p.outcome}</span>
            </button>
          );
        })}
      </div>
      {open && sel ? (
        <div className="space-y-1 rounded-md border border-border p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-foreground">
            {PART_LABEL.find(([k]) => k === open)?.[1]} {outcomeBadge(sel.outcome)}
          </p>
          {sel.note && (
            <p className={sel.outcome === "fail" ? "text-danger" : "text-muted-foreground"}>
              {sel.note}
            </p>
          )}
          {partDetail(open, sel) && (
            <p className="text-xs text-muted-foreground">{partDetail(open, sel)}</p>
          )}
          {open === "keyboard" && (sel.keys_registered?.length ?? 0) > 0 && (
            <Button variant="outline" size="sm" className="mt-1" onClick={onKeyboardMap}>
              <LayoutGrid /> View keyboard map
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Tap a part to see its details.</p>
      )}
    </div>
  );
}

/** Latest diagnostics for one laptop as a picture grid; earlier runs folded. Not an erasure outcome. */
export function DiagnosticResultsCard({
  results,
}: {
  results: DiagnosticResult[] | null | undefined;
}) {
  const [mapFor, setMapFor] = useState<DiagnosticResult | null>(null);
  if (!results || results.length === 0) return null;
  const mapKb = mapFor ? keyboardOf(mapFor) : null;
  const [latest, ...earlier] = results;
  const r = latest!;
  const v = r.test === "full" ? suiteVerdict(r) : null;
  const k = keyboardOf(r);
  const VIcon =
    v?.tone === "success" ? CheckCircle2 : v?.tone === "danger" ? XCircle : CircleDashed;
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        {v ? (
          <h2
            className={`flex items-center gap-2 text-lg font-semibold ${v.tone === "success" ? "text-success" : v.tone === "danger" ? "text-danger" : "text-foreground"}`}
          >
            <VIcon className="size-5" aria-hidden /> {v.label}
          </h2>
        ) : (
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Keyboard className="size-5" aria-hidden /> {TEST_LABEL[r.test] ?? r.test}{" "}
            {outcomeBadge(r.outcome)}
          </h2>
        )}
        {r.is_simulated && <SimulatedBadge />}
        <span className="ml-auto text-xs text-muted-foreground">
          {r.agents?.name ? `${r.agents.name} · ` : ""}
          {formatDateTime(r.created_at)}
        </span>
      </div>

      {r.test === "full" ? (
        <PartsGrid key={r.id} r={r} onKeyboardMap={() => setMapFor(r)} />
      ) : (
        k && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {k.keys_registered?.length ?? 0} keys registered
              {(k.keys_flagged?.length ?? 0) > 0 && (
                <span className="text-danger">
                  {" "}
                  · {k.keys_flagged!.length} flagged: {k.keys_flagged!.join(", ")}
                </span>
              )}
            </p>
            {(k.keys_registered?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={() => setMapFor(r)}>
                <LayoutGrid /> View keyboard map
              </Button>
            )}
          </div>
        )
      )}

      {earlier.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Earlier tests ({earlier.length})
          </summary>
          <ul className="mt-2 divide-y divide-border rounded-md border border-border">
            {earlier.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="text-foreground">
                  {e.test === "full"
                    ? suiteVerdict(e).label
                    : `${TEST_LABEL[e.test] ?? e.test}: ${OUTCOME[e.outcome]?.label ?? e.outcome}`}
                </span>
                {e.is_simulated && <SimulatedBadge />}
                <span className="ml-auto text-xs text-muted-foreground">
                  {e.agents?.name ? `${e.agents.name} · ` : ""}
                  {formatDateTime(e.created_at)}
                </span>
                {keyboardOf(e)?.keys_registered?.length ? (
                  <Button variant="ghost" size="sm" onClick={() => setMapFor(e)}>
                    <LayoutGrid /> Keyboard map
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-xs text-muted-foreground">
        Diagnostics never change a grade. A key registering means it was pressed, not that it feels
        good.
      </p>

      <Dialog open={!!mapFor} onOpenChange={(o) => !o && setMapFor(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Keyboard map{mapFor ? ` · ${formatDateTime(mapFor.created_at)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {mapKb && (
            <KeyboardMap
              registered={mapKb.keys_registered ?? []}
              faultyText={mapKb.note ?? null}
              flaggedIds={mapKb.keys_flagged ?? []}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
