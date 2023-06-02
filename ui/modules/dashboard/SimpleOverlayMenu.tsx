import { Box, SystemProps } from "@chakra-ui/react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface SimpleOverlayMenuProps extends SystemProps {
  onClose: () => void;
  children: ReactNode;
}

function SimpleOverlayMenu({ onClose, children, ...props }: SimpleOverlayMenuProps) {
  const menuRef = useRef<any>();
  const [menuMaxHeight, setMenuMaxHeight] = useState("100%");

  useEffect(() => {
    setTimeout(() => {
      const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      // compute max-height for menu considering viewport, current y axis position and the 16px marginTop
      const menuHeight = menuRef?.current
        ? `${viewportHeight - menuRef.current.getBoundingClientRect().y - 16}px`
        : "100%";
      setMenuMaxHeight(menuHeight);
    }, 0);
  }, []);

  return (
    <div>
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        backgroundColor="rgba(0, 0, 0, 0.05)"
        onClick={onClose}
        zIndex="99"
      />
      <Box
        position="absolute"
        maxWidth="var(--chakra-sizes-xl)"
        left="15w"
        right="15w"
        marginTop="2w"
        margin="0 auto"
        zIndex="100"
      >
        <Box
          background="white"
          position="absolute"
          boxShadow="0px 0px 16px rgba(30, 30, 30, 0.16)"
          borderRadius="0.25rem"
          ref={menuRef}
          maxHeight={menuMaxHeight}
          overflow="auto"
          zIndex="100"
          {...props}
        >
          {children}
        </Box>
      </Box>
    </div>
  );
}

export default SimpleOverlayMenu;
