/**
 * "Laptop connected" pop-up: which laptops this browser has dismissed. A dismissal lasts while the
 * laptop stays connected (so a Rescan does not bring it back), and is forgotten once this browser
 * sees the laptop disconnect, or after an hour in case it disconnected while no tab was open.
 */
export type Dismissals = Record<string, number>;

export const DISMISS_MAX_MS = 3_600_000;
const KEY = "nexwipe.popup.dismissed";

export function pruneDismissals(d: Dismissals, connectedIds: string[], now: number): Dismissals {
  const live = new Set(connectedIds);
  const keep = Object.entries(d).filter(([id, at]) => live.has(id) && now - at <= DISMISS_MAX_MS);
  return keep.length === Object.keys(d).length ? d : Object.fromEntries(keep);
}

export function popupQueue<T extends { id: string }>(connected: T[], d: Dismissals, hideId?: string): T[] {
  return connected.filter((c) => !(c.id in d) && c.id !== hideId);
}

export function loadDismissals(): Dismissals {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Dismissals) : {};
  } catch {
    return {};
  }
}

export function saveDismissals(d: Dismissals): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Private window or blocked storage: dismissals then last only for this page.
  }
}
