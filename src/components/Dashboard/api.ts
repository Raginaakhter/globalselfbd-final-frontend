"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError, useAuth, type ApiResponse } from "@/context/AuthContext";

export type Pagination = NonNullable<ApiResponse<unknown>["pagination"]>;

export const errorMessage = (err: unknown, fallback = "Something went wrong") =>
  err instanceof ApiError || err instanceof Error ? err.message : fallback;

/**
 * Loads a backend resource and reloads whenever `path` changes. Pass `null` to skip loading.
 * Later responses win, so fast filter changes never show stale results.
 */
export function useApiQuery<T>(path: string | null) {
  const { api } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  // Whole response body, for endpoints that send extra top-level fields (e.g. invoice `summary`)
  const [response, setResponse] = useState<(ApiResponse<T> & Record<string, unknown>) | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api<T>(path);
      if (id !== requestId.current) return;
      setData(res.data);
      setPagination(res.pagination ?? null);
      setResponse(res as ApiResponse<T> & Record<string, unknown>);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(errorMessage(err, "Failed to load data"));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [api, path]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  return { data, pagination, response, loading, error, reload: load, setData };
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== "ALL") search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** Uploads images to the backend and returns their URLs. */
export function useImageUpload() {
  const { api } = useAuth();
  return useCallback(
    async (files: File[], folder: "products" | "categories" | "banners" | "brands" | "site") => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      const res = await api<{ urls: string[] }>(`/uploads/images${qs({ folder })}`, { method: "POST", body: form });
      return res.data.urls;
    },
    [api]
  );
}

/** Runs a mutating API call with toast feedback. Resolves with the response, or null when it failed. */
export function useApiAction() {
  const { api } = useAuth();
  return useCallback(
    async <T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}, success?: string) => {
      const { json, ...rest } = init;
      try {
        const res = await api<T>(path, json !== undefined ? { ...rest, body: JSON.stringify(json) } : rest);
        toast.success(success ?? res.message ?? "Saved");
        return res;
      } catch (err) {
        toast.error(errorMessage(err));
        return null;
      }
    },
    [api]
  );
}
