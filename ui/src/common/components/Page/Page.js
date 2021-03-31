import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const Page = ({ children }) => {
  return (
    <Box width="100%" maxWidth="1440px" margin="auto">
      {children}
    </Box>
  );
};

Page.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Page;
