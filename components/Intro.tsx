"use client";

import { forwardRef } from "react";

/** The curtain that covers the page while the title settles into place. Driven by SiteApp. */
export const Intro = forwardRef<HTMLDivElement>(function Intro(_, ref) {
  return (
    <div ref={ref} className="intro" aria-hidden>
      <div className="intro__meta">
        <span>Fijne sites laden</span>
        <span className="intro__counter">000</span>
      </div>
    </div>
  );
});
