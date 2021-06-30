import { ListItem } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const FilterOption = ({ isSelected = false, onClick, children }) => {
  return (
    <ListItem
      cursor="pointer"
      onClick={onClick}
      color={isSelected ? "bluefrance" : "grey.800"}
      fontSize="zeta"
      fontWeight={isSelected ? "700" : "400"}
      role="button"
      padding="1w"
      display="flex"
      _hover={{ color: "bluefrance", backgroundColor: "grey.100" }}
    >
      {children}
    </ListItem>
  );
};

FilterOption.propTypes = {
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default FilterOption;
