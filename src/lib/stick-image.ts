import { z } from "zod";

/**
 * NexWipe stick image in the private Lovable Cloud bucket `artifacts`, folder `stick-image/`, uploaded by GitHub after
 * each main build:
 *   stick-image/builds/<version>/part-000 … part-NNN  pieces of the .img.xz, in order
 *   stick-image/builds/<version>/manifest.json        this manifest
 *   stick-image/latest.json                           copy of the promoted build's manifest ("Download stick image")
 */
export const STICK_IMAGE_BUCKET = "artifacts";
export const STICK_IMAGE_DIR = "stick-image";
export const PIECE_MAX_BYTES = 32 * 1024 * 1024; // fits the server's memory when relayed
export const VERSION_RE = /^[0-9A-Za-z._-]{1,80}$/;
export const PART_RE = /^part-\d{3}$/;

const sha256 = z.string().regex(/^[0-9a-f]{64}$/);

export const StickImageManifest = z.object({
  version: z.string().regex(VERSION_RE),
  file: z.string().regex(/^[0-9A-Za-z._-]{1,120}\.img\.xz$/),
  size: z.number().int().positive(),
  sha256,
  parts: z
    .array(
      z.object({
        name: z.string().regex(PART_RE),
        size: z.number().int().positive().max(PIECE_MAX_BYTES),
        sha256,
      }),
    )
    .min(1)
    .max(200),
});
export type StickImageManifest = z.infer<typeof StickImageManifest>;

/** The parts must add up to the whole file and be numbered 000, 001, … in order. */
export function manifestProblem(m: StickImageManifest): string | null {
  if (m.parts.some((p, i) => p.name !== `part-${String(i).padStart(3, "0")}`))
    return "parts are not numbered in order";
  if (m.parts.reduce((n, p) => n + p.size, 0) !== m.size)
    return "parts do not add up to the file size";
  return null;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Downloads every piece in order, checks each against the manifest's SHA-256 and joins them into one .img.xz.
 * Throws naming the piece that failed; a damaged image is never handed to the user.
 * ponytail: pieces kept in memory (~400 MB); stream to disk with the File System Access API if images grow.
 */
export async function downloadStickImage(
  links: { manifest: StickImageManifest; urls: string[] },
  onProgress: (doneBytes: number, totalBytes: number) => void,
  fetchFn: typeof fetch = fetch,
): Promise<Blob> {
  const { manifest, urls } = links;
  const pieces: ArrayBuffer[] = [];
  let done = 0;
  for (const [i, part] of manifest.parts.entries()) {
    let buf: ArrayBuffer | null = null;
    for (let attempt = 1; attempt <= 3 && !buf; attempt++) {
      try {
        const r = await fetchFn(urls[i] ?? "");
        if (r.ok) buf = await r.arrayBuffer();
      } catch {
        // network hiccup: try again
      }
    }
    if (!buf)
      throw new Error(
        `Could not download ${part.name}. Check the internet connection and try again.`,
      );
    if (buf.byteLength !== part.size || (await sha256Hex(buf)) !== part.sha256)
      throw new Error(`${part.name} arrived damaged (fingerprint does not match). Try again.`);
    pieces.push(buf);
    done += buf.byteLength;
    onProgress(done, manifest.size);
  }
  return new Blob(pieces, { type: "application/x-xz" });
}
