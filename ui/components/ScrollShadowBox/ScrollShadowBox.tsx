import { Box } from "@chakra-ui/react";
import React, { useEffect, useState, FC, RefObject } from "react";

interface ScrollShadowBoxProps {
  children: React.ReactNode;
  scrollRef: RefObject<HTMLDivElement>;
  shadowWidth?: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
}

export const ScrollShadowBox: FC<ScrollShadowBoxProps> = ({
  children,
  scrollRef,
  shadowWidth = "5px",
  left = "0",
  right = "0",
  top = "0",
  bottom = "0",
}) => {
  const [showShadowLeft, setShowShadowLeft] = useState(false);
  const [showShadowRight, setShowShadowRight] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = scrollRef.current;
      if (!element) return;

      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      setShowShadowLeft(element.scrollLeft > 0);
      setShowShadowRight(element.scrollLeft < maxScrollLeft);
    };

    const element = scrollRef.current;
    element?.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => element?.removeEventListener("scroll", handleScroll);
  }, [scrollRef]);

  return (
    <Box
      sx={{
        position: "relative",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: top,
          bottom: bottom,
          pointerEvents: "none",
          zIndex: "20",
        },
        "&::before": {
          left: left,
          display: "block",
          width: showShadowLeft ? shadowWidth : "1px",
          background: "linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent)",
        },
        "&::after": {
          right: right,
          width: shadowWidth,
          display: showShadowRight ? "block" : "none",
          background: "linear-gradient(to left, rgba(0, 0, 0, 0.2), transparent)",
        },
      }}
    >
      {children}
    </Box>
  );
};
