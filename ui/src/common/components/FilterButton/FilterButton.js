import { Box, Button } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const FilterButton = ({ label, icon, onClick }) => {
  return (
    <Button background="bluesoft.200" onClick={onClick}>
      {icon && <Box fontSize="epsilon" as="i" className={icon} marginRight="1v" />}
      {label}
    </Button>
  );
};

FilterButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

export default FilterButton;
