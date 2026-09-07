"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { addSite, deleteSite, importSeed, refreshSnapshot, replaceImage } from "@/app/actions";
import { EASE, gsap, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { Site } from "@/lib/types";
import { domainOf } from "@/lib/url";
import { AddSheet } from "./AddSheet";
import { Button } from "./Button";
import { Grid } from "./Grid";
import { GridLines } from "./GridLines";
import { Reel } from "./Reel";
import { Hero } from "./Hero";
import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { IconArrowRight, IconArrowUp, IconPlus } from "./icons";
import type { PendingSite } from "./SiteCard";
import { useSmoothScroll } from "./SmoothScroll";
import { Ticker } from "./Ticker";
import { Toasts, type Toast } from "./Toasts";

type Diagnostics = {
  storage: "blob" | "local" | "none";
  seedCount: number;
  loadError: string | null;
  envNames: string[];
};

type Props = {
  initialSites: Site[];
  seedCount: number;
  needsSetup: boolean;
  diagnostics: Diagnostics;
};

let toastSeq = 0;

/** Puts the hand drawn underline under the last word of the title. */
function placeUnderline(scope: HTMLElement, lastWord: HTMLElement | undefined) {
  const svg = scope.querySelector<SVGElement>("[data-underline]");
  const title = scope.querySelector<HTMLElement>(".hero__title");
  if (!svg || !title || !lastWord) return;
  // Work from layout offsets, which ignore the intro transform on the title. The line is squeezed
  // horizontally around its centre, so map the word's layout position to its visual position.
  const squeeze = parseFloat(getComputedStyle(title).getPropertyValue("--title-squeeze")) || 0.82;
  const centre = title.offsetWidth / 2;
  const visualLeft = centre + (lastWord.offsetLeft - centre) * squeeze;
  const visualWidth = lastWord.offsetWidth * squeeze;
  const bottom = lastWord.offsetTop + lastWord.offsetHeight;
  svg.style.left = `${visualLeft - visualWidth * 0.04}px`;
  svg.style.width = `${visualWidth * 1.08}px`;
  svg.style.top = `${bottom - lastWord.offsetHeight * 0.14}px`;
  svg.style.height = `${Math.max(14, lastWord.offsetHeight * 0.22)}px`;
}

export function SiteApp({ initialSites, seedCount, needsSetup, diagnostics }: Props) {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [pending, setPending] = useState<PendingSite[]>([]);
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [introDone, setIntroDone] = useState(false);
  const [importing, setImporting] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lenis = useSmoothScroll();

  // The server re-renders after every mutation; keep local state in step with it.
  const [seenInitial, setSeenInitial] = useState(initialSites);
  if (initialSites !== seenInitial) {
    setSeenInitial(initialSites);
    setSites(initialSites);
  }

  const visibleIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return new Set(sites.map((s) => s.id));
    return new Set(sites.filter((s) => [s.title, s.domain, s.url].some((v) => v.toLowerCase().includes(q))).map((s) => s.id));
  }, [sites, query]);

  const toast = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, text, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const setBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /* ---------------- actions ---------------- */

  const runAdd = useCallback(
    async (url: string, key: string) => {
      const result = await addSite(url);
      if (result.ok) {
        setPending((p) => p.filter((x) => x.key !== key));
        setSites((prev) => [result.data, ...prev.filter((s) => s.id !== result.data.id)]);
        if (result.warning) toast(result.warning, "error");
        else toast(`Toegevoegd: ${result.data.title}`);
      } else {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, status: "error", message: result.error } : x)));
      }
    },
    [toast],
  );

  const handleAdd = (url: string) => {
    setSheetOpen(false);
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPending((p) => [{ key, url, domain: domainOf(url), status: "working" }, ...p]);
    window.setTimeout(() => {
      if (lenis.current) lenis.current.scrollTo("#grid", { offset: -90 });
      else document.getElementById("grid")?.scrollIntoView({ behavior: "smooth" });
    }, 250);
    void runAdd(url, key);
  };

  const handleRetry = (item: PendingSite) => {
    setPending((p) => p.map((x) => (x.key === item.key ? { ...x, status: "working", message: undefined } : x)));
    void runAdd(item.url, item.key);
  };

  const handleDismiss = (item: PendingSite) => setPending((p) => p.filter((x) => x.key !== item.key));

  const handleDelete = async (site: Site) => {
    const snapshot = sites;
    setSites((prev) => prev.filter((s) => s.id !== site.id));
    const result = await deleteSite(site.id);
    if (result.ok) toast(`Verwijderd: ${site.title}`);
    else {
      setSites(snapshot);
      toast(result.error, "error");
    }
  };

  const handleRefresh = async (site: Site) => {
    setBusy(site.id, true);
    const result = await refreshSnapshot(site.id);
    setBusy(site.id, false);
    if (result.ok) {
      setSites((prev) => prev.map((s) => (s.id === site.id ? result.data : s)));
      toast(`Nieuwe snapshot: ${site.title}`);
    } else toast(result.error, "error");
  };

  const handleReplace = async (site: Site, file: File) => {
    setBusy(site.id, true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await replaceImage(site.id, fd);
    setBusy(site.id, false);
    if (result.ok) {
      setSites((prev) => prev.map((s) => (s.id === site.id ? result.data : s)));
      toast(`Afbeelding vervangen: ${site.title}`);
    } else toast(result.error, "error");
  };

  const handleImport = async () => {
    setImporting(true);
    const result = await importSeed();
    setImporting(false);
    if (result.ok) {
      toast(`${result.data.added} sites geïmporteerd`);
      router.refresh();
    } else toast(result.error, "error");
  };

  /* ---------------- intro choreography ---------------- */

  useGSAP(
    () => {
      const intro = introRef.current;
      const title = titleRef.current;
      const nav = navRef.current;
      const scope = root.current;
      if (!intro || !title || !nav || !scope) return;

      intro.classList.add("is-js");
      const reduce = prefersReducedMotion();
      document.body.classList.add("is-locked");
      lenis.current?.stop();
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);

      // Cards start hidden so they can reveal on scroll once the curtain is gone.
      const cards = scope.querySelectorAll("[data-reveal]");
      if (cards.length) gsap.set(cards, { opacity: 0, y: 48 });

      let cancelled = false;
      let split: SplitText | undefined;
      let words: SplitText | undefined;

      const finish = () => {
        intro.style.display = "none";
        title.classList.add("is-settled");
        document.body.classList.remove("is-locked");
        lenis.current?.start();
        setIntroDone(true);

        // Title drifts and fades as you scroll into the grid.
        const hero = scope.querySelector(".hero");
        if (hero && !reduce) {
          gsap.to(title, {
            yPercent: 22,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          });
        }
        ScrollTrigger.refresh();
      };

      const run = async () => {
        await document.fonts.ready;
        if (cancelled) return;

        const lines = title.querySelectorAll("[data-split]");
        split = SplitText.create(lines, { type: "words,chars", mask: "chars", charsClass: "char", wordsClass: "word" });
        // Masks clip descenders when the line height is tight; give them room without moving anything.
        split.masks.forEach((m) => {
          const el = m as HTMLElement;
          el.style.padding = "0.12em 0.04em 0.2em";
          el.style.margin = "-0.12em -0.04em -0.2em";
        });
        title.classList.add("is-ready");
        placeUnderline(scope, split.words[split.words.length - 1] as HTMLElement | undefined);
        const doodles = scope.querySelectorAll<SVGPathElement>("[data-doodle] path");
        const lede = scope.querySelector("[data-words]");
        words = lede ? SplitText.create(lede, { type: "words", mask: "words", wordsClass: "word" }) : undefined;
        const fades = scope.querySelectorAll("[data-fade]");
        const counter = intro.querySelector<HTMLElement>(".intro__counter");
        const meta = intro.querySelector(".intro__meta");

        if (reduce) {
          finish();
          return;
        }
        gsap.set(doodles, { drawSVG: "0%" });

        const rect = title.getBoundingClientRect();
        // Start a touch below the middle of the screen, then rise into place while the curtain lifts.
        const dy = window.innerHeight * 0.56 - (rect.top + rect.height / 2);
        const sticker = scope.querySelector("[data-sticker]");

        gsap.set(title, { y: dy });
        if (sticker) gsap.set(sticker, { scale: 0, rotation: -30, opacity: 0 });
        gsap.set(split.chars, { yPercent: 115 });
        if (words) gsap.set(words.words, { yPercent: 115 });
        if (fades.length) gsap.set(fades, { opacity: 0, y: 14 });
        gsap.set(nav, { opacity: 0, y: -18 });

        const num = { v: 0 };
        const tl = gsap.timeline({ defaults: { ease: EASE.out }, onComplete: finish });
        tl.to(num, {
          v: 100,
          duration: 1.6,
          ease: "power2.inOut",
          onUpdate: () => {
            if (counter) counter.textContent = String(Math.round(num.v)).padStart(3, "0");
          },
        }, 0)
          .to(split.chars, { yPercent: 0, duration: 1.15, stagger: { each: 0.026, from: "start" } }, 0.2)
          .to(meta, { opacity: 0, duration: 0.45, ease: "power2.out" }, 1.55)
          .to(title, { y: 0, duration: 1.3, ease: EASE.inOut }, 1.65)
          .to(intro, { yPercent: -100, duration: 1.3, ease: EASE.inOut }, 1.65)
          .to(nav, { opacity: 1, y: 0, duration: 1.1 }, 2.45);
        if (sticker) tl.to(sticker, { scale: 1, rotation: -8, opacity: 1, duration: 0.9, ease: "back.out(2.2)" }, 2.55);
        if (doodles.length) tl.to(doodles, { drawSVG: "100%", duration: 0.7, ease: "power2.inOut", stagger: 0.16 }, 2.5);
        if (words) tl.to(words.words, { yPercent: 0, duration: 1, stagger: 0.018 }, 2.45);
        if (fades.length) tl.to(fades, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 2.6);
      };

      void run();

      return () => {
        cancelled = true;
        split?.revert();
        words?.revert();
        document.body.classList.remove("is-locked");
      };
    },
    { scope: root },
  );

  /* ---------------- grid reveal ---------------- */

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope || !introDone) return;

      // Drop triggers that belong to cards which are no longer in the DOM.
      ScrollTrigger.getAll().forEach((st) => {
        const el = st.trigger as Element | undefined;
        if (el && !el.isConnected) st.kill();
      });

      const fresh = gsap.utils.toArray<HTMLElement>("[data-reveal]:not([data-revealed])", scope);
      if (fresh.length) {
        fresh.forEach((c) => (c.dataset.revealed = "1"));
        if (prefersReducedMotion()) {
          gsap.set(fresh, { clearProps: "opacity,transform" });
        } else {
          gsap.set(fresh, { opacity: 0, y: 48 });
          ScrollTrigger.batch(fresh, {
            start: "top 94%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 1.25, ease: EASE.out, stagger: 0.075, overwrite: true }),
          });
        }
      }
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [introDone, sites, pending] },
  );

  /* ---------------- keep the underline in place on resize ---------------- */

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      const onResize = () => {
        const words = scope.querySelectorAll<HTMLElement>(".hero__title .word");
        placeUnderline(scope, words[words.length - 1]);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { scope: root },
  );

  /* ---------------- search transitions ---------------- */

  const firstQuery = useRef(true);
  useGSAP(
    () => {
      if (firstQuery.current) {
        firstQuery.current = false;
        return;
      }
      const scope = root.current;
      if (!scope) return;
      const shown = gsap.utils.toArray<HTMLElement>("[data-card]:not(.is-hidden)", scope);
      if (!prefersReducedMotion()) {
        gsap.fromTo(shown, { opacity: 0.25, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE.out, stagger: 0.015, overwrite: "auto" });
      }
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [query] },
  );

  const openSheet = () => setSheetOpen(true);
  const toTop = () => {
    if (lenis.current) lenis.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const latest = sites[0] ? { title: sites[0].title, createdAt: sites[0].createdAt } : null;
  const isEmpty = sites.length === 0 && pending.length === 0;

  return (
    <div ref={root} className="page">
      <GridLines />
      <Intro ref={introRef} />
      <Nav ref={navRef} query={query} onQuery={setQuery} total={sites.length} shown={visibleIds.size} onAdd={openSheet} />

      <main>
        <Hero ref={titleRef} total={sites.length} latest={latest} />
        <Ticker total={sites.length} />

        {!isEmpty ? <Reel sites={sites.slice(0, 10)} total={sites.length} /> : null}

        <div id="grid">
          {needsSetup ? (
            <div className="notice" data-fade style={{ marginTop: 32 }}>
              <strong>Nog even koppelen.</strong> Deze deployment ziet geen Blob store. Koppel de store in Vercel aan dit project
              (Storage → je store → Projects → Connect to Project, met Production aangevinkt) en deploy daarna opnieuw. De statusregel
              hieronder laat zien welke variabelen deze deployment wel ziet.
            </div>
          ) : null}

          {isEmpty ? (
            <section className="empty" data-fade>
              <h2>Nog helemaal leeg. Dat is ook een soort inspiratie.</h2>
              <p>
                {seedCount > 0
                  ? `Er staat een startlijst klaar met ${seedCount} sites, inclusief snapshots. Importeer die in één keer, of begin met een eigen link.`
                  : "Voeg je eerste site toe. Ik maak er meteen een snapshot van."}
              </p>
              <dl className="status" aria-label="Status">
                <div>
                  <dt>Opslag</dt>
                  <dd>
                    {diagnostics.storage === "blob"
                      ? "Vercel Blob gekoppeld"
                      : diagnostics.storage === "local"
                        ? "Lokaal (.data)"
                        : "Niet gevonden"}
                  </dd>
                </div>
                <div>
                  <dt>Startlijst</dt>
                  <dd>{diagnostics.seedCount > 0 ? `${diagnostics.seedCount} sites klaar` : "Niet gevonden"}</dd>
                </div>
                {diagnostics.storage !== "local" ? (
                  <div>
                    <dt>Variabelen</dt>
                    <dd>{diagnostics.envNames.length ? diagnostics.envNames.join(", ") : "geen gevonden"}</dd>
                  </div>
                ) : null}
                {diagnostics.loadError ? (
                  <div>
                    <dt>Fout</dt>
                    <dd>{diagnostics.loadError}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="empty__actions">
                {seedCount > 0 && !needsSetup ? (
                  <Button variant="solid" icon={<IconArrowRight size={16} />} onClick={handleImport} disabled={importing}>
                    {importing ? "Bezig met importeren…" : `Startlijst importeren (${seedCount})`}
                  </Button>
                ) : null}
                <Button icon={<IconPlus size={16} />} onClick={openSheet}>
                  Site toevoegen
                </Button>
              </div>
            </section>
          ) : (
            <Grid
              ref={gridRef}
              sites={sites}
              visibleIds={visibleIds}
              pending={pending}
              busyIds={busyIds}
              query={query}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              onReplace={handleReplace}
              onRetry={handleRetry}
              onDismiss={handleDismiss}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <span>
          <strong>Tijmens Fijne Sites</strong>
        </span>
        <span>
          {sites.length} {sites.length === 1 ? "site" : "sites"}
        </span>
        <Button size="sm" icon={<IconArrowUp size={15} />} onClick={toTop}>
          Naar boven
        </Button>
      </footer>

      <AddSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSubmit={handleAdd} />
      <Toasts items={toasts} />
    </div>
  );
}
