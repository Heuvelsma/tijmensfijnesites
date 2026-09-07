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
        <div className="hero__title-wrap">
          <h1 ref={ref} className="hero__title" aria-label="Tijmens Fijne Sites">
            <span className="hero__line">
              <span className="hero__line-inner" data-split>
                Tijmens
              </span>
            </span>
            <span className="hero__line">
              <span className="hero__line-inner" data-split>
                Fijne Sites
              </span>
            </span>
          </h1>
          <span className="hero__sticker" data-sticker aria-hidden>
            {total} {total === 1 ? "stuk" : "stuks"}
          </span>
        </div>
      </div>
      <div className="hero__aside">
        <p className="hero__lede" data-words>
          Websites die ik goed vind, bewaard zoals ze eruitzien in plaats van als kale link. Klik op een snapshot en je zit op de
          site.
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
