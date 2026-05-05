"use client";

import { useCallback, useRef, useState } from "react";

const GIF_WIDTH = 996;
const GIF_HEIGHT = 560;

export { GIF_WIDTH, GIF_HEIGHT };

type UseGifPauseResult = {
  isPaused: boolean;
  togglePause: () => void;
  imgRef: React.RefObject<HTMLImageElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

export function useGifPause(): UseGifPauseResult {
  const [isPaused, setIsPaused] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const togglePause = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      return;
    }
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.complete) return;
    const w = img.naturalWidth || GIF_WIDTH;
    const h = img.naturalHeight || GIF_HEIGHT;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    setIsPaused(true);
  }, [isPaused]);

  return { isPaused, togglePause, imgRef, canvasRef };
}
