import { describe, expect, it } from "vitest";
import { boardTabs, defaultTab, stageEventText } from "./laptop-board";
import { needsDbUpdate } from "./connected-device";

const stages = [
  { key: "testing", label: "Testing", position: 20, tone: "info", planned: null },
  { key: "pending", label: "Pending", position: 10, tone: "warning", planned: null },
  { key: "ready_for_sale", label: "Ready for sale", position: 40, tone: "success", planned: "v2" },
  { key: "tested", label: "Tested", position: 30, tone: "success", planned: null },
];

describe("boardTabs", () => {
  it("one tab per stage in position order, with the server's counts and planned passed through", () => {
    const tabs = boardTabs(stages, { pending: 2, tested: 1 });
    expect(tabs.map((t) => [t.key, t.count, t.planned])).toEqual([
      ["pending", 2, null],
      ["testing", 0, null],
      ["tested", 1, null],
      ["ready_for_sale", 0, "v2"],
    ]);
  });
});

describe("defaultTab", () => {
  it("Pending when anything waits", () => {
    expect(defaultTab(boardTabs(stages, { pending: 1, tested: 1 }))).toBe("pending");
  });
  it("otherwise the first stage that has laptops, skipping planned ones", () => {
    expect(defaultTab(boardTabs(stages, { tested: 1 }))).toBe("tested");
  });
  it("Pending on an empty board", () => {
    expect(defaultTab(boardTabs(stages, {}))).toBe("pending");
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

describe("stageEventText", () => {
  const label = (k: string | null) =>
    ({ pending: "Pending", testing: "Testing", tested: "Tested" })[k ?? ""] ?? k ?? "";
  it("says who accepted", () => {
    expect(
      stageEventText(
        { trigger: "accept", from_key: "pending", to_key: "testing", actor: "u1", reason: null },
        label,
        "Priya",
      ),
    ).toBe("Priya accepted it");
  });
  it("names system moves without a person", () => {
    expect(
      stageEventText(
        {
          trigger: "test_result",
          from_key: "testing",
          to_key: "tested",
          actor: null,
          reason: "Test result: fail",
        },
        label,
        null,
      ),
    ).toBe("Moved to Tested by a test result");
    expect(
      stageEventText(
        { trigger: "report", from_key: null, to_key: "pending", actor: null, reason: null },
        label,
        null,
      ),
    ).toBe("First reported by a NexWipe stick");
  });
  it("release and test again", () => {
    expect(
      stageEventText(
        { trigger: "release", from_key: "testing", to_key: "pending", actor: "u1", reason: null },
        label,
        "Sam",
      ),
    ).toBe("Sam released it back to Pending");
    expect(
      stageEventText(
        { trigger: "test_again", from_key: "tested", to_key: "testing", actor: "u1", reason: null },
        label,
        "Sam",
      ),
    ).toBe("Sam started the test again");
  });
});
