import { NextResponse } from "next/server";
import { hasBlobStore } from "@/lib/store";

/** Serves snapshots from a private Blob store. Paths carry a random suffix, so responses can be cached forever. */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!hasBlobStore()) return new NextResponse("Not found", { status: 404 });
  const { path } = await ctx.params;
  const pathname = path.map(decodeURIComponent).join("/");
  const { getShot } = await import("@/lib/store-blob");
  try {
    const res = await getShot(pathname);
    if (!res || res.statusCode !== 200) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(res.stream, {
      headers: {
        "content-type": res.blob.contentType || "image/webp",
        "content-length": String(res.blob.size),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[api/blob]", err);
    return new NextResponse("Storage error", { status: 502 });
  }
}
