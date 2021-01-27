import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const PageTitle = ({ children }) => {
  return (
    <Heading fontFamily="Marianne" fontSize="alpha" fontWeight="700" color="grey.800" as="h1" textAlign="center">
      {children}
    </Heading>
  );
};

PageTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageTitle;
