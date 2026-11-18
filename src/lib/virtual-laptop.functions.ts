import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VIRTUAL_TEST_RESULT, virtualLaptopReport } from "@/simulator/virtual-laptop";

const Input = z.object({ orgId: z.string().uuid(), tested: z.boolean().default(false) });

/**
 * "Try a virtual laptop": a SIMULATED stick reports a SIMULATED laptop through the real Agent API
 * handler (AGENTS.md: the simulator never uses a separate fake path), so it lands on the board in
 * Pending, labelled Simulated. With `tested`, the caller accepts it and the virtual stick reports a
 * test result, so the laptop moves to Tested. No real hardware exists and nothing is erased.
 */
export const runVirtualLaptop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<{ deviceCode: string | null }> => {
    const { SimAgentClient } = await import("@/simulator/agent-client");
    const { handleAgentRequest } = await import("@/server/agent-api/handler.server");
    const sb = context.supabase;
    const { data: prep, error } = await sb.rpc("simulator_prepare_laptop", { _org: data.orgId });
    if (error) throw new Error(error.message);
    const token = String((prep as { enrollment_token: string }).enrollment_token);

    const agent = new SimAgentClient((req: Request) =>
      handleAgentRequest(
        req,
        new URL(req.url).pathname.replace(/^\/api\/public\/agent\/v1\/?/, ""),
      ),
    );
    const enr = await agent.enroll(token, "Virtual stick (SIMULATED)");
    if (enr.status !== 201 || !agent.agentId)
      throw new Error(`Virtual stick could not connect (${enr.status})`);
    await agent.call("Heartbeat", "POST", "/heartbeat", { state: "idle" });
    const serial = `SIMLAP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const rep = await agent.call(
      "Report laptop",
      "POST",
      "/inventory",
      virtualLaptopReport(serial),
    );
    if (rep.status !== 200) throw new Error(`Virtual laptop could not report (${rep.status})`);

    const { data: disc } = await sb
      .from("agent_discoveries")
      .select("device_code")
      .eq("agent_id", agent.agentId)
      .maybeSingle();
    const deviceCode = disc?.device_code ?? null;

    if (data.tested && deviceCode) {
      const { data: lap } = await sb
        .from("laptops")
        .select("id")
        .eq("org_id", data.orgId)
        .eq("device_code", deviceCode)
        .maybeSingle();
      if (lap) {
        const { error: accErr } = await sb.rpc("accept_laptop", { _laptop: lap.id });
        if (accErr) throw new Error(accErr.message);
      }
      await agent.call("Report test result", "POST", "/diagnostics/result", VIRTUAL_TEST_RESULT);
    }
    return { deviceCode };
  });
