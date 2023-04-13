import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";

const OverlayMenu = ({ onClose, children, width, fixedHorizon = false }) => {
  const menuRef = useRef();
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
        background="white"
        overflow="auto"
        left={fixedHorizon ? {} : "15w"}
        right={fixedHorizon ? {} : "15w"}
        marginTop="2w"
        paddingX="8w"
        paddingY="3w"
        boxShadow="0px 0px 16px rgba(30, 30, 30, 0.16)"
        borderRadius="0.25rem"
        zIndex="100"
        ref={menuRef}
        maxHeight={menuMaxHeight}
        width={width ?? {}}
      >
        {children}
      </Box>
    </div>
  );
};

OverlayMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  width: PropTypes.string,
  fixedHorizon: PropTypes.bool,
};

export default OverlayMenu;
