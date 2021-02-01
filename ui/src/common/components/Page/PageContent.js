import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const PageContent = ({ children }) => {
  return (
    <Box paddingX="8w" paddingY="4w">
      {children}
    </Box>
  );
};

PageContent.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageContent;
