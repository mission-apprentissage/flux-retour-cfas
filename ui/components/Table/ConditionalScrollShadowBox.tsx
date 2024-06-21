import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { useDraggableScroll } from "@/hooks/useDraggableScroll";

import { ScrollShadowBox } from "../ScrollShadowBox/ScrollShadowBox";

interface ConditionalScrollShadowBoxProps {
  children: React.ReactNode;
  tableWidth: number;
  leftPosition?: number;
  rightPosition?: number;
  enableHorizontalScroll?: boolean;
}

const ConditionalScrollShadowBox: React.FC<ConditionalScrollShadowBoxProps> = ({
  children,
  tableWidth,
  leftPosition,
  rightPosition,
  enableHorizontalScroll = false,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, onMouseUp, onMouseDown, isDragging } = useDraggableScroll();
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      setHasHorizontalScroll(tableWidth > width);
    }
  }, [tableWidth, children]);

  return (
    <Box ref={containerRef} position="relative" overflow="hidden" width="100%" height="100%" {...props}>
      {enableHorizontalScroll && hasHorizontalScroll ? (
        <ScrollShadowBox scrollRef={ref} left={`${leftPosition}px`} right={`${rightPosition}px`} bottom="16px">
          <Box
            ref={ref}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseUp}
            onMouseUp={onMouseUp}
            position="relative"
            overflowX="auto"
            width="100%"
            cursor={isDragging ? "grabbing" : "grab"}
            userSelect="none"
          >
            {children}
          </Box>
        </ScrollShadowBox>
      ) : (
        <>{children}</>
      )}
    </Box>
  );
};

export default ConditionalScrollShadowBox;
