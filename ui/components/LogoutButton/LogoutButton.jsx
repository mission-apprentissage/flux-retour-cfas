import { Box, Link } from "@chakra-ui/react";
import React from "react";
import { useRouter } from "next/router";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import useAuth from "../../hooks/useAuth";

const LogoutButton = () => {
  const { resetAuthState } = useAuth();
  const router = useRouter();

  const logout = () => {
    resetAuthState();
    router.push(NAVIGATION_PAGES.Accueil.path);
  };

  return (
    <Link variant="link" onClick={logout}>
      <Box as="span" verticalAlign="middle">
        Déconnexion
      </Box>
      <Box as="i" verticalAlign="middle" marginLeft="1w" className="ri-logout-box-r-line" />
    </Link>
  );
};

export default LogoutButton;
