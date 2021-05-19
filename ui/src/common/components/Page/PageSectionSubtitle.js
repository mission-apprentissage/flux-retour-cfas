import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const PageSectionSubtitle = ({ children }) => {
  return (
    <Heading fontWeight="400" fontSize="gamma">
      {children}
    </Heading>
  );
};

PageSectionSubtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageSectionSubtitle;
