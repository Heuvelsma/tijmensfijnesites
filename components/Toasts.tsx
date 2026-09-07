"use client";

export type Toast = { id: number; text: string; kind?: "ok" | "error" };

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast${t.kind === "error" ? " toast--error" : ""}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
