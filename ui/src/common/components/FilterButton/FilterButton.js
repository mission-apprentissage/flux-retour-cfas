import { Box, Button } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const noop = () => {};

const FilterButton = ({ children, icon, onClick, displayClearIcon = false, clearIconOnClick = noop }) => {
  return (
    <Button background="bluesoft.100" onClick={onClick} fontWeight="400">
      {icon && <Box fontSize="epsilon" as="i" className={icon} marginRight="1v" />}
      {children}
      {displayClearIcon && (
        <Box
          fontSize="epsilon"
          as="i"
          className="ri-close-circle-fill"
          marginLeft="1v"
          opacity="0.3"
          _hover={{ opacity: "0.5" }}
          onClick={(event) => {
            event.stopPropagation();
            clearIconOnClick();
          }}
        />
      )}
    </Button>
  );
};

FilterButton.propTypes = {
  children: PropTypes.node.isRequired,
  displayClearIcon: PropTypes.bool,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  clearIconOnClick: PropTypes.func,
};

export default FilterButton;
