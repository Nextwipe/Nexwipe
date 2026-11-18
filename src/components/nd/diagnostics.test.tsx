import { describe, expect, it } from "vitest";
import { suiteSummary, suiteVerdict } from "./diagnostics";

describe("suiteSummary", () => {
  it("counts passed parts and names failed ones in display order", () => {
    const r = {
      test: "full",
      result: {
        tests: {
          webcam: { outcome: "fail" },
          keyboard: { outcome: "pass" },
          display: { outcome: "pass" },
          wifi: { outcome: "fail" },
          ports: { outcome: "skipped" },
        },
      },
    };
    expect(suiteSummary(r)).toEqual({
      passed: 2,
      failed: ["Webcam", "Wi-Fi"],
      unfinished: ["USB ports"],
    });
  });
  it("is null for a keyboard-only result or a broken one", () => {
    expect(suiteSummary({ test: "keyboard", result: {} })).toBeNull();
    expect(suiteSummary({ test: "full", result: null })).toEqual({
      passed: 0,
      failed: [],
      unfinished: [],
    });
  });
  it("a declined suite (keyboard incomplete only) is unfinished, not all passed", () => {
    expect(
      suiteSummary({ test: "full", result: { tests: { keyboard: { outcome: "incomplete" } } } }),
    ).toEqual({ passed: 0, failed: [], unfinished: ["Keyboard"] });
  });
});

describe("suiteVerdict", () => {
  const full = (outcome: string, tests: Record<string, { outcome: string }>) => ({
    test: "full",
    outcome,
    result: { tests },
  });
  it("all passed only when the suite outcome is pass", () => {
    expect(suiteVerdict(full("pass", { keyboard: { outcome: "pass" } }))).toEqual({
      tone: "success",
      label: "All passed",
    });
  });
  it("counts problems on a failed suite", () => {
    expect(
      suiteVerdict(full("fail", { webcam: { outcome: "fail" }, display: { outcome: "pass" } })),
    ).toEqual({ tone: "danger", label: "1 problem found" });
  });
  it("a declined or half-run suite is not finished, never all passed", () => {
    expect(suiteVerdict(full("incomplete", { keyboard: { outcome: "incomplete" } }))).toEqual({
      tone: "warning",
      label: "Test not finished",
    });
  });
  it("no result means not tested", () => {
    expect(suiteVerdict(undefined)).toEqual({ tone: "neutral", label: "Not tested" });
  });
});
