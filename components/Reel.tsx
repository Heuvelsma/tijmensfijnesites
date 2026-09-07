"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Site } from "@/lib/types";
import { IconArrowRight, IconArrowUpRight } from "./icons";

type Props = { sites: Site[]; total: number };

/** Horizontal strip with rounded cards for the most recent additions. Native scroll with snap, arrows nudge it along. */
export function Reel({ sites, total }: Props) {
  const track = useRef<HTMLDivElement>(null);

  const nudge = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".reel__card");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.6;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!sites.length) return null;

  return (
    <section className="reel" aria-label="Laatst toegevoegd">
      <div className="reel__head">
        <div className="reel__title">
          <span className="eyebrow">Laatst toegevoegd</span>
          <span className="reel__count">
            {sites.length} van {total}
          </span>
        </div>
        <div className="reel__nav">
          <button type="button" className="reel__arrow" onClick={() => nudge(-1)} aria-label="Vorige">
            <IconArrowRight size={16} />
          </button>
          <button type="button" className="reel__arrow" onClick={() => nudge(1)} aria-label="Volgende">
            <IconArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="reel__track" ref={track} data-lenis-prevent-wheel>
        {sites.map((site, i) => (
          <a
            key={site.id}
            className="reel__card"
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
            aria-label={`${site.title} openen`}
          >
            <div className="reel__media">
              {site.image ? (
                <Image
                  src={site.image}
                  alt={`Homepage van ${site.title}`}
                  fill
                  sizes="(max-width: 700px) 82vw, (max-width: 1100px) 46vw, 32vw"
                  quality={78}
                  priority={i < 2}
                />
              ) : (
                <div className="reel__placeholder">{site.domain}</div>
              )}
            </div>
            <div className="reel__caption">
              <span className="reel__index">{String(i + 1).padStart(2, "0")}</span>
              <span className="reel__name">{site.title}</span>
              <span className="reel__domain">{site.domain}</span>
              <span className="reel__go" aria-hidden>
                <IconArrowUpRight size={14} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
