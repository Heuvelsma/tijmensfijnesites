"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme";
import { IconMoon, IconSun } from "./icons";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function hasStoredChoice(): boolean {
  try {
    return Boolean(localStorage.getItem(THEME_KEY));
  } catch {
    return false;
  }
}

/** The DOM attribute is the source of truth; React just mirrors it. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (hasStoredChoice()) return;
    document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
  };
  mq.addEventListener("change", onSystem);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", onSystem);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  };

  return (
    <button
      type="button"
      className="theme"
      onClick={toggle}
      aria-label={theme === "dark" ? "Schakel naar licht" : "Schakel naar donker"}
      title={theme === "dark" ? "Licht" : "Donker"}
    >
      <IconSun size={18} />
      <IconMoon size={18} />
    </button>
  );
}
