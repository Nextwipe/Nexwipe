import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Laptop, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/nd/status-badge";
import { useOrg } from "@/lib/org-context";
import { can } from "@/lib/permissions";
import { useConnectedNow } from "@/lib/queries";
import { relativeTime } from "@/lib/jobs";
import { connectedLaptops } from "@/lib/connected-device";
import {
  loadDismissals,
  popupQueue,
  pruneDismissals,
  saveDismissals,
  type Dismissals,
} from "@/lib/connected-popup";

/** "Laptop connected" corner card on every app page; flips between laptops when several are connected. */
export function ConnectedPopup() {
  const { role } = useOrg();
  if (!can(role, "agents.view")) return null;
  return <ConnectedPopupCard />;
}

function ConnectedPopupCard() {
  const q = useConnectedNow();
  const params = useParams({ strict: false }) as { discoveryId?: string };
  const [dismissed, setDismissed] = useState<Dismissals>(loadDismissals);
  const [index, setIndex] = useState(0);

  const connected = useMemo(() => connectedLaptops(q.data ?? []), [q.data]);

  // Forget dismissals for laptops that disconnected (or after an hour), so they pop up next time.
  useEffect(() => {
    if (!q.data) return;
    setDismissed((d) => {
      const next = pruneDismissals(d, connected.map((c) => c.id), Date.now());
      if (next !== d) saveDismissals(next);
      return next;
    });
  }, [q.data, connected]);

  const queue = popupQueue(connected, dismissed, params.discoveryId);
  const firstId = queue[0]?.id;
  useEffect(() => setIndex(0), [firstId]); // a new arrival jumps to the front

  if (queue.length === 0) return null;
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
      <Button asChild size="lg" className="mt-3 w-full">
        <Link
          to="/app/connected/$discoveryId"
          params={{ discoveryId: l.id }}
          onClick={() => dismiss(l.id)}
        >
          Open laptop
        </Link>
      </Button>
      {queue.length > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => setIndex(i - 1)}>
            <ChevronLeft /> Prev
          </Button>
          <span className="flex gap-1" aria-hidden>
            {queue.map((x, n) => (
              <span key={x.id} className={`size-1.5 rounded-full ${n === i ? "bg-primary" : "bg-muted-foreground/30"}`} />
            ))}
          </span>
          <Button variant="ghost" size="sm" disabled={i === queue.length - 1} onClick={() => setIndex(i + 1)}>
            Next <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
