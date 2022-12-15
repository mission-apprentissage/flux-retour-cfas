import { Box, Button } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { forwardRef } from "react";

const PrimarySelectButton = forwardRef(({ children, onClick, isActive }, ref) => {
  return (
    <Button variant="select-primary" onClick={onClick} ref={ref} color="bluefrance">
      <Box as="span" textDecoration="underline" fontSize="gamma">
        {children}
      </Box>
      <Box
        fontSize="gamma"
        marginLeft="1v"
        as="i"
        className={isActive ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
        textDecoration="none"
      />
    </Button>
  );
});

PrimarySelectButton.displayName = "PrimarySelectButton";

PrimarySelectButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default PrimarySelectButton;
