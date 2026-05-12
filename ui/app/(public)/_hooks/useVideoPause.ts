"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "./useReducedMotion";

type UseVideoPauseResult = {
  isPaused: boolean;
  togglePause: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
};

/**
 * Pilote une `<video>` (play/pause natif) avec un état `isPaused` synchronisé.
 *
 * Branche `videoRef` sur l'élément `<video>` (autoplay attendu côté JSX) et `togglePause` sur
 * un bouton. Si `prefers-reduced-motion` est actif au mount, la vidéo est mise en pause et
 * l'état reflète ce choix — le visiteur peut ensuite la relancer manuellement.
 */
export function useVideoPause(): UseVideoPauseResult {
  const prefersReducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion) {
      video.pause();
      setIsPaused(true);
    }
  }, [prefersReducedMotion]);

  const togglePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  }, []);

  return { isPaused, togglePause, videoRef };
}
