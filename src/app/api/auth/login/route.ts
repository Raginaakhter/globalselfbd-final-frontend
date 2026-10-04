import { NextRequest } from "next/server";
import { callBackend, jsonPost, type BackendSession } from "@/lib/server/backend";
import { forwardedFor, readJson, sessionResponse } from "../_shared";

// Backend accepts either phoneNumber (new default) or email (admin / legacy). Pass through whichever the client sent.
export async function POST(req: NextRequest) {
  const { email, phoneNumber, password } = await readJson(req);
  const payload = phoneNumber ? { phoneNumber, password } : { email, password };
  const result = await callBackend<BackendSession>("/api/auth/login", jsonPost(payload, forwardedFor(req)));
  return sessionResponse(result);
}
