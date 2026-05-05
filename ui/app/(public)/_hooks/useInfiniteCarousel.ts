"use client";

import { useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "./useReducedMotion";

const TRANSITION_DURATION = 500;

type UseInfiniteCarouselOptions = {
  count: number;
  autoplayInterval?: number;
  // Pause supplémentaire pilotée par le composant (ex: carte dépliée dans TemoignagesSection)
  extraPaused?: boolean;
};

type UseInfiniteCarouselResult = {
  position: number;
  transitionEnabled: boolean;
  animationActive: boolean;
  activeIndex: number;
  goToNext: () => void;
  goToPrevious: () => void;
  togglePause: () => void;
};

export function useInfiniteCarousel({
  count,
  autoplayInterval = 6000,
  extraPaused = false,
}: UseInfiniteCarouselOptions): UseInfiniteCarouselResult {
  const [position, setPosition] = useState(count);
  const [rawTransitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const goToNext = useCallback(() => {
    setTransitionEnabled(true);
    setPosition((p) => p + 1);
  }, []);

  const goToPrevious = useCallback(() => {
    setTransitionEnabled(true);
    setPosition((p) => p - 1);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  // Bascule invisible vers la copie centrale du track pour donner l'illusion d'un carrousel infini
  useEffect(() => {
    if (position < count || position >= 2 * count) {
      const timeout = setTimeout(() => {
        setTransitionEnabled(false);
        setPosition((p) => {
          if (p >= 2 * count) return p - count;
          if (p < count) return p + count;
          return p;
        });
      }, TRANSITION_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [position, count]);

  // Réactive la transition désactivée par la bascule invisible à la frame suivante
  useEffect(() => {
    if (!rawTransitionEnabled) {
      const id = requestAnimationFrame(() => setTransitionEnabled(true));
      return () => cancelAnimationFrame(id);
    }
  }, [rawTransitionEnabled]);

  useEffect(() => {
    if (isPaused || prefersReducedMotion || extraPaused) return;
    const interval = setInterval(goToNext, autoplayInterval);
    return () => clearInterval(interval);
  }, [isPaused, prefersReducedMotion, extraPaused, goToNext, autoplayInterval]);

  const activeIndex = ((position % count) + count) % count;
  const transitionEnabled = rawTransitionEnabled && !prefersReducedMotion;
  const animationActive = !isPaused && !prefersReducedMotion;

  return { position, transitionEnabled, animationActive, activeIndex, goToNext, goToPrevious, togglePause };
}
