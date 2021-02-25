import { Box, Button } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const FilterButton = ({ children, icon, onClick }) => {
  return (
    <Button background="bluesoft.200" onClick={onClick}>
      {icon && <Box fontSize="epsilon" as="i" className={icon} marginRight="1v" />}
      {children}
    </Button>
  );
};

FilterButton.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

export default FilterButton;
