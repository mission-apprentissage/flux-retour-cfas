import { useState, useRef, useCallback, useEffect } from "react";

export const useDraggableScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

  const updateScrollPosition = () => {
    if (ref.current) {
      setScrollPosition(ref.current.scrollLeft);
    }
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (ref.current?.offsetLeft ?? 0));
    setScrollLeft(ref.current?.scrollLeft ?? 0);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - (ref.current?.offsetLeft ?? 0);
      const walk = (x - startX) * 2;
      const newScrollLeft = scrollLeft - walk;
      ref.current!.scrollLeft = newScrollLeft;
      setScrollPosition(newScrollLeft);
    },
    [isDragging, startX, scrollLeft]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    } else {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  useEffect(() => {
    const scrollableElement = ref.current;
    if (scrollableElement) {
      scrollableElement.addEventListener("scroll", updateScrollPosition);
    }
    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener("scroll", updateScrollPosition);
      }
    };
  }, [updateScrollPosition]);

  return { ref, onMouseUp, onMouseDown, isDragging, scrollPosition };
};
