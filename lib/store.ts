import type { Site, SiteIndex } from "./types";

export interface SiteStore {
  readonly kind: "blob" | "local";
  readIndex(): Promise<SiteIndex>;
  writeIndex(index: SiteIndex): Promise<void>;
  putImage(id: string, data: Buffer, contentType: string): Promise<string>;
  deleteImage(url: string): Promise<void>;
}

export function emptyIndex(): SiteIndex {
  return { version: 1, updatedAt: new Date().toISOString(), sites: [] };
}

/**
 * Vercel names the token BLOB_READ_WRITE_TOKEN by default, but a custom prefix chosen
 * while connecting the store gives something like FIJN_READ_WRITE_TOKEN. Accept both.
 */
export function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN") && process.env[k]);
  return key ? process.env[key] : undefined;
}

export function hasBlobStore(): boolean {
  return Boolean(blobToken());
}

export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

let cached: SiteStore | null = null;

export async function getStore(): Promise<SiteStore> {
  if (cached) return cached;
  if (hasBlobStore()) {
    const { blobStore } = await import("./store-blob");
    cached = blobStore;
  } else {
    const { localStore } = await import("./store-local");
    cached = localStore;
  }
  return cached;
}

export async function listSites(): Promise<Site[]> {
  const store = await getStore();
  const index = await store.readIndex();
  return index.sites;
}

/** Read, mutate, write. Single user, so a simple last write wins is fine. */
export async function updateIndex(mutate: (index: SiteIndex) => SiteIndex | void): Promise<SiteIndex> {
  const store = await getStore();
  const index = await store.readIndex();
  const next = mutate(index) ?? index;
  next.updatedAt = new Date().toISOString();
  await store.writeIndex(next);
  return next;
}
