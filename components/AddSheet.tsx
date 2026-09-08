"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { Site } from "@/lib/types";
import { Button } from "./Button";
import { IconArrowRight, IconX } from "./icons";

export type SheetSubmit = { url: string; title: string; refresh: boolean };

type Props = {
  open: boolean;
  /** When set, the sheet edits this site instead of adding a new one. */
  editing?: Site | null;
  /** Bump this whenever the sheet opens so the form starts fresh. */
  resetKey: number;
  /** Error from the server to show inline (wrong password, clashing address). */
  serverError?: string | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: SheetSubmit) => void;
};

function normalize(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const u = new URL(value);
    if (!u.hostname.includes(".")) return null;
    return value;
  } catch {
    return null;
  }
}

/** Sheet for adding a site, or for changing the address and name of an existing one. */
export function AddSheet({
  open,
  editing,
  resetKey,
  serverError,
  busy,
  onClose,
  onSubmit,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const backdrop = el.querySelector(".sheet__backdrop");
    const panel = el.querySelector(".sheet__panel");
    const reduce = prefersReducedMotion();
    if (open) {
      wasOpen.current = true;
      el.classList.add("is-open");
      gsap.killTweensOf([backdrop, panel]);
      gsap.to(backdrop, {
        opacity: 1,
        duration: reduce ? 0 : 0.5,
        ease: "power2.out",
      });
      gsap.fromTo(
        panel,
        { opacity: 0, y: 28, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: reduce ? 0 : 0.8,
          ease: "expo.out",
          onStart: () => input.current?.focus(),
        },
      );
    } else if (wasOpen.current) {
      gsap.killTweensOf([backdrop, panel]);
      gsap.to(backdrop, { opacity: 0, duration: reduce ? 0 : 0.35 });
      gsap.to(panel, {
        opacity: 0,
        y: 16,
        duration: reduce ? 0 : 0.4,
        ease: "power3.in",
        onComplete: () => el.classList.remove("is-open"),
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={root}
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      aria-hidden={!open}
    >
      <div className="sheet__backdrop" onClick={onClose} />
      <SheetForm
        key={resetKey}
        editing={editing ?? null}
        inputRef={input}
        serverError={serverError ?? null}
        busy={Boolean(busy)}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}

type FormProps = {
  editing: Site | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  serverError: string | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: SheetSubmit) => void;
};

/** The fields live in their own component so a fresh key resets them whenever the sheet opens. */
function SheetForm({
  editing,
  inputRef: input,
  serverError,
  busy,
  onClose,
  onSubmit,
}: FormProps) {
  const [url, setUrl] = useState(editing?.url ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [manualRefresh, setManualRefresh] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlError = error ?? serverError;

  const isEdit = Boolean(editing);
  const urlChanged = isEdit && normalize(url) !== editing?.url;
  // Changing the address implies a new snapshot, unless the user decided otherwise.
  const refresh = manualRefresh ?? urlChanged;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalize(url);
    if (!url.trim()) {
      setError("Plak eerst een link.");
      return;
    }
    if (!normalized) {
      setError("Dat ziet er niet uit als een webadres.");
      return;
    }
    setError(null);
    onSubmit({
      url: normalized,
      title: title.trim(),
      refresh: isEdit ? refresh : true,
    });
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
      input.current?.focus();
    } catch {
      input.current?.focus();
    }
  };

  return (
    <form className="sheet__panel" onSubmit={submit}>
      <div className="sheet__head">
        <h2 className="sheet__title" id="sheet-title">
          {isEdit ? "Site aanpassen" : "Nieuwe fijne site"}
        </h2>
        <button
          type="button"
          className="sheet__close"
          onClick={onClose}
          aria-label="Sluiten"
        >
          <IconX size={16} />
        </button>
      </div>

      <label className="field">
        <span className="eyebrow">Webadres</span>
        <input
          ref={input}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <span className={`field__hint${urlError ? " field__error" : ""}`}>
          {urlError ??
            (isEdit
              ? "Verhuisd, hernoemd of gewoon een betere pagina? Pas het adres aan."
              : "Ik maak een snapshot van de homepage op 1440 bij 900. Dat duurt tien tot dertig seconden.")}
        </span>
      </label>

      {isEdit ? (
        <>
          <label className="field field--small">
            <span className="eyebrow">Naam</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={editing?.domain}
              maxLength={60}
              autoComplete="off"
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={refresh}
              onChange={(e) => setManualRefresh(e.target.checked)}
            />
            <span className="check__box" aria-hidden />
            <span>
              Nieuwe snapshot maken{urlChanged ? " (adres is gewijzigd)" : ""}
            </span>
          </label>
        </>
      ) : null}

      <div className="sheet__actions">
        {isEdit ? (
          <span className="sheet__paste">{editing?.domain}</span>
        ) : (
          <button
            type="button"
            className="link-btn sheet__paste"
            onClick={paste}
          >
            Plakken uit klembord
          </button>
        )}
        <Button
          type="submit"
          variant="solid"
          icon={<IconArrowRight size={16} />}
          disabled={busy}
        >
          {busy ? "Even…" : isEdit ? "Opslaan" : "Snapshot maken"}
        </Button>
      </div>
    </form>
  );
}
