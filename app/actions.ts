"use server";

import { revalidatePath } from "next/cache";
import { captureSite, fetchTitle } from "@/lib/screenshot";
import { importSeed as runSeedImport } from "@/lib/seed";
import { getStore, updateIndex } from "@/lib/store";
import type { Site } from "@/lib/types";
import { cleanTitle, domainOf, makeId, normalizeUrl } from "@/lib/url";

export type ActionResult<T = undefined> = { ok: true; data: T; warning?: string } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  const message = err instanceof Error ? err.message : "Er ging iets mis";
  console.error("[actions]", err);
  return { ok: false, error: message };
}

export async function addSite(rawUrl: string): Promise<ActionResult<Site>> {
  try {
    const url = normalizeUrl(rawUrl);
    const store = await getStore();
    const existing = (await store.readIndex()).sites.find((s) => s.url === url);
    if (existing) return { ok: false, error: "Die staat er al tussen" };

    const id = makeId();
    let image = "";
    let title = "";
    let warning: string | undefined;
    try {
      const capture = await captureSite(url);
      image = await store.putImage(id, capture.image, capture.contentType);
      title = capture.title;
    } catch (err) {
      // Some sites block robots. Save the site anyway; the snapshot can be replaced by hand.
      console.warn("[addSite] snapshot mislukt", err);
      warning = "Opgeslagen zonder snapshot, de site houdt robots buiten. Upload zelf een afbeelding.";
      title = await fetchTitle(url).catch(() => "");
    }
    const site: Site = {
      id,
      url,
      domain: domainOf(url),
      title: cleanTitle(title, url),
      image,
      createdAt: new Date().toISOString(),
    };
    await updateIndex((index) => {
      index.sites = [site, ...index.sites.filter((s) => s.url !== url)];
    });
    revalidatePath("/");
    return { ok: true, data: site, warning };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteSite(id: string): Promise<ActionResult> {
  try {
    const store = await getStore();
    let removed: Site | undefined;
    await updateIndex((index) => {
      removed = index.sites.find((s) => s.id === id);
      index.sites = index.sites.filter((s) => s.id !== id);
    });
    if (removed?.image) await store.deleteImage(removed.image).catch(() => undefined);
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function refreshSnapshot(id: string): Promise<ActionResult<Site>> {
  try {
    const store = await getStore();
    const current = (await store.readIndex()).sites.find((s) => s.id === id);
    if (!current) return { ok: false, error: "Site niet gevonden" };
    const capture = await captureSite(current.url);
    const image = await store.putImage(id, capture.image, capture.contentType);
    const updated: Site = { ...current, image, title: current.title || cleanTitle(capture.title, current.url) };
    await updateIndex((index) => {
      index.sites = index.sites.map((s) => (s.id === id ? updated : s));
    });
    if (current.image) await store.deleteImage(current.image).catch(() => undefined);
    revalidatePath("/");
    return { ok: true, data: updated };
  } catch (err) {
    return fail(err);
  }
}

export async function replaceImage(id: string, formData: FormData): Promise<ActionResult<Site>> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) return { ok: false, error: "Kies een afbeelding" };
    if (file.size > 15 * 1024 * 1024) return { ok: false, error: "Afbeelding is groter dan 15 MB" };
    const sharp = (await import("sharp")).default;
    const image = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(1440, 900, { fit: "cover", position: "top" })
      .webp({ quality: 84 })
      .toBuffer();
    const store = await getStore();
    const current = (await store.readIndex()).sites.find((s) => s.id === id);
    if (!current) return { ok: false, error: "Site niet gevonden" };
    const url = await store.putImage(id, image, "image/webp");
    const updated: Site = { ...current, image: url };
    await updateIndex((index) => {
      index.sites = index.sites.map((s) => (s.id === id ? updated : s));
    });
    if (current.image) await store.deleteImage(current.image).catch(() => undefined);
    revalidatePath("/");
    return { ok: true, data: updated };
  } catch (err) {
    return fail(err);
  }
}

export async function renameSite(id: string, title: string): Promise<ActionResult<Site>> {
  try {
    const clean = title.trim().slice(0, 60);
    if (!clean) return { ok: false, error: "Geef een naam op" };
    let updated: Site | undefined;
    await updateIndex((index) => {
      index.sites = index.sites.map((s) => {
        if (s.id !== id) return s;
        updated = { ...s, title: clean };
        return updated;
      });
    });
    if (!updated) return { ok: false, error: "Site niet gevonden" };
    revalidatePath("/");
    return { ok: true, data: updated };
  } catch (err) {
    return fail(err);
  }
}

export async function importSeed(): Promise<ActionResult<{ added: number; skipped: number }>> {
  try {
    const result = await runSeedImport();
    revalidatePath("/");
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}
