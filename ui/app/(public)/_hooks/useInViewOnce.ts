"use client";

import { useEffect, useRef, useState } from "react";

type UseInViewOnceOptions = {
  threshold?: number;
};

type UseInViewOnceResult<T extends Element> = {
  ref: React.RefObject<T>;
  hasEntered: boolean;
};

/**
 * Passe `hasEntered` à `true` la première fois que l'élément référencé entre dans le viewport.
 *
 * Utilise un `IntersectionObserver` qui se déconnecte dès le premier déclenchement (one-shot).
 * Branche `ref` sur l'élément à observer et lis `hasEntered` pour déclencher animations/lazy-loads.
 */
export function useInViewOnce<T extends Element>({ threshold = 0 }: UseInViewOnceOptions = {}): UseInViewOnceResult<T> {
  const ref = useRef<T>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, hasEntered };
}
