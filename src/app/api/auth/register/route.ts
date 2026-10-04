import { NextRequest } from "next/server";
import { callBackend, jsonPost, type BackendSession } from "@/lib/server/backend";
import { forwardedFor, readJson, sessionResponse } from "../_shared";

export async function POST(req: NextRequest) {
  const { name, fullName, phoneNumber, email, password, confirmPassword } = await readJson(req);
  const result = await callBackend<BackendSession>(
    "/api/auth/register",
    jsonPost(
      { fullName: fullName ?? name, phoneNumber, ...(email ? { email } : {}), password, confirmPassword },
      forwardedFor(req)
    )
  );
  return sessionResponse(result);
}
