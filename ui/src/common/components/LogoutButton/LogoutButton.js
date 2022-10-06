import { Box, Link } from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router-dom";

import { NAVIGATION_PAGES } from "../../constants/navigationPages";
import useAuth from "../../hooks/useAuth";

const LogoutButton = () => {
  const { setAuthFromToken } = useAuth();
  const history = useHistory();

  const logout = () => {
    setAuthFromToken(null);
    history.push(NAVIGATION_PAGES.Accueil.path);
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
