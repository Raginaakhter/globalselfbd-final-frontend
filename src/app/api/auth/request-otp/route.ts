import { NextRequest, NextResponse } from "next/server";
import { callBackend, jsonPost } from "@/lib/server/backend";
import { forwardedFor, readJson } from "../_shared";

// Passwordless OTP request. Backend detects whether identifier is an email or BD phone and
// sends the 6-digit code via Resend / Mocean respectively. In production the OTP is never
// in the response — in dev the backend may include data.devOnly.otp, which we pass through.
// Body is exactly { identifier }; fullName belongs to /verify-otp (used on register).
export async function POST(req: NextRequest) {
  const { identifier } = await readJson(req);
  const { status, body } = await callBackend(
    "/api/auth/request-otp",
    jsonPost({ identifier }, forwardedFor(req))
  );
  return NextResponse.json(body, { status });
}
