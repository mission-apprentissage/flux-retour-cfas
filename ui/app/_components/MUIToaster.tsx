"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import styles from "./MUIToaster.module.css";

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

/** Alert DSFR épinglée en bas à droite. Remplace `useToaster` (Chakra), non monté en App Router. */
export function MUIToasterProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success", nonce: 0 });

  const showToast = useCallback(
    (severity: ToastSeverity) => (message: string) =>
      setToast((current) => ({ open: true, message, severity, nonce: current.nonce + 1 })),
    []
  );

  const closeToast = useCallback(() => setToast((current) => ({ ...current, open: false })), []);

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
      {toast.open && (
        <div className={styles.viewport} role="status" aria-live="polite">
          <div className={styles.toast}>
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
      )}
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
