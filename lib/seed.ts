import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getStore, updateIndex } from "./store";
import type { Site } from "./types";
import { cleanTitle, domainOf, makeId } from "./url";

type SeedEntry = { url: string; title: string; file: string | null };

const SEED_DIR = path.join(process.cwd(), "seed");

export async function readSeedList(): Promise<SeedEntry[]> {
  const text = await readFile(path.join(SEED_DIR, "sites.json"), "utf8");
  return JSON.parse(text) as SeedEntry[];
}

/** Imports the bundled start list. Skips sites whose URL is already in the index. */
export async function importSeed(): Promise<{ added: number; skipped: number }> {
  const store = await getStore();
  const entries = await readSeedList();
  const current = await store.readIndex();
  const known = new Set(current.sites.map((s) => s.url));
  const fresh = entries.filter((e) => !known.has(e.url));

  const added: Site[] = [];
  // Upload in small batches so we stay friendly to the store and to function time limits.
  for (let i = 0; i < fresh.length; i += 6) {
    const batch = fresh.slice(i, i + 6);
    const results = await Promise.all(
      batch.map(async (entry) => {
        const id = makeId();
        let image = "";
        if (entry.file) {
          const data = await readFile(path.join(SEED_DIR, "shots", entry.file));
          image = await store.putImage(id, data, "image/webp");
        }
        const site: Site = {
          id,
          url: entry.url,
          domain: domainOf(entry.url),
          title: cleanTitle(entry.title, entry.url),
          image,
          createdAt: new Date().toISOString(),
        };
        return site;
      }),
    );
    added.push(...results);
  }

  if (added.length) {
    await updateIndex((index) => {
      // Keep the original order of the start list, newest additions first overall.
      index.sites = [...added, ...index.sites];
    });
  }
  return { added: added.length, skipped: entries.length - fresh.length };
}
