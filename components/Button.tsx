"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "solid" | "accent";
  size?: "md" | "sm";
  icon?: ReactNode;
  iconOnlyOnMobile?: boolean;
  children: ReactNode;
};

/** Pill button with the blurred blob that slides in on hover. */
export function Button({ variant = "outline", size = "md", icon, iconOnlyOnMobile, className = "", children, ...rest }: Props) {
  const classes = [
    "btn",
    variant !== "outline" ? `btn--${variant}` : "",
    size === "sm" ? "btn--sm" : "",
    iconOnlyOnMobile ? "btn--icon-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...rest}>
      <span className="btn__blob" aria-hidden />
      <span className="btn__label">{children}</span>
      {icon ? <span className="btn__icon">{icon}</span> : null}
    </button>
  );
}
