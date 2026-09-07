"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

export type LenisRef = { current: Lenis | null };

/** Lenis smooth scrolling wired into GSAP's ticker so ScrollTrigger stays in sync. */
export function useSmoothScroll(): LenisRef {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.105, smoothWheel: true, anchors: true });
    ref.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      ref.current = null;
    };
  }, []);

  return ref;
}
