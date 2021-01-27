import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const PageSectionTitle = ({ children }) => {
  return (
    <Heading fontWeight="400" fontSize="beta">
      {children}
    </Heading>
  );
};

PageSectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageSectionTitle;
