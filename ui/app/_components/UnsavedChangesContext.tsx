"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

type UnsavedChangesContextValue = {
  /** Vrai si un formulaire de la zone a des modifications non enregistrées. */
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  isDirty: false,
  setDirty: () => {},
});

export function UnsavedChangesProvider({ children }: PropsWithChildren) {
  const [isDirty, setDirty] = useState(false);
  return <UnsavedChangesContext.Provider value={{ isDirty, setDirty }}>{children}</UnsavedChangesContext.Provider>;
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

/**
 * À placer dans un formulaire (sous un UnsavedChangesProvider) pour signaler son état « modifié
 * non enregistré » au garde de navigation. Réinitialise l'état au démontage (changement d'onglet/page).
 */
export function TrackFormDirty({ dirty }: { dirty: boolean }) {
  const { setDirty } = useUnsavedChanges();
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
  return null;
}
