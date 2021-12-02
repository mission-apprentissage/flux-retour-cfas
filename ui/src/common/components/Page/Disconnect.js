import { Box, Flex, Link } from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router-dom";

import useAuth from "../../../common/hooks/useAuth";
import { navigationPages } from "../../constants/navigationPages";

const Disconnect = () => {
  const history = useHistory();
  const [, setAuth] = useAuth();

  const logout = () => {
    setAuth(null);
    history.push(navigationPages.Accueil.path);
  };

  return (
    <Flex alignItems="center" fontSize="zeta">
      <Link onClick={logout}>Déconnexion</Link>
      <Box as="i" marginLeft="3v" className="ri-logout-box-r-line"></Box>
    </Flex>
  );
};

export default Disconnect;
