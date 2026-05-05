"use client";

import { useEffect, useRef, useState } from "react";

type UseInViewOnceOptions = {
  threshold?: number;
};

type UseInViewOnceResult<T extends Element> = {
  ref: React.RefObject<T>;
  hasEntered: boolean;
};

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
