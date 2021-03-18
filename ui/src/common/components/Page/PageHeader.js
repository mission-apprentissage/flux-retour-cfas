import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import LoggedUserMenu from "../LoggedUserMenu";
import PageTitle from "./PageTitle";

const PageHeader = ({ title, children }) => {
  return (
    <Box background="bluegrey.100" padding="4w" width="100%">
      <Flex justifyContent="space-between" alignItems="start">
        <img src="/brand/Bloc-marque.svg" alt="Bloc marque gouvernement" />
        <LoggedUserMenu />
      </Flex>
      <PageTitle>{title}</PageTitle>
      {children}
    </Box>
  );
};

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
};

export default PageHeader;
