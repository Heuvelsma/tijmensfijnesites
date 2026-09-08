"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Site } from "@/lib/types";
import {
  IconArrowUpRight,
  IconCheck,
  IconPencil,
  IconRefresh,
  IconUpload,
  IconX,
} from "./icons";

export type PendingSite = {
  key: string;
  url: string;
  domain: string;
  status: "working" | "error";
  message?: string;
};

type CardProps = {
  site: Site;
  index: number;
  busy?: boolean;
  hidden?: boolean;
  onDelete: (site: Site) => void;
  onRefresh: (site: Site) => void;
  onReplace: (site: Site, file: File) => void;
  onEdit: (site: Site) => void;
  canEdit: boolean;
};

export function SiteCard({
  site,
  index,
  busy,
  hidden,
  onDelete,
  onRefresh,
  onReplace,
  onEdit,
  canEdit,
}: CardProps) {
  const [confirming, setConfirming] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  const askDelete = () => {
    setConfirming(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setConfirming(false), 4000);
  };

  return (
    <article
      className={`card${confirming ? " is-confirming" : ""}${hidden ? " is-hidden" : ""}`}
      data-card
      data-reveal
      data-id={site.id}
    >
      <a
        className="card__link"
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${site.title} openen`}
      >
        <div className="card__frame">
          <div className="card__media">
            {site.image ? (
              <Image
                className={`card__img${loaded ? " is-loaded" : ""}`}
                src={site.image}
                alt={`Homepage van ${site.title}`}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, (max-width: 1800px) 33vw, 25vw"
                quality={78}
                onLoad={() => setLoaded(true)}
                priority={index < 3}
              />
            ) : (
              <div className="card__placeholder" aria-label="Nog geen snapshot">
                <span className="card__placeholder-domain">{site.domain}</span>
                <span className="card__placeholder-note">
                  Nog geen snapshot. Deze site houdt robots buiten, upload er
                  zelf een.
                </span>
              </div>
            )}
          </div>
          {busy ? <div className="card__shimmer" aria-hidden /> : null}
        </div>
        <div className="card__meta">
          <span className="card__index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="card__title">{site.title}</span>
          <span className="card__domain">{site.domain}</span>
          <span className="card__arrow" aria-hidden>
            <IconArrowUpRight size={15} />
            <IconArrowUpRight size={15} />
          </span>
        </div>
      </a>

      {canEdit ? (
        <div className="card__tools">
          {confirming ? (
            <>
              <button
                type="button"
                className="tool tool--confirm"
                onClick={() => onDelete(site)}
              >
                <IconCheck size={13} stroke={2.4} /> Verwijderen
              </button>
              <button
                type="button"
                className="tool"
                onClick={() => setConfirming(false)}
                aria-label="Annuleren"
              >
                <IconX size={13} stroke={2.2} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="tool"
                onClick={() => onEdit(site)}
                disabled={busy}
                title="Adres of naam aanpassen"
                aria-label="Adres of naam aanpassen"
              >
                <IconPencil size={13} stroke={2.2} />
              </button>
              <button
                type="button"
                className={`tool${busy ? " is-busy" : ""}`}
                onClick={() => onRefresh(site)}
                disabled={busy}
                title="Snapshot opnieuw maken"
                aria-label="Snapshot opnieuw maken"
              >
                <IconRefresh size={13} stroke={2.2} />
              </button>
              <button
                type="button"
                className="tool"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                title="Eigen afbeelding gebruiken"
                aria-label="Eigen afbeelding gebruiken"
              >
                <IconUpload size={13} stroke={2.2} />
              </button>
              <button
                type="button"
                className="tool tool--danger"
                onClick={askDelete}
                title="Verwijderen"
                aria-label="Verwijderen"
              >
                <IconX size={13} stroke={2.2} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onReplace(site, f);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}

type PendingProps = {
  item: PendingSite;
  index: number;
  onRetry: (item: PendingSite) => void;
  onDismiss: (item: PendingSite) => void;
};

export function PendingCard({ item, index, onRetry, onDismiss }: PendingProps) {
  const error = item.status === "error";
  return (
    <article
      className={`card card--pending${error ? " card--error" : ""}`}
      data-card
      data-reveal
      data-pending
    >
      <div className="card__frame">
        {!error ? <div className="card__shimmer" aria-hidden /> : null}
        <div className="card__status" role="status">
          {error ? (
            <>
              <strong>Snapshot mislukt</strong>
              <span>{item.message ?? "Probeer het nog eens"}</span>
              <div className="card__status-actions">
                <button
                  type="button"
                  className="tool"
                  onClick={() => onRetry(item)}
                >
                  <IconRefresh size={13} stroke={2.2} /> Opnieuw
                </button>
                <button
                  type="button"
                  className="tool"
                  onClick={() => onDismiss(item)}
                  aria-label="Sluiten"
                >
                  <IconX size={13} stroke={2.2} />
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="card__status-dot" aria-hidden />
              <strong>Snapshot maken</strong>
              <span>{item.domain} · dit duurt tien tot dertig seconden</span>
            </>
          )}
        </div>
      </div>
      <div className="card__meta">
        <span className="card__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="card__title">{item.domain}</span>
        <span className="card__domain">{error ? "niet gelukt" : "bezig…"}</span>
      </div>
    </article>
  );
}
