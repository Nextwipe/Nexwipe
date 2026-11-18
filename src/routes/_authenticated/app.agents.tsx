import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, KeyRound, RotateCw, Server, ShieldOff, Usb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorBlock, LoadingBlock, Mono, PageHeader, errorMessage } from "@/components/nd/page";
import { SimulatedBadge, ToneBadge } from "@/components/nd/status-badge";
import { useOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { formatDateTime, useAgents } from "@/lib/queries";
import { heartbeatState, relativeTime } from "@/lib/jobs";
import { StationDiscoveries } from "@/components/nd/station-discoveries";
import { PrepareUsbStick } from "@/components/nd/prepare-usb-stick";

export const Route = createFileRoute("/_authenticated/app/agents")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Agents & stations · NexWipe" }] }),
  component: AgentsPage,
});

const HB_TONE = { online: "success", stale: "warning", offline: "danger", never: "neutral" } as const;

function AgentsPage() {
  const { orgId, role } = useOrg();
  const qc = useQueryClient();
  const agents = useAgents();
  const canManage = can(role, "agents.manage");
  const tokens = useQuery({
    queryKey: ["enrollment-tokens", orgId],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollment_tokens").select("id, label, is_simulated, created_at, expires_at, used_at, revoked_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [revoke, setRevoke] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [stickOpen, setStickOpen] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.rpc("create_enrollment_token", { _org: orgId, _label: String(f.get("label")), _site: null as never, _ttl_hours: Number(f.get("ttl") || 24) });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    setToken(data as string);
    qc.invalidateQueries({ queryKey: ["enrollment-tokens", orgId] });
  }

  async function onRevoke() {
    if (!revoke) return;
    const { error } = await supabase.rpc("revoke_agent", { _agent: revoke.id, _reason: "Revoked by administrator" });
    setRevoke(null);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Agent revoked. Its credential no longer works and its queued jobs need re-authorization.");
    qc.invalidateQueries({ queryKey: ["agents", orgId] });
  }

  const list = agents.data ?? [];
  const active = list.filter((a) => a.status === "active");
  const shown = showRevoked ? list : active;
  const unusedTokens = (tokens.data ?? []).filter((t) => !t.used_at && !t.revoked_at && new Date(t.expires_at) >= new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents & stations"
        description="Prepare a NexWipe USB stick, plug it into a laptop and open Start NexWipe: the laptop shows up below. Sticks only read hardware. They never erase or change anything."
        actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => { qc.invalidateQueries({ queryKey: ["agents", orgId] }); qc.invalidateQueries({ queryKey: ["connected-devices", orgId] }); }}><RotateCw /> Refresh</Button>{canManage && <Button onClick={() => setStickOpen(true)}><Usb /> Prepare USB stick</Button>}</div>}
      />

      <StationDiscoveries />
      {canManage && <PrepareUsbStick open={stickOpen} onOpenChange={setStickOpen} />}

      {/* ponytail: renders every stick in one list; add search/paging when a company really has thousands */}
      <details className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:hidden">
          <Server className="mr-2 inline size-3.5 text-muted-foreground" />USB sticks &amp; stations
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {agents.isLoading ? "loading…" : `${active.length} active${list.length > active.length ? ` · ${list.length - active.length} revoked` : ""}`} · click to show
          </span>
        </summary>
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Each stick signs in with its own credential. All physical stations are read-only: they can never be authorized to run erasure jobs. A stick&apos;s sign-in proves which stick sent a report, not that the hardware is real.</p>
            <div className="flex gap-2">
              {list.length > active.length && <Button variant="ghost" size="sm" onClick={() => setShowRevoked((v) => !v)}>{showRevoked ? "Hide revoked" : "Show revoked"}</Button>}
              {canManage && <Button variant="outline" size="sm" onClick={() => { setToken(null); setOpen(true); }}><KeyRound /> Enrollment token</Button>}
            </div>
          </div>
          {agents.isLoading ? <LoadingBlock /> : agents.error ? <ErrorBlock error={agents.error} /> : shown.length === 0 ? (
            <EmptyState icon={Server} title="No sticks connected yet" description="Use Prepare USB stick, then start it on a laptop." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Stick</th>
                    <th className="px-3 py-2 font-medium">Last seen</th>
                    <th className="px-3 py-2 font-medium">Version</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2"><span className="font-medium text-foreground">{a.name}</span>{a.is_simulated && <SimulatedBadge className="ml-2" />}{a.status !== "active" && <ToneBadge tone="danger" className="ml-2">Revoked</ToneBadge>}</td>
                      <td className="px-3 py-2">{a.status === "active" ? <ToneBadge tone={HB_TONE[heartbeatState(a.last_heartbeat_at)]}>{relativeTime(a.last_heartbeat_at)}</ToneBadge> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.agent_version ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {a.status === "active" && (canManage || (a.is_simulated && can(role, "simulator.run"))) && (
                          <Button variant="ghost" size="sm" onClick={() => setRevoke({ id: a.id, name: a.name })}><ShieldOff /> Revoke</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canManage && (tokens.data?.length ?? 0) > 0 && (
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">Enrollment tokens · {unusedTokens} unused · last {tokens.data!.length}</summary>
              <table className="mt-2 w-full text-sm">
                <tbody className="divide-y divide-border">
                  {tokens.data!.map((t) => {
                    const state = t.used_at ? "Used" : t.revoked_at ? "Revoked" : new Date(t.expires_at) < new Date() ? "Expired" : "Unused";
                    return (
                      <tr key={t.id}>
                        <td className="px-3 py-1.5 text-foreground">{t.label} {t.is_simulated && <SimulatedBadge className="ml-1" />}</td>
                        <td className="px-3 py-1.5"><ToneBadge tone={state === "Unused" ? "info" : "neutral"}>{state}</ToneBadge></td>
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">Expires {formatDateTime(t.expires_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          )}
        </div>
      </details>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enrollment token</DialogTitle>
            <DialogDescription>Single use. The station exchanges it for its own credential at <Mono>POST /api/public/agent/v1/enroll</Mono>.</DialogDescription>
          </DialogHeader>
          {token ? (
            <div className="space-y-3">
              <p className="text-sm text-warning">Copy it now. It is shown only once and stored only as a hash.</p>
              <div className="flex gap-2">
                <Input readOnly value={token} className="font-mono text-xs" />
                <Button variant="outline" size="icon" aria-label="Copy token" onClick={() => { navigator.clipboard.writeText(token); toast.success("Copied"); }}><Copy /></Button>
              </div>
            </div>
          ) : (
            <form id="new-token" onSubmit={onCreate} className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="label">Station label *</Label><Input id="label" name="label" required maxLength={120} placeholder="e.g. Bench 3, Warehouse A" /></div>
              <div className="space-y-1.5"><Label htmlFor="ttl">Valid for (hours)</Label><Input id="ttl" name="ttl" type="number" min={1} max={168} defaultValue={1} /><p className="text-xs text-muted-foreground">Keep it short: type the token on the station soon after creating it. The station it enrolls is read-only (hardware reporting only).</p></div>
            </form>
          )}
          <DialogFooter>
            {token ? <Button onClick={() => setOpen(false)}>Done</Button> : <><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="new-token" loading={busy}>Create token</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revoke} onOpenChange={(v) => !v && setRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke {revoke?.name}?</DialogTitle>
            <DialogDescription>The credential stops working immediately. Queued jobs return to Awaiting authorization; running jobs become Interrupted. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevoke(null)}>Cancel</Button>
            <Button variant="destructive" onClick={onRevoke}>Revoke agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
