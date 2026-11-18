import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  DatabaseZap,
  Eraser,
  FlaskConical,
  Laptop,
  Package,
  Play,
  RefreshCw,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorBlock, LoadingBlock, Mono, errorMessage } from "@/components/nd/page";
import { SimulatedBadge, ToneBadge } from "@/components/nd/status-badge";
import { HardwareOriginBadge } from "@/components/nd/hardware-origin-badge";
import { DeviceBarcode, OnlineDot, SectionCard } from "@/components/nd/connected-device";
import { AddToInventoryDialog, type AddTarget } from "@/components/nd/station-discoveries";
import { useOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import {
  formatDateTime,
  useConnectedDevice,
  useDiagnosticResults,
  useLaptopHistory,
  useStickDiscoveries,
} from "@/lib/queries";
import { DiagnosticResultsCard, suiteSummary, suiteVerdict } from "@/components/nd/diagnostics";
import {
  canRebootToUsb,
  helperRunsSuite,
  isCommandPending,
  SUITE_MIN_HELPER,
  deviceSections,
  deviceSummary,
  isOnline,
  needsDbUpdate,
  stickPosition,
} from "@/lib/connected-device";
import { reviewFlags } from "@/lib/discovery";
import { tagFields } from "@/lib/device-tag";
import { DeviceTagDialog, GradeSelect } from "@/components/nd/device-tag-dialog";

export const Route = createFileRoute("/_authenticated/app/connected/$discoveryId")({
  staticData: { sitemap: false },
  component: ConnectedDevicePage,
});

const DIAGNOSTIC_STATUS: Record<string, string> = {
  requested: "Waiting for the laptop to pick up the test…",
  delivered: "Test sent: confirm with Y on the laptop, then follow the test window there",
  failed: "The test did not run on the laptop",
  expired: "The laptop did not pick up the test within 2 minutes",
};

/** One big action button with an optional small line under the label. */
function Tile({
  icon: Icon,
  label,
  sub,
  primary,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string | undefined;
  primary?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      variant={primary ? "default" : "outline"}
      disabled={disabled}
      onClick={onClick}
      className="h-auto min-h-24 flex-col gap-2 whitespace-normal py-4 text-base font-semibold [&_svg]:size-6"
    >
      <Icon aria-hidden />
      {label}
      {sub && <span className="text-xs font-normal opacity-80">{sub}</span>}
    </Button>
  );
}

function ConnectedDevicePage() {
  const { discoveryId } = Route.useParams();
  const { orgId, role } = useOrg();
  const qc = useQueryClient();
  const q = useConnectedDevice(discoveryId);
  const diag = useDiagnosticResults({ deviceCode: q.data?.device_code ?? null });
  const history = useLaptopHistory(q.data?.device_code ?? null);
  const stick = useStickDiscoveries(q.data?.agent_id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [tagOpen, setTagOpen] = useState(false);

  if (q.isLoading) return <LoadingBlock />;
  if (needsDbUpdate(q.error))
    return (
      <EmptyState
        icon={DatabaseZap}
        title="Waiting for a database update"
        description="Connected devices need database update 0018, which has not been applied to this database yet. The project owner applies it in Lovable; nothing is wrong with your data."
      />
    );
  if (q.error) return <ErrorBlock error={q.error} />;
  if (!q.data)
    return (
      <EmptyState
        icon={Laptop}
        title="Device not found"
        description="It may belong to another organization."
        action={
          <Button asChild variant="outline">
            <Link to="/app/agents">Back to Full Computer Test</Link>
          </Button>
        }
      />
    );

  const d = q.data;
  const ag = d.agents;
  const s = deviceSummary(d.payload);
  const sections = deviceSections(d.payload);
  const flags = reviewFlags(d.review_flags);
  // Unknown until the stick's laptops have loaded: Run test waits, so a result can't be misfiled.
  const position = stick.data ? stickPosition(stick.data, d.id) : null;
  const stickOnline = ag?.status === "active" && isOnline(ag?.last_heartbeat_at);
  const online = stickOnline && position !== "moved";
  const mayAct = can(role, "stations.act") && ag?.status === "active";
  const diagPending = isCommandPending(ag?.diagnostic_status, ag?.diagnostic_status_at);
  // A Windows laptop needs helper 0.6.2+ for the suite; older stick files restart or ignore it.
  const oldHelper = canRebootToUsb(ag?.platform) && !helperRunsSuite(ag?.agent_version);
  const diagStale =
    (ag?.diagnostic_status === "requested" || ag?.diagnostic_status === "delivered") &&
    !diagPending;
  const tag = d.device_id ? tagFields(d.payload, d.device_code, d.devices?.grade ?? null) : null;
  const lastSuite = diag.data?.find((r) => r.test === "full");
  const verdict = suiteVerdict(lastSuite);
  const canAdd = !d.is_simulated && can(role, "inventory.write") && !!d.system_serial;

  // One reason line under the buttons: the most important thing blocking them, if anything.
  const reason =
    ag?.status !== "active"
      ? "The stick that reported this laptop has been revoked, so the buttons are off."
      : position === "moved"
        ? "This stick is now on another laptop. Start NexWipe on this laptop again to test it."
        : position === "misfiled"
          ? "Results from this stick would be filed under another laptop. Use a different stick for this laptop."
          : !stickOnline
            ? "Not connected. Plug in a NexWipe stick and open Start NexWipe on this laptop."
            : oldHelper
              ? `This stick has an old NexWipe (${ag?.agent_version ?? "unknown"}); the test needs ${SUITE_MIN_HELPER} or newer. Prepare the stick again.`
              : diagStale
                ? "The laptop got the test but has not answered (window closed or test still open). You can send it again."
                : ag?.diagnostic_status && ag.diagnostic_status !== "done"
                  ? (DIAGNOSTIC_STATUS[ag.diagnostic_status] ?? null)
                  : null;

  async function rescan() {
    setBusy("rescan");
    const { error } = await supabase.rpc("request_station_action", {
      _agent: d.agent_id,
      _action: "rescan",
    });
    setBusy(null);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Rescan requested. The laptop reports again in a few seconds.");
    qc.invalidateQueries({ queryKey: ["connected-device", orgId, discoveryId] });
  }

  async function runTest() {
    setBusy("full");
    const { error } = await supabase.rpc("request_diagnostic", {
      _agent: d.agent_id,
      _test: "full",
    });
    setBusy(null);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Test sent. On the laptop, press Y to start, then follow the test window.");
    qc.invalidateQueries({ queryKey: ["connected-device", orgId, discoveryId] });
  }

  const refreshDevice = () => {
    qc.invalidateQueries({ queryKey: ["connected-device", orgId, discoveryId] });
    qc.invalidateQueries({ queryKey: ["device", d.device_id] });
  };
  const canStickAct = mayAct && stickOnline && busy === null;

  // History: which stick did what, newest first.
  type Event = { at: string; text: string };
  const events: Event[] = [
    ...(history.data ?? []).map((h) => ({
      at: h.last_reported_at ?? h.reported_at ?? "",
      text: `${h.agents?.name ?? "A stick"} reported this laptop · first ${formatDateTime(h.reported_at)} · last ${formatDateTime(h.last_reported_at)} · ${h.report_count} report${h.report_count === 1 ? "" : "s"}`,
    })),
    ...(diag.data ?? []).map((r) => {
      const sm = suiteSummary(r);
      const res =
        r.test === "full"
          ? suiteVerdict(r).label + (sm?.failed.length ? ` (${sm.failed.join(", ")})` : "")
          : r.outcome;
      return {
        at: r.created_at,
        text: `${r.agents?.name ?? "A stick"} ran the ${r.test === "full" ? "test" : `${r.test} test`} · ${res} · ${formatDateTime(r.created_at)}`,
      };
    }),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <div className="max-w-6xl space-y-5">
      <Link
        to="/app/agents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Full Computer Test
      </Link>

      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <Laptop className="size-6 shrink-0 text-muted-foreground" aria-hidden />
          {s.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Mono className="text-sm text-muted-foreground">{d.device_code}</Mono>
          <OnlineDot online={online} />
          <ToneBadge tone={verdict.tone}>
            {verdict.label === "Not tested"
              ? verdict.label
              : `Test: ${verdict.label.toLowerCase()}`}
          </ToneBadge>
          {d.is_simulated && <SimulatedBadge />}
          {!d.is_simulated && d.hardware_origin === "synthetic" && (
            <span title={d.hardware_origin_reason ?? undefined}>
              <ToneBadge tone="warning" icon={FlaskConical}>
                Synthetic test hardware
              </ToneBadge>
            </span>
          )}
          {flags.length > 0 && (
            <ToneBadge tone="warning" icon={AlertTriangle}>
              Needs review
            </ToneBadge>
          )}
        </div>
      </div>

      <section aria-label="Actions" className="space-y-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tile
            icon={Play}
            label="Run test"
            primary
            disabled={!canStickAct || position !== "current" || diagPending || oldHelper}
            onClick={runTest}
          />
          {d.device_id ? (
            <Button
              asChild
              variant="outline"
              className="h-auto min-h-24 flex-col gap-2 whitespace-normal py-4 text-base font-semibold [&_svg]:size-6"
            >
              <Link to="/app/inventory/$deviceId" params={{ deviceId: d.device_id }}>
                <Package aria-hidden />
                In inventory
                <span className="font-mono text-xs font-normal opacity-80">
                  {d.devices?.asset_tag}
                </span>
              </Link>
            </Button>
          ) : (
            <Tile
              icon={Package}
              label="Add to inventory"
              sub={!canAdd ? "Not available" : !online ? "Connect first" : undefined}
              disabled={!canAdd || !online}
              onClick={() =>
                setAddTarget({ id: d.id, serial: d.system_serial!, code: d.device_code })
              }
            />
          )}
          {d.device_id ? (
            <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-input p-3 text-base font-semibold">
              <Star className="size-6" aria-hidden />
              <GradeSelect
                deviceId={d.device_id}
                grade={d.devices?.grade ?? null}
                onSaved={refreshDevice}
                triggerClassName="h-9 w-full"
              />
            </div>
          ) : (
            <Tile icon={Star} label="Set grade" sub="Add to inventory first" disabled />
          )}
          <Tile
            icon={Tag}
            label="Print tag"
            sub={tag ? undefined : "Add to inventory first"}
            disabled={!tag}
            onClick={() => setTagOpen(true)}
          />
          <Tile
            icon={RefreshCw}
            label="Rescan"
            disabled={!canStickAct || position === "moved"}
            onClick={rescan}
          />
          <Tile icon={Eraser} label="Erase" sub="Planned" disabled />
        </div>
        {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
      </section>

      <Tabs defaultValue="report">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="report">Test report</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="barcode">Barcode</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-3">
          {diag.data && diag.data.length > 0 ? (
            <DiagnosticResultsCard results={diag.data} />
          ) : (
            <p className="text-sm text-muted-foreground">Not tested yet. Press Run test.</p>
          )}
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4">
          {flags.length > 0 && (
            <section className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
              <h2 className="mb-1 font-medium text-foreground">Needs review</h2>
              <ul className="space-y-0.5 text-warning">
                {flags.map((f, i) => (
                  <li key={`${f.code}-${i}`}>
                    {f.label}
                    {f.target ? `: ${f.target}` : ""}
                    {f.detail ? ` (${f.detail})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {d.device_id && d.devices && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              Inventory record: <HardwareOriginBadge record={d.devices} />
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((sec) => (
              <SectionCard key={sec.title} section={sec} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="barcode">
          <div className="inline-block space-y-1 text-center">
            <DeviceBarcode code={d.device_code} />
            <p className="text-xs text-muted-foreground">Unique NexWipe device code</p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
              {events.map((e, i) => (
                <li key={i} className="px-4 py-2.5 text-foreground">
                  {e.text}
                </li>
              ))}
            </ul>
          )}
          <details className="rounded-lg border border-border bg-card p-4 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">
              Technical details
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
              {JSON.stringify(d.payload, null, 2)}
            </pre>
          </details>
        </TabsContent>
      </Tabs>

      {tag && <DeviceTagDialog fields={tag} open={tagOpen} onOpenChange={setTagOpen} />}
      <AddToInventoryDialog target={addTarget} onClose={() => setAddTarget(null)} />
    </div>
  );
}
