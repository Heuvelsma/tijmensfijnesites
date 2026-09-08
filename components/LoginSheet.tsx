"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Button } from "./Button";
import { IconArrowRight, IconX } from "./icons";

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
};

/** Small sheet with one field: the admin password. */
export function LoginSheet({ open, busy, error, onClose, onSubmit }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);
  const [password, setPassword] = useState("");

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
    if (!password) return;
    onSubmit(password);
    setPassword("");
  };

  return (
    <div ref={root} className="sheet" role="dialog" aria-modal="true" aria-labelledby="login-title" aria-hidden={!open}>
      <div className="sheet__backdrop" onClick={onClose} />
      <form className="sheet__panel sheet__panel--narrow" onSubmit={submit}>
        <div className="sheet__head">
          <h2 className="sheet__title" id="login-title">
            Beheer
          </h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Sluiten">
            <IconX size={16} />
          </button>
        </div>
        <label className="field">
          <span className="eyebrow">Wachtwoord</span>
          <input
            ref={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="•••••"
          />
          <span className={`field__hint${error ? " field__error" : ""}`}>
            {error ?? "Eén keer inloggen per apparaat. Daarna kun je sites toevoegen, aanpassen en verwijderen."}
          </span>
        </label>
        <div className="sheet__actions">
          <span className="sheet__paste">Bezoekers zien alles, alleen bewerken vraagt dit.</span>
          <Button type="submit" variant="solid" icon={<IconArrowRight size={16} />} disabled={busy || !password}>
            {busy ? "Even…" : "Binnen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
