import { SiteApp } from "@/components/SiteApp";
import { readSeedList } from "@/lib/seed";
import { hasBlobStore, isVercel, listSites } from "@/lib/store";

export const dynamic = "force-dynamic";
// Snapshots can take a while (browser start plus a slow site). Vercel honours this per route.
export const maxDuration = 90;

export default async function Page() {
  const needsSetup = isVercel() && !hasBlobStore();
  const [sites, seedCount] = await Promise.all([
    needsSetup ? Promise.resolve([]) : listSites().catch(() => []),
    readSeedList()
      .then((l) => l.length)
      .catch(() => 0),
  ]);
  return <SiteApp initialSites={sites} seedCount={seedCount} needsSetup={needsSetup} />;
}
