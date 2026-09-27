import { NextRequest, NextResponse } from "next/server";
import { callBackend, jsonPost } from "@/lib/server/backend";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });

  // A logged-in customer's token links the subscription to their account;
  // the client IP keeps the backend's per-visitor rate limit working.
  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  const ip = req.headers.get("x-forwarded-for");
  if (auth) headers.Authorization = auth;
  if (ip) headers["X-Forwarded-For"] = ip;

  const { status, body } = await callBackend("/api/newsletter", jsonPost(payload, headers));
  return NextResponse.json(body, { status });
}
