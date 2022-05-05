import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const InputLegend = ({ children }) => {
  return (
    <Box as="legend" fontSize="omega" fontStyle="italic" color="grey.600" marginBottom="1w">
      {children}
    </Box>
  );
};

InputLegend.propTypes = {
  children: PropTypes.node.isRequired,
};

export default InputLegend;
