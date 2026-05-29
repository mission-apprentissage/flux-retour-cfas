"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useEffect, useState } from "react";

import { emitter } from "@/common/emitter";
import { formatRateLimitMessage, RATE_LIMIT_STATUS } from "@/common/rateLimit";

// Endpoints qui gèrent déjà le 429 inline : on n'empile pas la bannière globale par-dessus.
const INLINE_HANDLED_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/resend-activation-email",
  "/api/v1/auth/activation",
  "/api/v1/password/forgotten-password",
  "/api/v1/password/reset-password",
  "/api/v1/organismes/search-by-siret",
  "/api/v1/organismes/search-by-uai",
];

const AUTO_HIDE_MS = 8000;

// Filet global : bannière DSFR sur un 429 non géré inline (tiers api/heavy, dashboards…). Monté à la racine.
export default function RateLimitBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const onHttpError = (response: any) => {
      if (response?.status !== RATE_LIMIT_STATUS) return;
      const url: string = response?.config?.url ?? "";
      if (INLINE_HANDLED_PATHS.some((path) => url.includes(path))) return;

      setMessage(formatRateLimitMessage(response));
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setMessage(null), AUTO_HIDE_MS);
    };

    emitter.on("http:error", onHttpError);
    return () => {
      emitter.off("http:error", onHttpError);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        width: "min(800px, calc(100% - 2rem))",
      }}
    >
      {/* key={message} : réinitialise l'état de fermeture interne du DSFR. */}
      <Alert key={message} severity="warning" closable onClose={() => setMessage(null)} title={message} />
    </div>
  );
}
