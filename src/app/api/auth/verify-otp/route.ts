import { NextRequest } from "next/server";
import { callBackend, jsonPost, type BackendSession } from "@/lib/server/backend";
import { forwardedFor, readJson, sessionResponse } from "../_shared";

// Passwordless login / register: backend verifies the 6-digit OTP and returns the standard
// session payload (access + refresh tokens, user, permissions, menu). Register and login
// are unified — if the identifier is unknown the backend creates the account first.
export async function POST(req: NextRequest) {
  const { identifier, otp, fullName } = await readJson(req);
  const result = await callBackend<BackendSession>(
    "/api/auth/verify-otp",
    jsonPost(
      { identifier, otp, ...(fullName ? { fullName } : {}) },
      forwardedFor(req)
    )
  );
  return sessionResponse(result);
}
