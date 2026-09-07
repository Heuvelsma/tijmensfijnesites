import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SiteStore } from "./store";
import { emptyIndex } from "./store";
import type { SiteIndex } from "./types";

const ROOT = path.join(process.cwd(), ".data");
const INDEX = path.join(ROOT, "index.json");
const SHOTS = path.join(ROOT, "shots");

async function ensure() {
  await mkdir(SHOTS, { recursive: true });
}

export const localStore: SiteStore = {
  kind: "local",

  async readIndex() {
    try {
      const text = await readFile(INDEX, "utf8");
      const parsed = JSON.parse(text) as SiteIndex;
      return Array.isArray(parsed.sites) ? parsed : emptyIndex();
    } catch {
      return emptyIndex();
    }
  },

  async writeIndex(index) {
    await ensure();
    await writeFile(INDEX, JSON.stringify(index, null, 2));
  },

  async putImage(id, data, contentType) {
    await ensure();
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
    const name = `${id}-${Date.now().toString(36)}.${ext}`;
    await writeFile(path.join(SHOTS, name), data);
    return `/api/shots/${name}`;
  },

  async deleteImage(url) {
    const name = url.split("/").pop();
    if (!name || !/^[\w.-]+$/.test(name)) return;
    await rm(path.join(SHOTS, name), { force: true });
  },
};

export function localShotPath(name: string): string | null {
  if (!/^[\w.-]+$/.test(name)) return null;
  return path.join(SHOTS, name);
}
