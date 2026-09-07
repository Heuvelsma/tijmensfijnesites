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
      <div className="hero__aside">
        <p className="hero__lede" data-words>
          Websites die ik goed vind, bewaard zoals ze eruitzien in plaats van als kale link. Klik op een snapshot en je zit op de
          site.
        </p>
        <div className="hero__facts" data-fade>
          <div className="hero__fact">
            <span className="eyebrow">Sites</span>
            <b>{total}</b>
          </div>
          {latest ? (
            <div className="hero__fact">
              <span className="eyebrow">Laatst toegevoegd</span>
              <b>
                {latest.title} · {dateFmt.format(new Date(latest.createdAt))}
              </b>
            </div>
          ) : null}
          <div className="hero__fact">
            <span className="eyebrow">Formaat</span>
            <b>1440 × 900, homepage</b>
          </div>
        </div>
      </div>
    </section>
  );
});
