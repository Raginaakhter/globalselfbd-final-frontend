import { NextRequest, NextResponse } from "next/server";
import { callBackend, jsonPost } from "@/lib/server/backend";
import { forwardedFor, readJson } from "../_shared";

export async function POST(req: NextRequest) {
  const { phoneNumber } = await readJson(req);
  const { status, body } = await callBackend(
    "/api/auth/forgot-password",
    jsonPost({ phoneNumber }, forwardedFor(req))
  );
  return NextResponse.json(body, { status });
}
