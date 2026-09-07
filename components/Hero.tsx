"use client";

import { forwardRef } from "react";

type Props = {
  total: number;
  latest?: { title: string; createdAt: string } | null;
};

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });

export const Hero = forwardRef<HTMLHeadingElement, Props>(function Hero({ total, latest }, ref) {
  return (
    <section className="hero" id="top">
      <div className="hero__stage">
        <div className="hero__title-wrap" data-title-wrap>
          {/* hand drawn sparkle, top left of the T */}
          <svg className="doodle doodle--sparkle" viewBox="0 0 80 80" aria-hidden data-doodle>
            <path d="M40 58 C 39 44, 40 30, 41 10" />
            <path d="M22 62 C 17 52, 12 42, 6 30" />
            <path d="M58 62 C 63 52, 68 42, 74 30" />
          </svg>
          <h1 ref={ref} className="hero__title" aria-label="Tijmens Fijne Sites">
            <span className="hero__line-inner" data-split>
              Tijmens Fijne Sites
            </span>
          </h1>
          {/* hand drawn underline, positioned under the last word by script */}
          <svg className="doodle doodle--underline" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden data-doodle data-underline>
            <path d="M6 30 C 70 10, 130 46, 200 26 S 330 10, 394 30" />
            <path d="M40 46 C 120 34, 220 52, 372 40" />
          </svg>
          <span className="hero__sticker" data-sticker aria-hidden>
            {total} {total === 1 ? "stuk" : "stuks"}
          </span>
        </div>
      </div>
      <div className="hero__aside">
        <p className="hero__lede" data-words>
          Alle mijn lekkere inspiratie sites, fijn op een rijtje
        </p>
        {latest ? (
          <div className="hero__latest" data-fade>
            <span className="eyebrow">Laatst toegevoegd</span>
            <b>
              {latest.title} · {dateFmt.format(new Date(latest.createdAt))}
            </b>
          </div>
        ) : null}
      </div>
    </section>
  );
});
