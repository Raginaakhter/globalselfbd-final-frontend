import { NextRequest, NextResponse } from "next/server";
import { callBackend, jsonPost } from "@/lib/server/backend";
import { forwardedFor, readJson } from "../_shared";

export async function POST(req: NextRequest) {
  const { resetToken, newPassword, confirmPassword } = await readJson(req);
  let phoneNumber: unknown;
  let otp: unknown;
  try {
    ({ phoneNumber, otp } = JSON.parse(Buffer.from(String(resetToken), "base64url").toString("utf8")));
  } catch {
    return NextResponse.json({ success: false, message: "Reset link is invalid. Please request a new code." }, { status: 400 });
  }
  const { status, body } = await callBackend(
    "/api/auth/reset-password",
    jsonPost({ phoneNumber, otp, password: newPassword, confirmPassword }, forwardedFor(req))
  );
  return NextResponse.json(body, { status });
}
