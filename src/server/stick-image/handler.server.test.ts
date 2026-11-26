import { describe, expect, it } from "vitest";
import { handleStickImageRequest } from "./handler.server";
import { PIECE_MAX_BYTES, sha256Hex } from "@/lib/stick-image";

const SECRET = "s".repeat(40);
const auth = { authorization: `Bearer ${SECRET}` };

function memStorage() {
  const files = new Map<string, ArrayBuffer>();
  return {
    files,
    put: async (p: string, b: ArrayBuffer) => void files.set(p, b),
    get: async (p: string) => files.get(p) ?? null,
    list: async (prefix: string) =>
      [...files.entries()]
        .filter(([k]) => k.startsWith(prefix + "/"))
        .map(([k, v]) => ({ name: k.slice(prefix.length + 1), size: v.byteLength })),
  };
}

const call = (
  st: ReturnType<typeof memStorage>,
  method: string,
  path: string,
  body?: BodyInit,
  headers = auth,
) =>
  handleStickImageRequest(
    new Request(`https://x/${path}`, { method, body: body ?? null, headers }),
    path,
    st,
    SECRET,
  );

async function manifestFor(version: string, pieces: Uint8Array[]) {
  const parts = await Promise.all(
    pieces.map(async (p, i) => ({
      name: `part-${String(i).padStart(3, "0")}`,
      size: p.byteLength,
      sha256: await sha256Hex(p.buffer as ArrayBuffer),
    })),
  );
  const whole = new Uint8Array(pieces.reduce((n, p) => n + p.byteLength, 0));
  let o = 0;
  for (const p of pieces) whole.set(p, (o += p.byteLength) - p.byteLength);
  return JSON.stringify({
    version,
    file: `nexwipe-${version}.img.xz`,
    size: whole.byteLength,
    sha256: await sha256Hex(whole.buffer as ArrayBuffer),
    parts,
  });
}

describe("stick image upload door", () => {
  it("refuses a missing or wrong token, and refuses everything when not configured", async () => {
    const st = memStorage();
    expect((await call(st, "PUT", "upload/v1/part-000", "x", {} as typeof auth)).status).toBe(401);
    expect(
      (await call(st, "PUT", "upload/v1/part-000", "x", { authorization: "Bearer nope" })).status,
    ).toBe(401);
    const r = await handleStickImageRequest(
      new Request("https://x/upload/v1/part-000", { method: "PUT", body: "x", headers: auth }),
      "upload/v1/part-000",
      st,
      undefined,
    );
    expect(r.status).toBe(503);
    expect(st.files.size).toBe(0);
  });

  it("only accepts part-NNN or manifest.json under a safe version", async () => {
    const st = memStorage();
    for (const p of [
      "upload/../x/part-000",
      "upload/v1/latest.json",
      "upload/v1/part-1",
      "upload/v%2F1/part-000",
    ])
      expect([400, 404]).toContain((await call(st, "PUT", p, "x")).status);
    expect(st.files.size).toBe(0);
  });

  it("refuses an oversized piece", async () => {
    const st = memStorage();
    const big = new Uint8Array(PIECE_MAX_BYTES + 1);
    expect((await call(st, "PUT", "upload/v1/part-000", big)).status).toBe(413);
  });

  it("refuses a manifest whose parts do not add up or whose version differs", async () => {
    const st = memStorage();
    const good = JSON.parse(await manifestFor("v1", [new Uint8Array([1, 2, 3])]));
    expect(
      (await call(st, "PUT", "upload/v1/manifest.json", JSON.stringify({ ...good, size: 4 })))
        .status,
    ).toBe(422);
    expect((await call(st, "PUT", "upload/v2/manifest.json", JSON.stringify(good))).status).toBe(
      422,
    );
  });

  it("promotes only a complete build", async () => {
    const st = memStorage();
    const pieces = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
    expect(
      (await call(st, "PUT", "upload/v1/manifest.json", await manifestFor("v1", pieces))).status,
    ).toBe(200);
    expect((await call(st, "PUT", "upload/v1/part-000", pieces[0])).status).toBe(200);
    expect((await call(st, "POST", "promote/v1")).status).toBe(409);
    expect(st.files.has("latest.json")).toBe(false);
    expect((await call(st, "PUT", "upload/v1/part-001", pieces[1])).status).toBe(200);
    expect((await call(st, "POST", "promote/v1")).status).toBe(200);
    expect(JSON.parse(new TextDecoder().decode(st.files.get("latest.json")!)).version).toBe("v1");
    expect((await call(st, "POST", "promote/nope")).status).toBe(404);
  });
});
