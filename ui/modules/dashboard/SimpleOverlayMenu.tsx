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
        ? `${Math.max(viewportHeight - menuRef.current.getBoundingClientRect().y - 16, 200)}px`
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
        background="white"
        overflow="auto"
        marginTop="2w"
        boxShadow="0px 0px 16px rgba(30, 30, 30, 0.16)"
        borderRadius="0.25rem"
        zIndex="100"
        ref={menuRef}
        maxHeight={menuMaxHeight}
        maxWidth="var(--chakra-sizes-xl)"
        {...props}
      >
        {children}
      </Box>
    </div>
  );
}
export default SimpleOverlayMenu;
