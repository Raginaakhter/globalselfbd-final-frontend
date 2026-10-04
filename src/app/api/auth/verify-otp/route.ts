import { NextRequest, NextResponse } from "next/server";
import { callBackend, jsonPost } from "@/lib/server/backend";
import { forwardedFor, readJson } from "../_shared";

// The backend resets passwords with phoneNumber + OTP. The existing reset screen passes a single
// "resetToken" between steps, so it carries both values (base64url JSON, not a secret beyond the OTP).
export async function POST(req: NextRequest) {
  const { phoneNumber, otp } = await readJson(req);
  const { status, body } = await callBackend(
    "/api/auth/verify-reset-otp",
    jsonPost({ phoneNumber, otp }, forwardedFor(req))
  );
  if (!body.success) return NextResponse.json(body, { status });
  const resetToken = Buffer.from(JSON.stringify({ phoneNumber, otp })).toString("base64url");
  return NextResponse.json({ success: true, message: body.message, data: { resetToken } });
}
