import { Box, Button, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import LoginForm from "./LoginForm.js";

const LoginBlock = ({ onSubmit, onOpenDemandeActivationCompte }) => {
  return (
    <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
      <LoginForm onSubmit={onSubmit} />
      <Text marginTop="6w" color="grey.800">
        Vous avez perdu votre mot de passe ou n&apos;avez pas reçu vos identifiants de connexion ?
      </Text>
      <Button variant="secondary" marginTop="1w" onClick={onOpenDemandeActivationCompte}>
        Activer ou réactiver mon compte
      </Button>
    </Box>
  );
};

LoginBlock.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onOpenDemandeActivationCompte: PropTypes.func.isRequired,
};

export default LoginBlock;
