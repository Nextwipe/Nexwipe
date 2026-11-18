import { describe, expect, it } from "vitest";
import { DiagnosticResultRequest, InventoryRequest } from "@/lib/agent-api/schemas";
import { VIRTUAL_TEST_RESULT, virtualLaptopReport } from "./virtual-laptop";

describe("virtual laptop payloads", () => {
  it("the report passes the agent API's inventory rules", () => {
    expect(InventoryRequest.safeParse(virtualLaptopReport("SIMLAP-1234ABCD")).success).toBe(true);
  });
  it("the test result passes the agent API's diagnostic rules", () => {
    const r = DiagnosticResultRequest.safeParse(VIRTUAL_TEST_RESULT);
    expect(r.success ? "ok" : r.error.message).toBe("ok");
  });
});
