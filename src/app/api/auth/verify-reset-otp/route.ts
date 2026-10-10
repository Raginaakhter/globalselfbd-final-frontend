import { NextRequest, NextResponse } from "next/server";
import { callBackend, jsonPost } from "@/lib/server/backend";
import { forwardedFor, readJson } from "../_shared";

// Password-reset OTP step: forwards to backend /api/auth/verify-reset-otp and, on success,
// hands the client an opaque reset token (base64url JSON) that carries phone + otp to the final step.
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
