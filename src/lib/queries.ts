import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/org-context";
import { connectedLaptops, needsDbUpdate, type StickRow } from "@/lib/connected-device";

// All reads pass the current org as a filter for UX only. Row-level security is
// what actually restricts results to organizations the user belongs to.

export function useSites() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["sites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useClients() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["clients", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useProjects() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name), sites(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectCounts() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["project-counts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_device_counts")
        .select("*")
        .eq("org_id", orgId);
      if (error) throw error;
      return new Map(data.map((r) => [r.project_id!, r]));
    },
  });
}

export function useBatchCounts() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["batch-counts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batch_device_counts")
        .select("*")
        .eq("org_id", orgId);
      if (error) throw error;
      return new Map(data.map((r) => [r.batch_id!, r]));
    },
  });
}

export function useBatches(projectId?: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["batches", orgId, projectId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("batches")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useMembers() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("id, user_id, role, status, created_at, revoked_at, profiles(full_name, email)")
        .eq("org_id", orgId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function memberName(
  m: { profiles: { full_name: string | null; email: string } | null } | undefined,
) {
  if (!m?.profiles) return "Unknown user";
  return m.profiles.full_name || m.profiles.email;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// ----- Phase 2: policies, agents, jobs -----

export function usePolicies() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["policies", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*, policy_versions(*)")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data.map((p) => {
        const versions = [...p.policy_versions].sort((a, b) => b.version - a.version);
        return { ...p, policy_versions: versions, latest: versions[0] ?? null };
      });
    },
  });
}

export const AGENT_COLUMNS =
  "id, org_id, site_id, name, status, is_simulated, agent_version, platform, hostname, credential_prefix, enrolled_at, last_heartbeat_at, last_state, revoked_at, revoke_reason, read_only";

export function useAgents(opts: { refetchMs?: number } = {}) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["agents", orgId],
    refetchInterval: opts.refetchMs ?? false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select(AGENT_COLUMNS)
        .eq("org_id", orgId)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export const JOB_LIST_COLUMNS =
  "id, job_number, status, is_simulated, device_id, drive_id, association_id, target_asset_tag, target_drive_serial, target_drive_interface, execution_outcome, verification_outcome, current_phase, progress_pct, progress_measured, exception_code, created_at, updated_at, last_event_at, agent_id, policy_version_id, policy_versions(version, policies(name))";

// ----- Chromebook processing -----

export function useChromebooks() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["chromebooks", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chromebook_records")
        .select(
          "*, devices(asset_tag, manufacturer, model, system_serial, hardware_origin, project_id, batch_id)",
        )
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}

