import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Laptop, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/nd/status-badge";
import { useOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { useConnectedNow, useLaptopsByCodes } from "@/lib/queries";
import { toast } from "sonner";
import { acceptLaptop } from "@/lib/laptop-board";
import { errorMessage } from "@/components/nd/page";
import { relativeTime } from "@/lib/jobs";
import { connectedLaptops } from "@/lib/connected-device";
import {
  loadDismissals,
  popupQueue,
  pruneDismissals,
  saveDismissals,
  type Dismissals,
} from "@/lib/connected-popup";

/**
 * "Laptop connected" corner card on every app page; flips between laptops when several are connected.
 * With laptop stages (0027) it shows only laptops still waiting to be accepted, and asks to Accept.
 */
export function ConnectedPopup() {
  const { role } = useOrg();
  if (!can(role, "agents.view")) return null;
  return <ConnectedPopupCard />;
}

function ConnectedPopupCard() {
  const q = useConnectedNow();
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { discoveryId?: string };
  const [dismissed, setDismissed] = useState<Dismissals>(loadDismissals);
  const [index, setIndex] = useState(0);

  // Re-check every 5 s even when the polled data is unchanged: a stick that stops checking in returns
  // identical rows, and only the clock says it is gone.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  // Connected right now (by the clock), then: of those, which are still Pending. Only the few
  // connected laptops are looked up, so this works however many laptops a company has.
  const live = useMemo(() => connectedLaptops(q.data ?? [], tick), [q.data, tick]);
  const codes = useMemo(
    () => [...new Set(live.map((c) => c.device_code).filter((c): c is string => !!c))].sort(),
    [live],
  );
  const laptops = useLaptopsByCodes(codes);
  // Laptop id per device code for laptops still Pending; null before stages exist (before 0027).
  const pending = useMemo(
    () =>
      laptops.data
        ? new Map(
            laptops.data.filter((l) => l.stage_key === "pending").map((l) => [l.device_code, l.id]),
          )
        : null,
    [laptops.data],
  );
  const connected = useMemo(
    () => (pending ? live.filter((c) => c.device_code && pending.has(c.device_code)) : live),
    [live, pending],
  );

  // Forget dismissals for laptops that disconnected (or after an hour), so they pop up next time.
  useEffect(() => {
    if (!q.data) return;
    setDismissed((d) => {
      const next = pruneDismissals(
        d,
        connected.map((c) => c.id),
        Date.now(),
      );
      if (next !== d) saveDismissals(next);
      return next;
    });
  }, [q.data, connected, tick]);

  const queue = popupQueue(connected, dismissed, params.discoveryId);
  const firstId = queue[0]?.id;
  useEffect(() => setIndex(0), [firstId]); // a new arrival jumps to the front

  const waiting = connected.filter((c) => c.id !== params.discoveryId).length;
  if (queue.length === 0) {
    if (!pending || waiting === 0) return null;
    // Everything waiting was put off with Later: keep a small reminder that brings them back.
    return (
      <Button
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => {
          const back = new Set(connected.map((c) => c.id));
          setDismissed((d) => {
            const next = Object.fromEntries(Object.entries(d).filter(([id]) => !back.has(id)));
            saveDismissals(next);
            return next;
          });
        }}
      >
        <Laptop /> {waiting} laptop{waiting === 1 ? "" : "s"} waiting
      </Button>
    );
  }
  const i = Math.min(index, queue.length - 1);
  const l = queue[i]!;
  const title = [l.sys?.manufacturer, l.sys?.model].filter(Boolean).join(" ") || "Unknown laptop";

  function dismiss(id: string) {
    setDismissed((d) => {
      const next = { ...d, [id]: Date.now() };
      saveDismissals(next);
      return next;
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-border bg-card p-4 shadow-lg sm:left-auto sm:w-80"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2 rounded-full bg-success" aria-hidden />
        <span className="font-medium text-foreground">Laptop connected</span>
        {queue.length > 1 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {i + 1} of {queue.length}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`size-7 ${queue.length > 1 ? "" : "ml-auto"}`}
          aria-label="Later"
          title="Later"
          onClick={() => dismiss(l.id)}
        >
          <X />
        </Button>
      </div>
      <p className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">
        <Laptop className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{title}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">{l.device_code}</span> · {l.agents?.name ?? "stick"} ·{" "}
        {relativeTime(l.last_reported_at)}
      </p>
      {l.is_simulated && <SimulatedBadge className="mt-2" />}
      {pending && l.device_code && pending.get(l.device_code) ? (
        <>
          <Button
            size="lg"
            className="mt-3 w-full"
            onClick={async () => {
              try {
                await acceptLaptop(pending.get(l.device_code!)!);
                qc.invalidateQueries({ queryKey: ["laptops", orgId] });
                navigate({ to: "/app/connected/$discoveryId", params: { discoveryId: l.id } });
              } catch (err) {
                // A toast, not text on the card: after the refresh this laptop leaves the queue.
                toast.error(errorMessage(err));
                qc.invalidateQueries({ queryKey: ["laptops", orgId] });
              }
            }}
          >
            Accept
          </Button>
          <Link
            to="/app/connected/$discoveryId"
            params={{ discoveryId: l.id }}
            onClick={() => dismiss(l.id)}
            className="mt-1 block text-center text-xs text-muted-foreground hover:underline"
          >
            Open without accepting
          </Link>
        </>
      ) : (
        <Button asChild size="lg" className="mt-3 w-full">
          <Link
            to="/app/connected/$discoveryId"
            params={{ discoveryId: l.id }}
            onClick={() => dismiss(l.id)}
          >
            Open laptop
          </Link>
        </Button>
      )}
      {queue.length > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => setIndex(i - 1)}>
            <ChevronLeft /> Prev
          </Button>
          <span className="flex gap-1" aria-hidden>
            {queue.map((x, n) => (
              <span
                key={x.id}
                className={`size-1.5 rounded-full ${n === i ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            ))}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={i === queue.length - 1}
            onClick={() => setIndex(i + 1)}
          >
            Next <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
