import { SiteApp } from "@/components/SiteApp";
import { readSeedList } from "@/lib/seed";
import { hasBlobStore, isVercel, listSites, storageEnvNames } from "@/lib/store";

export const dynamic = "force-dynamic";
// Snapshots can take a while (browser start plus a slow site). Vercel honours this per route.
export const maxDuration = 90;

export default async function Page() {
  const onVercel = isVercel();
  const blob = hasBlobStore();
  const needsSetup = onVercel && !blob;
  let loadError: string | null = null;
  const [sites, seedCount] = await Promise.all([
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
  return (
    <SiteApp
      initialSites={sites}
      seedCount={seedCount}
      needsSetup={needsSetup}
      diagnostics={{ storage: blob ? "blob" : onVercel ? "none" : "local", seedCount, loadError, envNames: storageEnvNames() }}
    />
  );
}
