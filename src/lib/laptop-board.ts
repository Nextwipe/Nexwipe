import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/components/nd/page";

/** A stage as defined in the laptop_stages table (migration 0027). The board never hard-codes them. */
export type Stage = {
  key: string;
  label: string;
  position: number;
  tone: string;
  planned: string | null;
};
export type Tab = { key: string; label: string; tone: string; count: number; planned: string | null };

/** One tab per stage in position order, counting laptops (only mine when `mineUserId` is given). */
export function boardTabs(
  stages: Stage[],
  laptops: Array<{ stage_key: string; claimed_by: string | null }>,
  mineUserId?: string,
): Tab[] {
  const shown = mineUserId ? laptops.filter((l) => l.claimed_by === mineUserId) : laptops;
  return [...stages]
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      key: s.key,
      label: s.label,
      tone: s.tone,
      planned: s.planned,
      count: shown.filter((l) => l.stage_key === s.key).length,
    }));
}

/** Open Pending when anything waits, else the first stage that has laptops, else Pending. */
export function defaultTab(tabs: Tab[]): string {
  const pending = tabs.find((t) => t.key === "pending");
  if (pending && pending.count > 0) return "pending";
  return tabs.find((t) => !t.planned && t.count > 0)?.key ?? "pending";
}

async function rpc(name: "accept_laptop" | "release_laptop", id: string) {
  const { error } = await supabase.rpc(name, { _laptop: id });
  if (error) throw new Error(errorMessage(error));
}
export const acceptLaptop = (id: string) => rpc("accept_laptop", id);
export const releaseLaptop = (id: string) => rpc("release_laptop", id);
