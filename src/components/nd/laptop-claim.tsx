import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToneBadge, type Tone } from "@/components/nd/status-badge";
import { errorMessage } from "@/components/nd/page";
import { useOrg } from "@/lib/org-context";
import { useSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { relativeTime } from "@/lib/jobs";
import { acceptLaptop, releaseLaptop } from "@/lib/laptop-board";
import { memberName, useLaptopStages, useLaptops, useMembers } from "@/lib/queries";

/** The laptop row (stage + claim) for a device code; null before stages exist (0027) or not found. */
export function useLaptopByCode(deviceCode: string | null) {
  const laptops = useLaptops();
  return deviceCode
    ? ((laptops.data ?? []).find((l) => l.device_code === deviceCode) ?? null)
    : null;
}

/** Stage badge, who accepted it, and Accept / Release, for the laptop screen header. */
export function LaptopClaimBar({ deviceCode }: { deviceCode: string | null }) {
  const { orgId, role } = useOrg();
  const qc = useQueryClient();
  const me = useSessionUser().data?.id;
  const stages = useLaptopStages();
  const members = useMembers();
  const lap = useLaptopByCode(deviceCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!lap) return null;
  const stage = (stages.data ?? []).find((s) => s.key === lap.stage_key);
  const claimer = lap.claimed_by
    ? lap.claimed_by === me
      ? "you"
      : memberName((members.data ?? []).find((m) => m.user_id === lap.claimed_by))
    : null;
  const mayRelease =
    lap.stage_key === "testing" && (lap.claimed_by === me || can(role, "agents.manage"));

  async function run(fn: (id: string) => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn(lap!.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["laptops", orgId] });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {stage && <ToneBadge tone={stage.tone as Tone}>{stage.label}</ToneBadge>}
      {claimer && (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <UserCheck className="size-4" aria-hidden />
          Accepted by {claimer}
          {lap.claimed_at ? ` · ${relativeTime(lap.claimed_at)}` : ""}
        </span>
      )}
      {lap.stage_key === "pending" && can(role, "inventory.write") && (
        <Button size="sm" loading={busy} onClick={() => run(acceptLaptop)}>
          Accept
        </Button>
      )}
      {mayRelease && (
        <Button size="sm" variant="ghost" loading={busy} onClick={() => run(releaseLaptop)}>
          Release
        </Button>
      )}
      {error && <span className="text-danger">{error}</span>}
    </div>
  );
}

/**
 * Before acting on a laptop someone else accepted, ask once ("This is Priya's laptop. Continue
 * anyway?"). Remembered per laptop for this browser tab. Not a lock: anyone may continue.
 */
export function useClaimGuard(deviceCode: string | null): {
  guard: (fn: () => void) => void;
  dialog: ReactNode;
} {
  const me = useSessionUser().data?.id;
  const members = useMembers();
  const lap = useLaptopByCode(deviceCode);
  const [pendingFn, setPendingFn] = useState<(() => void) | null>(null);
  const key = lap ? `nexwipe.claim-ok.${lap.id}` : "";
  const someoneElse = !!lap?.claimed_by && lap.claimed_by !== me;
  const name = someoneElse
    ? memberName((members.data ?? []).find((m) => m.user_id === lap!.claimed_by))
    : "";

  const confirmed = () => {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  };
  function guard(fn: () => void) {
    if (!someoneElse || confirmed()) fn();
    else setPendingFn(() => fn);
  }
  const dialog = (
    <AlertDialog open={!!pendingFn} onOpenChange={(o) => !o && setPendingFn(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>This is {name}'s laptop. Continue anyway?</AlertDialogTitle>
          <AlertDialogDescription>
            {name} accepted it. You can still work on it; the history shows who did what.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              try {
                sessionStorage.setItem(key, "1");
              } catch {
                /* asked again next time */
              }
              const fn = pendingFn;
              setPendingFn(null);
              fn?.();
            }}
          >
            Continue anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { guard, dialog };
}
