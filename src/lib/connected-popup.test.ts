import { afterEach, describe, expect, it, vi } from "vitest";
import { DISMISS_MAX_MS, loadDismissals, popupQueue, pruneDismissals, saveDismissals } from "./connected-popup";

const now = Date.parse("2026-11-18T10:00:00Z");
const A = { id: "A" },
  B = { id: "B" };

describe("pop-up dismissals", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("a dismissed laptop stays hidden while connected (a Rescan does not bring it back)", () => {
    const d = pruneDismissals({ A: now - 10 * 60_000 }, ["A", "B"], now);
    expect(popupQueue([A, B], d)).toEqual([B]);
  });

  it("re-arms once this browser has seen the laptop disconnect", () => {
    const d = pruneDismissals({ A: now }, ["B"], now);
    expect(d).toEqual({});
    expect(popupQueue([A, B], d)).toEqual([A, B]);
  });

  it("re-arms after an hour", () => {
    expect(pruneDismissals({ A: now - DISMISS_MAX_MS - 60_000 }, ["A"], now)).toEqual({});
  });

  it("keeps the same object when nothing changed", () => {
    const d = { A: now };
    expect(pruneDismissals(d, ["A"], now)).toBe(d);
  });

  it("hides the laptop whose page is open", () => {
    expect(popupQueue([A, B], {}, "A")).toEqual([B]);
  });

  it("works when browser storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadDismissals()).toEqual({});
    expect(() => saveDismissals({ A: now })).not.toThrow();
  });

  it("round-trips through storage and ignores bad JSON", () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) });
    saveDismissals({ A: now });
    expect(loadDismissals()).toEqual({ A: now });
    store["nexwipe.popup.dismissed"] = "{bad";
    expect(loadDismissals()).toEqual({});
  });
});
