import { Box, Link } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { Padlock } from "../../../theme/components/icons";
import { NAVIGATION_PAGES } from "../../constants/navigationPages";

const LoginButton = () => {
  return (
    <Link variant="link" to={NAVIGATION_PAGES.Login.path} as={NavLink}>
      <Padlock verticalAlign="middle" color="bluefrance" h="12px" w="12px" marginRight="1w" />
      <Box as="span" verticalAlign="middle">
        Connexion
      </Box>
    </Link>
  );
};

export default LoginButton;