export function useChromebook(recordId: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["chromebook", orgId, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chromebook_records")
        .select(
          "*, devices(id, asset_tag, manufacturer, model, system_serial, hardware_origin, received_at, projects(name), batches(name))",
        )
        .eq("org_id", orgId)
        .eq("id", recordId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useChromebookEvents(recordId: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["chromebook-events", orgId, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chromebook_events")
        .select("*")
        .eq("org_id", orgId)
        .eq("record_id", recordId)
        .order("id", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ----- Connected devices (station reports) -----

const CONNECTED_COLUMNS =
  "id, agent_id, device_id, device_code, system_serial, payload, is_simulated, is_read_only_test, reported_at, last_reported_at, report_count, review_flags, hardware_origin, hardware_origin_reason, agents(name, platform, status, agent_version, last_heartbeat_at, reboot_status, reboot_detail, reboot_status_at, diagnostic_status, diagnostic_test, diagnostic_detail, diagnostic_status_at), devices(asset_tag, grade, hardware_verified, hardware_origin, source)";

const DIAGNOSTIC_COLUMNS =
  "id, test, outcome, result, detail, is_simulated, created_at, agent_id, agents(name)";

export function useConnectedDevices() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["connected-devices", orgId],
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_discoveries")
        .select(CONNECTED_COLUMNS)
        .eq("org_id", orgId)
        .order("last_reported_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Who is connected right now, for the "Laptop connected" pop-up: polled every 5 s while the tab is
 * visible, so it selects only the few fields the card shows (no hardware report body). When the
 * connected set changes it refreshes the full connected-devices list too.
 */
export function useConnectedNow() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const prev = useRef<string | null>(null);
  return useQuery({
    queryKey: ["connected-now", orgId],
    refetchInterval: 5000,
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_discoveries")
        .select(
          "id, agent_id, device_code, reported_at, last_reported_at, is_simulated, sys:payload->system, agents!inner(name, status, last_heartbeat_at)",
        )
        .eq("org_id", orgId)
        .eq("agents.status", "active")
        .order("last_reported_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = data as unknown as ConnectedNowRow[];
      const ids = connectedLaptops(rows)
        .map((r) => r.id)
        .join(",");
      if (prev.current !== null && prev.current !== ids)
        qc.invalidateQueries({ queryKey: ["connected-devices", orgId] });
      prev.current = ids;
      return rows;
    },
  });
}

export type ConnectedNowRow = StickRow & {
  is_simulated: boolean;
  sys: { manufacturer?: string; model?: string } | null;
  agents: { name: string; status: string | null; last_heartbeat_at: string | null } | null;
};

/** Latest station report linked to an inventory device (null for devices entered by hand). */
export function useDeviceDiscovery(deviceId: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["device-discovery", orgId, deviceId],
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_discoveries")
        .select(CONNECTED_COLUMNS)
        .eq("org_id", orgId)
        .eq("device_id", deviceId)
        .order("last_reported_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useConnectedDevice(discoveryId: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["connected-device", orgId, discoveryId],
    refetchInterval: 5000, // the laptop page follows heartbeats, test status and rescans by itself
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_discoveries")
        .select(CONNECTED_COLUMNS)
        .eq("org_id", orgId)
        .eq("id", discoveryId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Every stick that reported this laptop (History tab: which stick did what). */
export function useLaptopHistory(deviceCode: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    enabled: Boolean(deviceCode),
    queryKey: ["laptop-history", orgId, deviceCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_discoveries")
        .select("id, reported_at, last_reported_at, report_count, agents(name)")
        .eq("org_id", orgId)
        .eq("device_code", deviceCode!)
        .order("last_reported_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Every laptop one stick reported, to tell whether it is still on a given laptop (stickPosition). */
export function useStickDiscoveries(agentId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    enabled: Boolean(agentId),
    queryKey: ["stick-discoveries", orgId, agentId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_discoveries")
        .select("id, reported_at, last_reported_at")
        .eq("org_id", orgId)
        .eq("agent_id", agentId!);
      if (error) throw error;
      return data;
    },
  });
}

/** Diagnostic results for one laptop. Key by device_code (connected page) or device_id (inventory). */
export function useDiagnosticResults(by: { deviceCode?: string | null; deviceId?: string | null }) {
  const { orgId } = useOrg();
  const key = by.deviceCode ? ["code", by.deviceCode] : ["device", by.deviceId];
  return useQuery({
    enabled: Boolean(by.deviceCode || by.deviceId),
    queryKey: ["diagnostic-results", orgId, ...key],
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    refetchInterval: 5000, // the result lands a few heartbeats after the test is requested
    queryFn: async () => {
      let qb = supabase.from("diagnostic_results").select(DIAGNOSTIC_COLUMNS).eq("org_id", orgId);
      qb = by.deviceCode ? qb.eq("device_code", by.deviceCode) : qb.eq("device_id", by.deviceId!);
      const { data, error } = await qb.order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });
}

// ----- Laptop board (stages, migration 0027) -----

/** Stage definitions; the board's tabs come from here, never from code. */
export function useLaptopStages() {
  return useQuery({
    queryKey: ["laptop-stages"],
    staleTime: Infinity,
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laptop_stages")
        .select("key, label, position, tone, is_initial, is_terminal, planned")
        .order("position");
      if (error) throw error;
      return data;
    },
  });
}

const LAPTOP_COLUMNS =
  "id, device_code, title, latest_discovery_id, stage_key, is_simulated, claimed_by, claimed_at, stage_changed_at, first_seen_at";
const laptopRetry = (n: number, err: unknown) => !needsDbUpdate(err) && n < 3;

/** Board filter: `mine` = only laptops this user accepted; simulated laptops only when asked for. */
export type LaptopFilter = { mine?: string | undefined; simulated: boolean };

/** Laptops in one stage (the open tab), newest change first; polled so Accepts by others show up. */
export function useLaptopList(f: LaptopFilter & { stage: string }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["laptops", orgId, "list", f.stage, f.mine ?? null, f.simulated],
    refetchInterval: 5000,
    retry: laptopRetry,
    queryFn: async () => {
      let q = supabase
        .from("laptops")
        .select(LAPTOP_COLUMNS)
        .eq("org_id", orgId)
        .eq("stage_key", f.stage);
      if (f.mine) q = q.eq("claimed_by", f.mine);
      if (!f.simulated) q = q.eq("is_simulated", false);
      // ponytail: newest 200 per tab; add paging/search when a stage really holds more
      const { data, error } = await q.order("stage_changed_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
}

/** How many laptops are in each stage, counted by the database (no row limit). */
export function useLaptopCounts(f: LaptopFilter, stageKeys: string[]) {
  const { orgId } = useOrg();
  return useQuery({
    enabled: stageKeys.length > 0,
    queryKey: ["laptops", orgId, "counts", f.mine ?? null, f.simulated, stageKeys.join(",")],
    refetchInterval: 5000,
    retry: laptopRetry,
    queryFn: async () => {
      const pairs = await Promise.all(
        stageKeys.map(async (k) => {
          let q = supabase
            .from("laptops")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgId)
            .eq("stage_key", k);
          if (f.mine) q = q.eq("claimed_by", f.mine);
          if (!f.simulated) q = q.eq("is_simulated", false);
          const { count, error } = await q;
          if (error) throw error;
          return [k, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(pairs) as Record<string, number>;
    },
  });
}

/** How many simulated laptops exist (shown on the "Show simulated" toggle). */
export function useSimulatedCount() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["laptops", orgId, "simulated-count"],
    refetchInterval: 30_000,
    retry: laptopRetry,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("laptops")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("is_simulated", true);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** The laptops with these device codes (the pop-up: only the few connected right now). */
export function useLaptopsByCodes(codes: string[]) {
  const { orgId } = useOrg();
  return useQuery({
    enabled: codes.length > 0,
    queryKey: ["laptops", orgId, "codes", codes.join(",")],
    retry: laptopRetry,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laptops")
        .select(LAPTOP_COLUMNS)
        .eq("org_id", orgId)
        .in("device_code", codes);
      if (error) throw error;
      return data;
    },
  });
}

/** One laptop by device code (laptop screen: stage and claim); null when not found. */
export function useLaptopByCode(deviceCode: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    enabled: Boolean(deviceCode),
    queryKey: ["laptops", orgId, "code", deviceCode],
    refetchInterval: 5000,
    retry: laptopRetry,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laptops")
        .select(LAPTOP_COLUMNS)
        .eq("org_id", orgId)
        .eq("device_code", deviceCode!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Stage history of one laptop, newest first. */
export function useLaptopEvents(laptopId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    enabled: Boolean(laptopId),
    queryKey: ["laptop-events", orgId, laptopId],
    retry: (n, err) => !needsDbUpdate(err) && n < 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laptop_stage_events")
        .select("id, from_key, to_key, trigger, actor, reason, created_at")
        .eq("org_id", orgId)
        .eq("laptop_id", laptopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
