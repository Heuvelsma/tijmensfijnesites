"use client";

import { forwardRef } from "react";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { IconPlus, IconSearch, IconX } from "./icons";

type Props = {
  query: string;
  onQuery: (q: string) => void;
  total: number;
  shown: number;
  onAdd: () => void;
};

export const Nav = forwardRef<HTMLElement, Props>(function Nav({ query, onQuery, total, shown, onAdd }, ref) {
  return (
    <header ref={ref} className="nav">
      <div className="nav__pill">
        <a className="nav__brand" href="#top" aria-label="Naar boven">
          <span className="nav__dot" aria-hidden />
          <span className="nav__brand-long">Tijmens Fijne Sites</span>
          <span className="nav__brand-short">TFS</span>
        </a>
        <span className="nav__sep" aria-hidden />
        <label className="nav__search">
          <IconSearch size={16} />
          <span className="sr-only">Zoeken</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Zoeken"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {query ? (
            <button type="button" className="nav__clear" onClick={() => onQuery("")} aria-label="Zoekopdracht wissen">
              <IconX size={12} />
            </button>
          ) : null}
        </label>
        <span className="nav__count" aria-live="polite">
          {query ? (
            <>
              <b>{shown}</b> / {total}
            </>
          ) : (
            <>
              <b>{total}</b> sites
            </>
          )}
        </span>
        <ThemeToggle />
        <Button variant="accent" icon={<IconPlus size={16} stroke={2} />} iconOnlyOnMobile onClick={onAdd} aria-label="Site toevoegen">
          Toevoegen
        </Button>
      </div>
    </header>
  );
});
