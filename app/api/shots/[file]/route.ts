import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { localShotPath } from "@/lib/store-local";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const p = localShotPath(file);
  if (!p) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await readFile(p);
    const type = file.endsWith(".png") ? "image/png" : file.endsWith(".jpg") ? "image/jpeg" : "image/webp";
    return new NextResponse(new Uint8Array(data), {
      headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
