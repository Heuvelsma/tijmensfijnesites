import { SiteApp } from "@/components/SiteApp";
import { isAdminRequest } from "@/lib/admin";
import { fixSeedOrder, readSeedList } from "@/lib/seed";
import { hasBlobStore, isVercel, listSites, storageEnvNames, updateIndex } from "@/lib/store";

export const dynamic = "force-dynamic";
// Snapshots can take a while (browser start plus a slow site). Vercel honours this per route.
export const maxDuration = 90;

export default async function Page() {
  const isAdmin = await isAdminRequest();
  const onVercel = isVercel();
  const blob = hasBlobStore();
  const needsSetup = onVercel && !blob;
  let loadError: string | null = null;
  const [loaded, seedCount] = await Promise.all([
    needsSetup
      ? Promise.resolve([])
      : listSites().catch((err: unknown) => {
          loadError = err instanceof Error ? err.message : "Onbekende fout";
          return [];
        }),
    readSeedList()
      .then((l) => l.length)
      .catch(() => 0),
  ]);
  let sites = loaded;
  // Stores that imported the start list in the old order get flipped once, then never again.
  const repaired = fixSeedOrder(sites);
  if (repaired) {
    try {
      await updateIndex((index) => {
        index.sites = repaired;
      });
      sites = repaired;
    } catch (err) {
      console.warn("[page] volgorde herstellen mislukt", err);
    }
  }

  return (
    <SiteApp
      isAdmin={isAdmin}
      initialSites={sites}
      seedCount={seedCount}
      needsSetup={needsSetup}
      diagnostics={{ storage: blob ? "blob" : onVercel ? "none" : "local", seedCount, loadError, envNames: storageEnvNames() }}
    />
  );
}
