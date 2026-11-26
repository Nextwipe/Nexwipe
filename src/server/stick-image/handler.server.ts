// Upload door for the NexWipe stick image (GitHub Actions → private bucket `artifacts`, folder `stick-image/`). Authenticated only by
// STICK_UPLOAD_TOKEN (a Lovable secret; the same value is a GitHub Actions secret). The token can do exactly two
// things: put pieces/manifests under builds/<version>/ and promote a complete build to latest.json.
// No service role key ever leaves this server.
import {
  PART_RE,
  PIECE_MAX_BYTES,
  STICK_IMAGE_BUCKET,
  STICK_IMAGE_DIR,
  StickImageManifest,
  VERSION_RE,
  manifestProblem,
  sha256Hex,
} from "@/lib/stick-image";

type Storage = {
  put(path: string, body: ArrayBuffer, contentType: string): Promise<void>;
  get(path: string): Promise<ArrayBuffer | null>;
  list(prefix: string): Promise<{ name: string; size: number }[]>;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const fail = (status: number, message: string) => json(status, { error: { message } });

/** Constant-time comparison (compares SHA-256 digests, so lengths never leak). */
export async function tokenMatches(
  header: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || secret.length < 32 || !header?.startsWith("Bearer ")) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    sha256Hex(enc.encode(header.slice(7).trim()).buffer as ArrayBuffer),
    sha256Hex(enc.encode(secret).buffer as ArrayBuffer),
  ]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function handleStickImageRequest(
  request: Request,
  splat: string,
  storage: Storage,
  secret: string | undefined,
): Promise<Response> {
  if (!secret)
    return fail(503, "Stick image upload is not configured (STICK_UPLOAD_TOKEN missing)");
  if (!(await tokenMatches(request.headers.get("authorization"), secret)))
    return fail(401, "Invalid upload token");
  const parts = splat.split("/").filter(Boolean);
  const method = request.method.toUpperCase();

  // PUT upload/<version>/<part-NNN | manifest.json>
  if (method === "PUT" && parts.length === 3 && parts[0] === "upload") {
    const version = parts[1] ?? "";
    const name = parts[2] ?? "";
    if (!VERSION_RE.test(version) || !(PART_RE.test(name) || name === "manifest.json"))
      return fail(400, "Bad version or file name");
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > PIECE_MAX_BYTES) return fail(413, "Piece too large");
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > PIECE_MAX_BYTES)
      return fail(413, "Empty or too large");
    if (name === "manifest.json") {
      let m;
      try {
        m = StickImageManifest.parse(JSON.parse(new TextDecoder().decode(body)));
      } catch {
        return fail(422, "Manifest is not valid");
      }
      const problem =
        manifestProblem(m) ?? (m.version !== version ? "version does not match the path" : null);
      if (problem) return fail(422, `Manifest: ${problem}`);
    }
    await storage.put(
      `builds/${version}/${name}`,
      body,
      name === "manifest.json" ? "application/json" : "application/octet-stream",
    );
    return json(200, { ok: true, path: `builds/${version}/${name}`, bytes: body.byteLength });
  }

  // POST promote/<version>: only a complete build (manifest + every part with the right size) can be promoted.
  if (method === "POST" && parts.length === 2 && parts[0] === "promote") {
    const version = parts[1] ?? "";
    if (!VERSION_RE.test(version)) return fail(400, "Bad version");
    const raw = await storage.get(`builds/${version}/manifest.json`);
    if (!raw) return fail(404, "No such build");
    const m = StickImageManifest.parse(JSON.parse(new TextDecoder().decode(raw)));
    const present = new Map((await storage.list(`builds/${version}`)).map((o) => [o.name, o.size]));
    const missing = m.parts.filter((p) => present.get(p.name) !== p.size).map((p) => p.name);
    if (missing.length)
      return fail(409, `Build is incomplete; missing or wrong size: ${missing.join(", ")}`);
    await storage.put("latest.json", raw, "application/json");
    return json(200, { ok: true, promoted: version });
  }

  return fail(404, "Not found");
}

/** Storage backed by the server's privileged client (bucket is private: no browser policies exist). */
export async function supabaseStickStorage(): Promise<Storage> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const bucket = () => supabaseAdmin.storage.from(STICK_IMAGE_BUCKET);
  const at = (p: string) => `${STICK_IMAGE_DIR}/${p}`; // everything stays inside this folder
  return {
    async put(path, body, contentType) {
      const { error } = await bucket().upload(at(path), body, { upsert: true, contentType });
      if (error) throw new Error(error.message);
    },
    async get(path) {
      const { data, error } = await bucket().download(at(path));
      return error || !data ? null : data.arrayBuffer();
    },
    async list(prefix) {
      const { data, error } = await bucket().list(at(prefix), { limit: 1000 });
      if (error) throw new Error(error.message);
      return (data ?? []).map((o) => ({ name: o.name, size: Number(o.metadata?.["size"] ?? -1) }));
    },
  };
}
