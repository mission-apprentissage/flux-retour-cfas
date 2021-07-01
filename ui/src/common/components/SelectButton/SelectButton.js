import { Box, Button } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const noop = () => {};

const SelectButton = ({ children, icon, onClick, isClearable = false, clearIconOnClick = noop }) => {
  const style = isClearable
    ? {
        color: "bluefrance",
        border: "solid 1px",
        borderColor: "bluefrance",
      }
    : {};
  return (
    <Button variant="select-secondary" onClick={onClick} {...style}>
      {icon && (
        <Box fontSize="epsilon" as="i" className={icon} marginRight="1v" paddingTop="2px" verticalAlign="middle" />
      )}
      <Box as="span" verticalAlign="middle" textOverflow="ellipsis" maxWidth="600px" overflow="hidden">
        {children}
      </Box>
      {isClearable && (
        <Box
          fontSize="epsilon"
          as="i"
          verticalAlign="middle"
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

SelectButton.propTypes = {
  children: PropTypes.node.isRequired,
  isClearable: PropTypes.bool,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  clearIconOnClick: PropTypes.func,
};

export default SelectButton;
