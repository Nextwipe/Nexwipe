import { describe, expect, it } from "vitest";
import { downloadStickImage, sha256Hex, type StickImageManifest } from "./stick-image";

const enc = (s: string) => new TextEncoder().encode(s);
const readText = (b: Blob) =>
  new Promise<string>((ok) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.readAsText(b);
  });

async function setup(pieces: string[]) {
  const parts = await Promise.all(
    pieces.map(async (p, i) => ({
      name: `part-${String(i).padStart(3, "0")}`,
      size: enc(p).byteLength,
      sha256: await sha256Hex(enc(p).buffer as ArrayBuffer),
    })),
  );
  const whole = enc(pieces.join(""));
  const manifest: StickImageManifest = {
    version: "v1",
    file: "nexwipe-stick-v1.img.xz",
    size: whole.byteLength,
    sha256: await sha256Hex(whole.buffer as ArrayBuffer),
    parts,
  };
  const urls = pieces.map((_, i) => `https://store/p${i}`);
  return { manifest, urls };
}

const fetchFrom = (bodies: Record<string, string>) =>
  (async (url: string) =>
    new Response(bodies[url] ?? "", { status: url in bodies ? 200 : 404 })) as typeof fetch;

describe("downloadStickImage", () => {
  it("joins the pieces in order and reports progress", async () => {
    const { manifest, urls } = await setup(["abc", "de"]);
    const seen: number[] = [];
    const blob = await downloadStickImage(
      { manifest, urls },
      (done) => seen.push(done),
      fetchFrom({ [urls[0]!]: "abc", [urls[1]!]: "de" }),
    );
    expect(await readText(blob)).toBe("abcde");
    expect(seen.at(-1)).toBe(5);
  });

  it("stops when a piece does not match its fingerprint", async () => {
    const { manifest, urls } = await setup(["abc", "de"]);
    await expect(
      downloadStickImage(
        { manifest, urls },
        () => {},
        fetchFrom({ [urls[0]!]: "abc", [urls[1]!]: "XX" }),
      ),
    ).rejects.toThrow(/part-001/);
  });

  it("stops when a piece cannot be fetched", async () => {
    const { manifest, urls } = await setup(["abc"]);
    await expect(downloadStickImage({ manifest, urls }, () => {}, fetchFrom({}))).rejects.toThrow(
      /part-000/,
    );
  });
});
