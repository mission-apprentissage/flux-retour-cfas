import { Box, ListItem } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const TerritoireOption = ({ isSelected = false, onClick, children }) => {
  return (
    <ListItem
      cursor="pointer"
      onClick={onClick}
      color={isSelected ? "bluefrance" : "grey.800"}
      fontSize="zeta"
      role="button"
      fontWeight="400"
      backgroundColor={isSelected ? "bluesoft.50" : "transparent"}
      padding="1w"
      display="flex"
    >
      <Box _hover={{ textDecoration: "underline" }}>{children}</Box>
      &nbsp;
      {isSelected && <Box fontSize="zeta" as="i" color="bluefrance" className="ri-check-line" textDecoration="none" />}
    </ListItem>
  );
};

TerritoireOption.propTypes = {
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.string.isRequired,
};

export default TerritoireOption;
