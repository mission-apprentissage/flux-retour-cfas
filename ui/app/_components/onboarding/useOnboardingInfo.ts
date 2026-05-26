"use client";

import { captureException } from "@sentry/nextjs";
import { useEffect, useState } from "react";

import { _get } from "@/common/httpClient";

export type OnboardingResourceState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

const DEFAULT_ERROR = "Erreur lors du chargement";

/**
 * Hook partagé pour charger une ressource d'onboarding.
 * `url === null` → `idle` (le caller décide quoi afficher, ex. fallback ou erreur).
 */
export function useOnboardingInfo<T>(url: string | null): OnboardingResourceState<T> {
  const [state, setState] = useState<OnboardingResourceState<T>>(() =>
    url ? { status: "loading" } : { status: "idle" }
  );

  useEffect(() => {
    if (!url) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    let cancelled = false;
    (async () => {
      try {
        const data = (await _get(url)) as T;
        if (!cancelled) setState({ status: "success", data });
      } catch (e: any) {
        captureException(e);
        if (!cancelled) {
          const message = e?.json?.data?.message || e?.message || DEFAULT_ERROR;
          setState({ status: "error", message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
