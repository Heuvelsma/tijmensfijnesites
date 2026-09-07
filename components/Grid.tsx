"use client";

import { forwardRef } from "react";
import type { Site } from "@/lib/types";
import { PendingCard, SiteCard, type PendingSite } from "./SiteCard";

type Props = {
  sites: Site[];
  visibleIds: Set<string>;
  pending: PendingSite[];
  busyIds: Set<string>;
  query: string;
  onDelete: (site: Site) => void;
  onRefresh: (site: Site) => void;
  onReplace: (site: Site, file: File) => void;
  onRetry: (item: PendingSite) => void;
  onDismiss: (item: PendingSite) => void;
};

export const Grid = forwardRef<HTMLDivElement, Props>(function Grid(
  { sites, visibleIds, pending, busyIds, query, onDelete, onRefresh, onReplace, onRetry, onDismiss },
  ref,
) {
  const shown = sites.filter((s) => visibleIds.has(s.id)).length;
  return (
    <section className="grid-wrap" aria-label="Sites">
      <div className="grid-head">
        <span className="eyebrow">{query ? `Resultaten voor “${query}”` : "Alle sites"}</span>
        <span className="grid-head__count">
          {query ? `${shown} van ${sites.length}` : `${sites.length} ${sites.length === 1 ? "site" : "sites"}`}
        </span>
      </div>
      <div ref={ref} className="grid">
        {pending.map((item, i) => (
          <PendingCard key={item.key} item={item} index={i} onRetry={onRetry} onDismiss={onDismiss} />
        ))}
        {sites.map((site, i) => (
          <SiteCard
            key={site.id}
            site={site}
            index={pending.length + i}
            hidden={!visibleIds.has(site.id)}
            busy={busyIds.has(site.id)}
            onDelete={onDelete}
            onRefresh={onRefresh}
            onReplace={onReplace}
          />
        ))}
      </div>
      {query && shown === 0 ? (
        <div className="empty" style={{ borderTop: 0 }}>
          <h2>Niets gevonden.</h2>
          <p>Geen site met “{query}” in de naam of het adres. Misschien is het tijd om ’m toe te voegen.</p>
        </div>
      ) : null}
    </section>
  );
});
