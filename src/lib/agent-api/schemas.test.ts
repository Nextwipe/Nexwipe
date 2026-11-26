import { describe, expect, it } from "vitest";
import { DiagnosticResultRequest, EnrollRequest, KEYBOARD_PASS_MIN_KEYS } from "./schemas";

const keys = (n: number) => Array.from({ length: n }, (_, i) => `SC_${i.toString(16)}`);

// Locks the /diagnostics/result request contract the handler relies on. Unknown fields are dropped
// by Zod (the documented footgun), so anything a station sends must be declared here.
describe("DiagnosticResultRequest", () => {
  it("parses a passing keyboard result and drops unknown fields", () => {
    const parsed = DiagnosticResultRequest.parse({
      test: "keyboard",
      outcome: "pass",
      result: { layout: "ansi", keys_registered: keys(KEYBOARD_PASS_MIN_KEYS), note: "all good" },
      detail: "ok",
      hardware_verified: true, // must be dropped, never trusted from a station
    });
    expect(parsed.outcome).toBe("pass");
    if (parsed.test !== "keyboard") throw new Error("expected a keyboard result");
    expect(parsed.result.keys_registered).toHaveLength(KEYBOARD_PASS_MIN_KEYS);
    expect(parsed).not.toHaveProperty("hardware_verified");
  });

  it("rejects a pass that registered too few keys, but allows incomplete/fail", () => {
    const few = { result: { keys_registered: keys(3) } };
    expect(
      DiagnosticResultRequest.safeParse({ test: "keyboard", outcome: "pass", ...few }).success,
    ).toBe(false);
    expect(
      DiagnosticResultRequest.safeParse({ test: "keyboard", outcome: "incomplete", ...few })
        .success,
    ).toBe(true);
    expect(
      DiagnosticResultRequest.safeParse({ test: "keyboard", outcome: "fail", ...few }).success,
    ).toBe(true);
  });

  it("defaults result to an empty key list when omitted", () => {
    const parsed = DiagnosticResultRequest.parse({ test: "keyboard", outcome: "incomplete" });
    if (parsed.test !== "keyboard") throw new Error("expected a keyboard result");
    expect(parsed.result.keys_registered).toEqual([]);
  });

  it("rejects an unknown test or outcome", () => {
    expect(DiagnosticResultRequest.safeParse({ test: "display", outcome: "pass" }).success).toBe(
      false,
    );
    expect(DiagnosticResultRequest.safeParse({ test: "keyboard", outcome: "ok" }).success).toBe(
      false,
    );
  });

  it("rejects more than 200 keys", () => {
    const tooMany = Array.from({ length: 201 }, (_, i) => `SC_${i}`);
    expect(
      DiagnosticResultRequest.safeParse({
        test: "keyboard",
        outcome: "pass",
        result: { keys_registered: tooMany },
      }).success,
    ).toBe(false);
  });
});

describe("DiagnosticResultRequest: full hardware test (boot stick)", () => {
  const kb = (n: number, outcome = "pass") => ({ outcome, keys_registered: keys(n) });
  const full = (outcome: string, tests: Record<string, unknown>) => ({
    test: "full",
    outcome,
    result: { layout: "ansi", tests },
    detail: "x",
  });

  it("accepts a passing run with skipped parts and drops unknown fields", () => {
    const parsed = DiagnosticResultRequest.parse({
      ...full("pass", {
        keyboard: kb(KEYBOARD_PASS_MIN_KEYS),
        webcam: { outcome: "skipped", note: "No webcam fitted" },
        battery: { outcome: "pass", values: { health_pct: 82, status: "Charging", cycles: null } },
        bogus: { outcome: "pass" },
      }),
      hardware_verified: true,
    });
    expect(parsed).not.toHaveProperty("hardware_verified");
    expect(parsed.test === "full" && Object.keys(parsed.result.tests)).toEqual([
      "keyboard",
      "webcam",
      "battery",
    ]);
  });

  it("refuses a pass when the keyboard did not pass or any part failed", () => {
    expect(DiagnosticResultRequest.safeParse(full("pass", { keyboard: kb(5) })).success).toBe(
      false,
    );
    expect(
      DiagnosticResultRequest.safeParse(
        full("pass", { keyboard: kb(30), speakers: { outcome: "fail" } }),
      ).success,
    ).toBe(false);
    expect(
      DiagnosticResultRequest.safeParse(
        full("pass", { keyboard: kb(30), battery: { outcome: "incomplete" } }),
      ).success,
    ).toBe(false);
    expect(
      DiagnosticResultRequest.safeParse(
        full("fail", { keyboard: kb(30), speakers: { outcome: "fail" } }),
      ).success,
    ).toBe(true);
  });

  it("requires the keyboard part and bounds the values", () => {
    expect(DiagnosticResultRequest.safeParse(full("fail", {})).success).toBe(false);
    expect(
      DiagnosticResultRequest.safeParse(
        full("fail", { keyboard: kb(1), battery: { outcome: "great" } }),
      ).success,
    ).toBe(false);
    const many = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`k${i}`, i]));
    expect(
      DiagnosticResultRequest.safeParse(
        full("fail", { keyboard: kb(1), battery: { outcome: "pass", values: many } }),
      ).success,
    ).toBe(false);
    expect(
      DiagnosticResultRequest.safeParse(
        full("fail", {
          keyboard: kb(1),
          battery: { outcome: "pass", values: { a: { nested: 1 } } },
        }),
      ).success,
    ).toBe(false);
  });
});

describe("DiagnosticResultRequest: Windows helper decline", () => {
  it("accepts the helper's decline payload and refuses the old hand-off outcome", () => {
    const declined = {
      test: "full",
      outcome: "incomplete",
      detail: "Declined at the laptop",
      result: { tests: { keyboard: { outcome: "incomplete", note: "Declined at the laptop" } } },
    };
    expect(DiagnosticResultRequest.safeParse(declined).success).toBe(true);
    expect(DiagnosticResultRequest.safeParse({ ...declined, outcome: "handoff" }).success).toBe(
      false,
    );
  });
});

describe("EnrollRequest: org stick key", () => {
  const key = "ndstk_" + "a1".repeat(32);
  const stick = { stick_key: key, stick_id: "0f".repeat(16), stick_part: "boot", name: "Stick" };

  it("accepts a one-time enrollment token as before", () => {
    expect(
      EnrollRequest.safeParse({ enrollment_token: "ndenr_" + "0".repeat(48), name: "S" }).success,
    ).toBe(true);
  });
  it("accepts a stick key with stick id and part", () => {
    expect(EnrollRequest.safeParse({ ...stick, usb_serial: "4C530001" }).success).toBe(true);
  });
  it("refuses both a token and a stick key", () => {
    expect(
      EnrollRequest.safeParse({ ...stick, enrollment_token: "ndenr_" + "0".repeat(48) }).success,
    ).toBe(false);
  });
  it("refuses neither", () => {
    expect(EnrollRequest.safeParse({ name: "S" }).success).toBe(false);
  });
  it("refuses a malformed stick key, stick id or part", () => {
    expect(EnrollRequest.safeParse({ ...stick, stick_key: "ndstk_short" }).success).toBe(false);
    expect(EnrollRequest.safeParse({ ...stick, stick_id: "NOT-HEX" }).success).toBe(false);
    expect(EnrollRequest.safeParse({ ...stick, stick_part: "linux" }).success).toBe(false);
  });
  it("refuses a stick key without a stick id", () => {
    const { stick_id: _omit, ...noId } = stick;
    expect(EnrollRequest.safeParse(noId).success).toBe(false);
  });
});
