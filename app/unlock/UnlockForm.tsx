"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { IconArrowRight } from "@/components/icons";
import { unlock, type UnlockState } from "./actions";

export function UnlockForm() {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlock, {});
  return (
    <form className="unlock__form" action={action}>
      <span className="eyebrow">Privé archief</span>
      <div className="unlock__row">
        <label className="field">
          <span className="sr-only">Wachtwoord</span>
          <input type="password" name="password" placeholder="Wachtwoord" autoFocus autoComplete="current-password" required />
        </label>
        <Button type="submit" variant="solid" icon={<IconArrowRight size={16} />} disabled={pending}>
          {pending ? "Even…" : "Binnen"}
        </Button>
      </div>
      <span className={`field__hint${state.error ? " field__error" : ""}`}>{state.error ?? "Eén keer invullen per apparaat."}</span>
    </form>
  );
}
