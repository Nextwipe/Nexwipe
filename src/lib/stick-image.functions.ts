import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STICK_IMAGE_BUCKET, STICK_IMAGE_DIR, StickImageManifest } from "@/lib/stick-image";

export type StickImageLinks = { manifest: StickImageManifest; urls: string[] } | null;

/**
 * Short-lived download links for the promoted stick image. Owners/administrators only (with two-step sign-in:
 * checked by has_org_role in the database). The image holds no secrets; links last one hour.
 */
export const getStickImageLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orgId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<StickImageLinks> => {
    const { data: allowed, error } = await context.supabase.rpc("has_org_role", {
      _org: data.orgId,
      _roles: ["owner", "admin"],
    });
    if (error || allowed !== true)
      throw new Error(
        "Only owners and administrators (signed in with two-step verification) can download the stick image",
      );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = supabaseAdmin.storage.from(STICK_IMAGE_BUCKET);
    const latest = await bucket.download(`${STICK_IMAGE_DIR}/latest.json`);
    if (latest.error || !latest.data) return null; // nothing promoted yet
    const manifest = StickImageManifest.parse(JSON.parse(await latest.data.text()));
    const signed = await bucket.createSignedUrls(
      manifest.parts.map((p) => `${STICK_IMAGE_DIR}/builds/${manifest.version}/${p.name}`),
      3600,
    );
    if (signed.error || signed.data.some((s) => !s.signedUrl))
      throw new Error("The stick image is incomplete in storage; ask NexWipe support");
    return { manifest, urls: signed.data.map((s) => s.signedUrl as string) };
  });
