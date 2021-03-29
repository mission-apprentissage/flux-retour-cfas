import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const ValidationStateBadge = ({ children, fullOpacity = true }) => {
  return (
    <Text
      background="greensoft.100"
      padding="3v"
      color="bluefrance"
      fontWeight="700"
      fontSize="omega"
      opacity={fullOpacity ? "1" : "0.7"}
    >
      {children}
    </Text>
  );
};

ValidationStateBadge.propTypes = {
  children: PropTypes.node.isRequired,
  fullOpacity: PropTypes.bool,
};

export default ValidationStateBadge;
