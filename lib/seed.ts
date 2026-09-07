import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getStore, updateIndex } from "./store";
import type { Site } from "./types";
import { cleanTitle, domainOf, makeId } from "./url";

import seedList from "@/seed/sites.json";

type SeedEntry = { url: string; title: string; file: string | null };

const SEED_DIR = path.join(process.cwd(), "seed");

/** The list itself is bundled with the app, so it is always available. Only the images live on disk. */
export async function readSeedList(): Promise<SeedEntry[]> {
  return seedList as SeedEntry[];
}

async function readSeedImage(file: string): Promise<Buffer> {
  try {
    return await readFile(path.join(SEED_DIR, "shots", file));
  } catch {
    throw new Error(`Snapshot ${file} zit niet in deze deployment. Bouw opnieuw of importeer lokaal met npm run dev.`);
  }
}

/** Imports the bundled start list. Skips sites whose URL is already in the index. */
export async function importSeed(): Promise<{ added: number; skipped: number }> {
  const store = await getStore();
  const entries = await readSeedList();
  const current = await store.readIndex();
  const known = new Set(current.sites.map((s) => s.url));
  const fresh = entries.filter((e) => !known.has(e.url));

  const added: Site[] = [];
  const base = Date.now() - fresh.length * 1000;
  // Upload in small batches so we stay friendly to the store and to function time limits.
  for (let i = 0; i < fresh.length; i += 6) {
    const batch = fresh.slice(i, i + 6);
    const results = await Promise.all(
      batch.map(async (entry, j) => {
        const id = makeId();
        const position = i + j;
        let image = "";
        if (entry.file) {
          const data = await readSeedImage(entry.file);
          image = await store.putImage(id, data, "image/webp");
        }
        const site: Site = {
          id,
          url: entry.url,
          domain: domainOf(entry.url),
          title: cleanTitle(entry.title, entry.url),
          image,
          // Later in the list means added later, so the last entry ends up on top.
          createdAt: new Date(base + position * 1000).toISOString(),
        };
        return site;
      }),
    );
    added.push(...results);
  }

  if (added.length) {
    await updateIndex((index) => {
      // The start list reads oldest to newest, the site shows newest first: reverse it on the way in.
      index.sites = [...added.reverse(), ...index.sites];
    });
  }
  return { added: added.length, skipped: entries.length - fresh.length };
}

/**
 * One-off repair for stores that imported the start list before it was reversed. If the seed
 * sites still appear in their original order, flip that block in place and leave everything
 * else (newer additions) where it is. Returns null when nothing needs to change.
 */
export function fixSeedOrder(sites: Site[]): Site[] | null {
  const seedUrls = (seedList as SeedEntry[]).map((e) => e.url);
  const seedSet = new Set(seedUrls);
  const positions: number[] = [];
  sites.forEach((s, i) => {
    if (seedSet.has(s.url)) positions.push(i);
  });
  if (positions.length < 20) return null;
  const currentOrder = positions.map((i) => sites[i].url);
  const expectedOriginal = seedUrls.filter((u) => currentOrder.includes(u));
  const isOriginalOrder = currentOrder.every((u, k) => u === expectedOriginal[k]);
  if (!isOriginalOrder) return null;
  const reversed = positions.map((i) => sites[i]).reverse();
  const next = [...sites];
  positions.forEach((i, k) => {
    next[i] = reversed[k];
  });
  return next;
}
