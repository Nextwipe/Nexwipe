import { describe, expect, it } from "vitest";
import { suiteSummary } from "./diagnostics";

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
    expect(suiteSummary(r)).toEqual({ passed: 2, failed: ["Webcam", "Wi-Fi"] });
  });
  it("is null for a keyboard-only result or a broken one", () => {
    expect(suiteSummary({ test: "keyboard", result: {} })).toBeNull();
    expect(suiteSummary({ test: "full", result: null })).toEqual({ passed: 0, failed: [] });
  });
});
