"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Snackbar } from "@mui/material";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AUTO_HIDE_MS = 5000;

type ToastSeverity = "success" | "error" | "warning" | "info";

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  // Incrémenté à chaque nouveau toast : force le redémarrage du timer d'auto-hide et le remount de l'Alert.
  nonce: number;
}

interface MUIToasterContextValue {
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
  toastWarning: (message: string) => void;
  toastInfo: (message: string) => void;
}

const MUIToasterContext = createContext<MUIToasterContextValue | null>(null);

/**
 * Toaster global : le Snackbar MUI gère uniquement le positionnement/portail et l'ouverture, et le contenu
 * est une alerte au thème DSFR (`@codegouvfr/react-dsfr/Alert`). Fonctionnel en App Router, contrairement à
 * `useToaster` (Chakra non monté). Monté une fois dans `Providers`, exposé via `useMUIToaster()`.
 *
 * L'auto-hide est géré manuellement (timer + `nonce`) car l'`autoHideDuration` de MUI est peu fiable avec
 * un enfant custom et un `onClose` recréé à chaque render (notamment en StrictMode).
 */
export function MUIToasterProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success", nonce: 0 });

  const showToast = useCallback(
    (severity: ToastSeverity) => (message: string) =>
      setToast((current) => ({ open: true, message, severity, nonce: current.nonce + 1 })),
    []
  );

  const closeToast = useCallback(() => setToast((current) => ({ ...current, open: false })), []);

  // Auto-hide : un timer relancé à chaque nouveau toast (via `nonce`), nettoyé proprement.
  useEffect(() => {
    if (!toast.open) {
      return;
    }
    const timer = setTimeout(closeToast, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [toast.open, toast.nonce, closeToast]);

  const value = useMemo<MUIToasterContextValue>(
    () => ({
      toastSuccess: showToast("success"),
      toastError: showToast("error"),
      toastWarning: showToast("warning"),
      toastInfo: showToast("info"),
    }),
    [showToast]
  );

  return (
    <MUIToasterContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        onClose={(_event, reason) => {
          if (reason !== "clickaway") {
            closeToast();
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <div>
          <div
            style={{
              maxWidth: 420,
              overflow: "hidden",
              borderRadius: "0.25rem",
              backgroundColor: "var(--background-default-grey, #ffffff)",
              boxShadow: "0 4px 12px rgba(0, 0, 18, 0.16)",
            }}
          >
            <Alert
              key={toast.nonce}
              severity={toast.severity}
              small
              closable
              onClose={closeToast}
              description={toast.message}
            />
          </div>
        </div>
      </Snackbar>
    </MUIToasterContext.Provider>
  );
}

export function useMUIToaster(): MUIToasterContextValue {
  const ctx = useContext(MUIToasterContext);
  if (!ctx) {
    throw new Error("useMUIToaster doit être utilisé dans un MUIToasterProvider");
  }
  return ctx;
}
