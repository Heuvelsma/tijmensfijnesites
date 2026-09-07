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

/**
 * Since 2026 Vercel connects a store through OIDC by default: the project only gets
 * BLOB_STORE_ID (plus a rotating VERCEL_OIDC_TOKEN at runtime), no static token.
 * The SDK handles that by itself, so either signal means the store is there.
 */
export function hasBlobStore(): boolean {
  return Boolean(blobToken() || process.env.BLOB_STORE_ID);
}

/** Options to spread into every @vercel/blob call. Only sets token when there is one, so OIDC keeps working. */
export function blobAuth(): { token?: string } {
  const token = blobToken();
  return token ? { token } : {};
}

/** Names (never values) of the environment variables that matter for storage. Used on the status line. */
export function storageEnvNames(): string[] {
  return Object.keys(process.env)
    .filter((k) => /^BLOB_|_READ_WRITE_TOKEN$|^VERCEL_OIDC_TOKEN$/.test(k) && process.env[k])
    .sort();
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
