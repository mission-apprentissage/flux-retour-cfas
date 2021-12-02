import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const Badge = ({ children, backgroundColor }) => {
  return (
    <Box
      as="legend"
      fontSize="omega"
      paddingX="1v"
      paddingY="2px"
      fontWeight="700"
      backgroundColor={backgroundColor}
      color="white"
    >
      {children}
    </Box>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  backgroundColor: PropTypes.string.isRequired,
};

export default Badge;
