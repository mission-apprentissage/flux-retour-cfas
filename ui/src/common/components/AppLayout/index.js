import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import LeftSideNavigation from "../LeftSideNavigation";

const LEFT_SIDE_NAV_WIDTH = "18.25rem";

const AppLayout = ({ children }) => {
  return (
    <Flex>
      <LeftSideNavigation width={LEFT_SIDE_NAV_WIDTH} />
      <Box marginLeft={LEFT_SIDE_NAV_WIDTH} padding="3rem">
        {children}
      </Box>
    </Flex>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppLayout;
