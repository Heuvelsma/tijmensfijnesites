import { del, get, put } from "@vercel/blob";
import type { SiteStore } from "./store";
import { blobAuth, emptyIndex } from "./store";
import type { SiteIndex } from "./types";

const INDEX_PATH = "tfs/index.json";

export const blobStore: SiteStore = {
  kind: "blob",

  async readIndex() {
    const res = await get(INDEX_PATH, { access: "public", useCache: false, ...blobAuth() });
    if (!res || res.statusCode !== 200) return emptyIndex();
    const text = await new Response(res.stream).text();
    try {
      const parsed = JSON.parse(text) as SiteIndex;
      if (!Array.isArray(parsed.sites)) return emptyIndex();
      return parsed;
    } catch {
      return emptyIndex();
    }
  },

  async writeIndex(index) {
    await put(INDEX_PATH, JSON.stringify(index), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
      ...blobAuth(),
    });
  },

  async putImage(id, data, contentType) {
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
    const blob = await put(`tfs/shots/${id}.${ext}`, data, {
      access: "public",
      contentType,
      addRandomSuffix: true,
      ...blobAuth(),
    });
    return blob.url;
  },

  async deleteImage(url) {
    if (!url.includes(".blob.vercel-storage.com/")) return;
    await del(url, blobAuth()).catch(() => undefined);
  },
};
