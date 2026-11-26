import { createFileRoute } from "@tanstack/react-router";

// Stick image upload door for GitHub Actions (STICK_UPLOAD_TOKEN). See src/server/stick-image/handler.server.ts.
async function handle(request: Request, splat: string | undefined) {
  const { handleStickImageRequest, supabaseStickStorage } =
    await import("@/server/stick-image/handler.server");
  return handleStickImageRequest(
    request,
    splat ?? "",
    await supabaseStickStorage(),
    process.env["STICK_UPLOAD_TOKEN"],
  );
}

export const Route = createFileRoute("/api/public/stick-image/$")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      PUT: ({ request, params }) => handle(request, params._splat),
      POST: ({ request, params }) => handle(request, params._splat),
    },
  },
});
