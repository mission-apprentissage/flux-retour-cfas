import { Box, Button } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const PrimarySelectButton = ({ children, onClick, isOpen }) => {
  return (
    <Button variant="select-primary" onClick={onClick}>
      <Box as="span" textDecoration="underline">
        {children}
      </Box>
      <Box
        fontSize="gamma"
        marginLeft="1v"
        as="i"
        className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
        textDecoration="none"
      />
    </Button>
  );
};

PrimarySelectButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default PrimarySelectButton;
