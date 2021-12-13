import { Box, Button, Divider } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const noop = () => {};

const SecondarySelectButton = ({
  children,
  icon,
  onClick,
  isActive = false,
  isClearable = false,
  clearIconOnClick = noop,
}) => {
  const style = isClearable
    ? {
        color: "bluefrance",
        border: "solid 1px",
        borderColor: "bluefrance",
      }
    : {};
  return (
    <Button variant="select-secondary" onClick={onClick} isActive={isActive} {...style}>
      {icon && (
        <Box fontSize="epsilon" as="i" className={icon} marginRight="1v" paddingTop="2px" verticalAlign="middle" />
      )}
      <Box as="span" verticalAlign="middle" textOverflow="ellipsis" maxWidth="600px" overflow="hidden">
        {children}
      </Box>
      {isClearable && (
        <>
          <Divider
            height="22px"
            marginTop="2px"
            marginLeft="1w"
            marginRight="1v"
            orientation="vertical"
            verticalAlign="middle"
            opacity="0.3"
          />
          <Box
            paddingTop="2px"
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
        </>
      )}
    </Button>
  );
};

SecondarySelectButton.propTypes = {
  children: PropTypes.node.isRequired,
  isClearable: PropTypes.bool,
  isActive: PropTypes.bool,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  clearIconOnClick: PropTypes.func,
};

export default SecondarySelectButton;
