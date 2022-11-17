import { Box, Link } from "@chakra-ui/react";
import NavLink from "next/link";
import React from "react";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { Padlock } from "../../theme/components/icons";

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
