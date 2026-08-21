"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

export function useDismissible(storageKey: string) {
  const [dismissed, setDismissed] = useLocalStorage(storageKey, false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    document.getElementById("contenu")?.focus();
  }, [setDismissed]);

  return { visible: mounted && !dismissed, dismiss };
}
