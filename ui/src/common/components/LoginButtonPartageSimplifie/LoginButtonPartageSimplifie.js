import { Box, Link, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { DemandeActivationCompteModal, LoginModal } from "../../../pages/partage-simplifie/login/index.js";
import { Padlock } from "../../../theme/components/icons";

const LoginButtonPartageSimplifie = () => {
  const { isOpen: isOpenLogin, onOpen: onOpenLogin, onClose: onCloseLogin } = useDisclosure();
  const {
    isOpen: isOpenDemandeActivationCompte,
    onOpen: onOpenDemandeActivationCompte,
    onClose: onCloseDemandeActivationCompte,
  } = useDisclosure();

  return (
    <>
      <Link variant="link" onClick={onOpenLogin}>
        <Padlock verticalAlign="middle" color="bluefrance" h="12px" w="12px" marginRight="1w" />
        <Box as="span" verticalAlign="middle">
          Connexion
        </Box>
      </Link>
      <LoginModal
        isOpen={isOpenLogin}
        onClose={onCloseLogin}
        onOpenDemandeActivationCompte={onOpenDemandeActivationCompte}
      />
      <DemandeActivationCompteModal isOpen={isOpenDemandeActivationCompte} onClose={onCloseDemandeActivationCompte} />
    </>
  );
};

export default LoginButtonPartageSimplifie;
