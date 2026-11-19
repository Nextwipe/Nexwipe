import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DatabaseZap, FlaskConical, Laptop, Usb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBlock, LoadingBlock, Mono, errorMessage } from "@/components/nd/page";
import { SimulatedBadge, ToneBadge, type Tone } from "@/components/nd/status-badge";
import { PrepareUsbStick } from "@/components/nd/prepare-usb-stick";
import { useOrg } from "@/lib/org-context";
import { useSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { relativeTime } from "@/lib/jobs";
import { needsDbUpdate } from "@/lib/connected-device";
import { acceptLaptop, boardTabs, defaultTab } from "@/lib/laptop-board";
import {
  memberName,
  useConnectedDevices,
  useLaptopStages,
  useLaptopCounts,
  useLaptopList,
  useSimulatedCount,
  useMembers,
} from "@/lib/queries";
import { runVirtualLaptop } from "@/lib/virtual-laptop.functions";
import { toast } from "sonner";

/** Dashboard laptop board: every reported laptop, one tab per stage (from the database), Accept on Pending. */
export function LaptopBoard() {
  const { orgId, role } = useOrg();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const me = useSessionUser().data?.id;
  const stages = useLaptopStages();
  const members = useMembers();
  const discoveries = useConnectedDevices();
  const [tab, setTab] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [stickOpen, setStickOpen] = useState(false);
  const [virtualBusy, setVirtualBusy] = useState(false);
  const [virtualError, setVirtualError] = useState<string | null>(null);

  // Counting and filtering happen in the database, so the board is right however many laptops exist.
  const filter = { mine: mine && me ? me : undefined, simulated: showSim };
  const stageKeys = useMemo(() => (stages.data ?? []).map((st) => st.key), [stages.data]);
  const counts = useLaptopCounts(filter, stageKeys);
  const simCount = useSimulatedCount().data ?? 0;
  const tabs = useMemo(
    () => boardTabs(stages.data ?? [], counts.data ?? {}),
    [stages.data, counts.data],
  );
  const current = tab ?? defaultTab(tabs);
  const list = useLaptopList({ ...filter, stage: current });
  const memberById = new Map((members.data ?? []).map((m) => [m.user_id, m]));
  // "Recorded" label: the laptop already has an inventory record (received by hand or added).
  const recorded = new Map(
    (discoveries.data ?? [])
      .filter((d) => d.device_id && d.device_code)
      .map((d) => [d.device_code!, d.devices?.asset_tag ?? "inventory"]),
  );

  if (needsDbUpdate(counts.error) || needsDbUpdate(stages.error) || needsDbUpdate(list.error))
    return (
      <EmptyState
        icon={DatabaseZap}
        title="Waiting for a database update"
        description="The laptop board needs database update 0027, which has not been applied yet. The project owner applies it in Lovable; nothing is wrong with your data."
      />
    );
  if (stages.isLoading || counts.isLoading) return <LoadingBlock />;
  if (counts.error || list.error) return <ErrorBlock error={counts.error ?? list.error} />;

  async function onAccept(id: string, discoveryId: string | null) {
    setBusy(id);
    try {
      await acceptLaptop(id);
      qc.invalidateQueries({ queryKey: ["laptops", orgId] });
      if (discoveryId) navigate({ to: "/app/connected/$discoveryId", params: { discoveryId } });
    } catch (err) {
      // A toast, not text on the row: after the refresh the row leaves the Pending tab.
      toast.error(errorMessage(err));
      qc.invalidateQueries({ queryKey: ["laptops", orgId] });
    } finally {
      setBusy(null);
    }
  }

  async function onVirtual() {
    setVirtualBusy(true);
    setVirtualError(null);
    try {
      await runVirtualLaptop({ data: { orgId, tested: false } });
      qc.invalidateQueries({ queryKey: ["laptops", orgId] });
      setShowSim(true);
      setTab("pending");
    } catch (err) {
      setVirtualError(errorMessage(err));
    } finally {
      setVirtualBusy(false);
    }
  }

  const canTry = can(role, "simulator.run");
  const virtualButton = canTry && (
    <Button variant="ghost" size="sm" loading={virtualBusy} onClick={onVirtual}>
      <FlaskConical /> Try a virtual laptop
    </Button>
  );
  const stickDialog = can(role, "agents.manage") && (
    <PrepareUsbStick open={stickOpen} onOpenChange={setStickOpen} />
  );

  const total = Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0);
  if (total === 0 && !mine && !showSim)
    return (
      <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Test your first laptop</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex flex-wrap items-center gap-3">
            <Step n={1} />
            <span className="text-foreground">Prepare a USB stick</span>
            {can(role, "agents.manage") ? (
              <Button size="sm" onClick={() => setStickOpen(true)}>
                <Usb /> Prepare USB stick
              </Button>
            ) : (
              <span className="text-muted-foreground">(ask an owner or admin)</span>
            )}
          </li>
          <li className="flex items-center gap-3">
            <Step n={2} />
            <span className="text-foreground">
              Plug it into the laptop and double-click Start NexWipe
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={3} />
            <span className="text-foreground">
              The laptop appears here. Press Accept to start testing it
            </span>
          </li>
        </ol>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
          No laptop at hand? {virtualButton}
          {simCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowSim(true)}>
              Show simulated ({simCount})
            </Button>
          )}
          {virtualError && <span className="text-danger">{virtualError}</span>}
        </div>
        {stickDialog}
      </section>
    );

  const rows = list.data ?? [];

  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card"
      aria-label="Laptops"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Laptop stages" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === current}
              disabled={!!t.planned}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${t.key === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {t.label}
              {t.planned ? (
                <span className="text-xs">· Planned {t.planned}</span>
              ) : (
                <span className="rounded bg-background/20 px-1.5 text-xs tabular-nums">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          variant={mine ? "default" : "outline"}
          size="sm"
          className="ml-auto"
          aria-pressed={mine}
          onClick={() => setMine((v) => !v)}
        >
          Only mine
        </Button>
        {(simCount > 0 || showSim) && (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={showSim}
            onClick={() => setShowSim((v) => !v)}
          >
            {showSim ? "Hide simulated" : `Show simulated (${simCount})`}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No laptops here.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((l) => {
            const claimer = l.claimed_by ? memberName(memberById.get(l.claimed_by)) : null;
            const tag = recorded.get(l.device_code);
            const stage = (stages.data ?? []).find((s) => s.key === l.stage_key);
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <Laptop className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {l.latest_discovery_id ? (
                      <Link
                        to="/app/connected/$discoveryId"
                        params={{ discoveryId: l.latest_discovery_id }}
                        className="hover:underline"
                      >
                        {l.title ?? "Unknown laptop"}
                      </Link>
                    ) : (
                      (l.title ?? "Unknown laptop")
                    )}
                    {l.is_simulated && <SimulatedBadge />}
                    {stage && <ToneBadge tone={stage.tone as Tone}>{stage.label}</ToneBadge>}
                  </p>
                  <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    <Mono>{l.device_code}</Mono>
                    {tag && <span>Recorded · {tag}</span>}
                    {claimer && <span>Accepted by {claimer}</span>}
                    <span>{relativeTime(l.stage_changed_at)}</span>
                  </p>
                </div>
                {l.stage_key === "pending" && can(role, "inventory.write") ? (
                  <Button
                    size="lg"
                    loading={busy === l.id}
                    onClick={() => onAccept(l.id, l.latest_discovery_id)}
                  >
                    Accept
                  </Button>
                ) : l.latest_discovery_id ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/app/connected/$discoveryId"
                      params={{ discoveryId: l.latest_discovery_id }}
                    >
                      Open
                    </Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        {virtualButton}
        {virtualError && <span className="text-danger">{virtualError}</span>}
      </div>
      {stickDialog}
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {n}
    </span>
  );
}
