import { describe, expect, it } from "vitest";
import { boardTabs, defaultTab } from "./laptop-board";
import { needsDbUpdate } from "./connected-device";

const stages = [
  { key: "testing", label: "Testing", position: 20, tone: "info", planned: null },
  { key: "pending", label: "Pending", position: 10, tone: "warning", planned: null },
  { key: "ready_for_sale", label: "Ready for sale", position: 40, tone: "success", planned: "v2" },
  { key: "tested", label: "Tested", position: 30, tone: "success", planned: null },
];
const lap = (stage_key: string, claimed_by: string | null = null) => ({ stage_key, claimed_by });

describe("boardTabs", () => {
  it("one tab per stage in position order, with counts and planned passed through", () => {
    const tabs = boardTabs(stages, [lap("pending"), lap("pending"), lap("tested")]);
    expect(tabs.map((t) => [t.key, t.count, t.planned])).toEqual([
      ["pending", 2, null],
      ["testing", 0, null],
      ["tested", 1, null],
      ["ready_for_sale", 0, "v2"],
    ]);
  });

  it("Mine counts only laptops I claimed (pending ones have no claimer)", () => {
    const tabs = boardTabs(
      stages,
      [lap("testing", "me"), lap("testing", "you"), lap("pending")],
      "me",
    );
    expect(tabs.find((t) => t.key === "testing")!.count).toBe(1);
    expect(tabs.find((t) => t.key === "pending")!.count).toBe(0);
  });
});

describe("defaultTab", () => {
  it("Pending when anything waits", () => {
    expect(defaultTab(boardTabs(stages, [lap("pending"), lap("tested")]))).toBe("pending");
  });
  it("otherwise the first stage that has laptops, skipping planned ones", () => {
    expect(defaultTab(boardTabs(stages, [lap("tested")]))).toBe("tested");
  });
  it("Pending on an empty board", () => {
    expect(defaultTab(boardTabs(stages, []))).toBe("pending");
  });
});

describe("needsDbUpdate for the laptop tables", () => {
  it("recognises PostgREST's missing-table error", () => {
    expect(
      needsDbUpdate({
        code: "PGRST205",
        message: "Could not find the table 'public.laptops' in the schema cache",
      }),
    ).toBe(true);
  });
});
