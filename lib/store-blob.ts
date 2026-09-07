import { del, get, list, put, type GetBlobResult } from "@vercel/blob";
import type { SiteStore } from "./store";
import { blobAuth, emptyIndex } from "./store";
import type { SiteIndex } from "./types";

type Access = "public" | "private";

const INDEX_PREFIX = "tfs/index/";
const SHOTS_PREFIX = "tfs/shots/";
/** Images in a private store are streamed through this route; public stores use the blob URL directly. */
export const PRIVATE_IMAGE_ROUTE = "/api/blob/";

let knownAccess: Access | null =
  process.env.BLOB_ACCESS === "public" || process.env.BLOB_ACCESS === "private" ? process.env.BLOB_ACCESS : null;

function isAccessMismatch(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /access on a (private|public) store|configured with (private|public) access/i.test(message);
}

/**
 * A store is either private or public and that cannot change afterwards. Vercel creates
 * private stores by default nowadays, so try that first and fall back when the store objects.
 * The answer is remembered for the lifetime of the function instance. Set BLOB_ACCESS to skip the probe.
 */
async function withAccess<T>(run: (access: Access) => Promise<T>): Promise<T> {
  const first: Access = knownAccess ?? "private";
  try {
    const out = await run(first);
    knownAccess = first;
    return out;
  } catch (err) {
    if (knownAccess || !isAccessMismatch(err)) throw err;
    const other: Access = first === "private" ? "public" : "private";
    const out = await run(other);
    knownAccess = other;
    return out;
  }
}

async function latestIndexBlob() {
  const { blobs } = await list({ prefix: INDEX_PREFIX, limit: 1000, ...blobAuth() });
  if (!blobs.length) return null;
  return blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1))[0];
}

export const blobStore: SiteStore = {
  kind: "blob",

  async readIndex() {
    // The index is never overwritten: every write is a new, timestamped file. That keeps reads
    // consistent on public stores too, where the CDN may otherwise serve an old version for a minute.
    const latest = await latestIndexBlob();
    if (!latest) return emptyIndex();
    const res = await withAccess((access) => get(latest.url, { access, useCache: false, ...blobAuth() }));
    if (!res || res.statusCode !== 200) return emptyIndex();
    const text = await new Response(res.stream).text();
    try {
      const parsed = JSON.parse(text) as SiteIndex;
      return Array.isArray(parsed.sites) ? parsed : emptyIndex();
    } catch {
      return emptyIndex();
    }
  },

  async writeIndex(index) {
    const name = `${INDEX_PREFIX}${String(Date.now()).padStart(14, "0")}.json`;
    await withAccess((access) =>
      put(name, JSON.stringify(index), {
        access,
        contentType: "application/json",
        addRandomSuffix: false,
        ...blobAuth(),
      }),
    );
    // Keep the two newest versions, drop the rest.
    const { blobs } = await list({ prefix: INDEX_PREFIX, limit: 1000, ...blobAuth() });
    const stale = blobs
      .map((b) => b.pathname)
      .sort()
      .slice(0, -2);
    if (stale.length) await del(stale, blobAuth()).catch(() => undefined);
  },

  async putImage(id, data, contentType) {
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
    const blob = await withAccess((access) =>
      put(`${SHOTS_PREFIX}${id}.${ext}`, data, {
        access,
        contentType,
        addRandomSuffix: true,
        ...blobAuth(),
      }),
    );
    return knownAccess === "private" ? `${PRIVATE_IMAGE_ROUTE}${blob.pathname}` : blob.url;
  },

  async deleteImage(url) {
    if (url.startsWith(PRIVATE_IMAGE_ROUTE)) {
      await del(url.slice(PRIVATE_IMAGE_ROUTE.length), blobAuth()).catch(() => undefined);
    } else if (url.includes(".blob.vercel-storage.com/")) {
      await del(url, blobAuth()).catch(() => undefined);
    }
  },
};

/** Streams a snapshot out of the store, used by the image route for private stores. */
export async function getShot(pathname: string): Promise<GetBlobResult | null> {
  if (!pathname.startsWith(SHOTS_PREFIX) || pathname.includes("..")) return null;
  return withAccess((access) => get(pathname, { access, ...blobAuth() }));
}
