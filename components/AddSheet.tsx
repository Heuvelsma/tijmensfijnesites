"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Button } from "./Button";
import { IconArrowRight, IconX } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
};

export function AddSheet({ open, onClose, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      gsap.to(backdrop, { opacity: 1, duration: reduce ? 0 : 0.5, ease: "power2.out" });
      gsap.fromTo(
        panel,
        { opacity: 0, y: 28, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: reduce ? 0 : 0.8, ease: "expo.out", onStart: () => input.current?.focus() },
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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) {
      setError("Plak eerst een link.");
      return;
    }
    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      const u = new URL(normalized);
      if (!u.hostname.includes(".")) throw new Error();
    } catch {
      setError("Dat ziet er niet uit als een webadres.");
      return;
    }
    setError(null);
    setValue("");
    onSubmit(normalized);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setValue(text.trim());
      input.current?.focus();
    } catch {
      input.current?.focus();
    }
  };

  return (
    <div ref={root} className="sheet" role="dialog" aria-modal="true" aria-labelledby="add-title" aria-hidden={!open}>
      <div className="sheet__backdrop" onClick={onClose} />
      <form className="sheet__panel" onSubmit={submit}>
        <div className="sheet__head">
          <h2 className="sheet__title" id="add-title">
            Nieuwe fijne site
          </h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Sluiten">
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
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <span className={`field__hint${error ? " field__error" : ""}`}>
            {error ?? "Ik maak een snapshot van de homepage op 1440 bij 900. Dat duurt tien tot dertig seconden."}
          </span>
        </label>
        <div className="sheet__actions">
          <button type="button" className="link-btn sheet__paste" onClick={paste}>
            Plakken uit klembord
          </button>
          <Button type="submit" variant="solid" icon={<IconArrowRight size={16} />}>
            Snapshot maken
          </Button>
        </div>
      </form>
    </div>
  );
}
