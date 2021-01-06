import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const PageSectionTitle = ({ children }) => {
  return (
    <Heading fontFamily="Marianne" fontWeight="400" fontSize="gamma">
      {children}
    </Heading>
  );
};

PageSectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageSectionTitle;
