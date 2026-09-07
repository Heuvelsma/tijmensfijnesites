"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authEnabled, expectedToken, safeEqual } from "@/lib/auth";

export type UnlockState = { error?: string };

export async function unlock(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  if (!authEnabled()) redirect("/");
  const given = String(formData.get("password") ?? "");
  const wanted = process.env.SITE_PASSWORD ?? "";
  if (!given || !safeEqual(given, wanted)) {
    return { error: "Dat is 'm niet." };
  }
  const jar = await cookies();
  jar.set(AUTH_COOKIE, await expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}
