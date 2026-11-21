import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/backend";

// Same-origin proxy to the Express API: /api/v1/<path> -> BACKEND_URL/api/<path>.
// The browser sends its access token as a Bearer header; this route never reads cookies,
// so auth endpoints that rotate tokens stay behind /api/auth/*.
// user-agent + client IP headers let the backend derive device/browser/OS and location for analytics.
const FORWARD_HEADERS = ["authorization", "content-type", "accept", "x-forwarded-for", "x-real-ip", "user-agent"];

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  // GET/PUT auth/me (profile) is fine here; everything else under auth rotates tokens.
  if (path[0] === "auth" && !(path.length === 2 && path[1] === "me")) {
    return NextResponse.json({ success: false, message: "Use /api/auth/* for authentication" }, { status: 404 });
  }

  const url = `${BACKEND_URL}/api/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Cannot reach the server. Please try again shortly." }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
