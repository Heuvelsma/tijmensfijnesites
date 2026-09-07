"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/types";
import { IconArrowUpRight } from "./icons";

type Props = { sites: Site[]; total: number };

const SPEED = 60; // pixels per second

/** Endless band of rounded cards with the most recent additions. Moves on its own, pauses on hover. */
export function Reel({ sites, total }: Props) {
  const belt = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  // Make enough copies to cover the viewport twice, then set the speed from the measured width.
  useEffect(() => {
    const el = belt.current;
    if (!el) return;
    const measure = () => {
      const set = el.querySelector<HTMLElement>(".reel__set");
      if (!set) return;
      const width = set.offsetWidth;
      if (!width) return;
      setCopies(Math.max(2, Math.ceil((window.innerWidth * 2) / width)));
      el.style.setProperty("--reel-duration", `${Math.max(20, width / SPEED)}s`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [sites.length]);

  if (!sites.length) return null;

  return (
    <section className="reel" aria-label="Laatst toegevoegd">
      <div className="reel__head">
        <span className="eyebrow">Laatst toegevoegd</span>
        <span className="reel__count">
          {sites.length} van {total}
        </span>
      </div>
      <div className="reel__track" data-reveal>
        <div className="reel__belt" ref={belt} style={{ "--reel-copies": copies } as React.CSSProperties}>
          {Array.from({ length: copies }, (_, c) => (
            <div className="reel__set" key={c} aria-hidden={c > 0}>
              {sites.map((site, i) => (
                <a
                  key={`${c}-${site.id}`}
                  className="reel__card"
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={c > 0 ? -1 : 0}
                  aria-label={`${site.title} openen`}
                >
                  <div className="reel__media">
                    {site.image ? (
                      <Image
                        src={site.image}
                        alt={c === 0 ? `Homepage van ${site.title}` : ""}
                        fill
                        sizes="(max-width: 700px) 72vw, (max-width: 1100px) 42vw, 30vw"
                        quality={78}
                        priority={c === 0 && i < 3}
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
          ))}
        </div>
      </div>
    </section>
  );
}
