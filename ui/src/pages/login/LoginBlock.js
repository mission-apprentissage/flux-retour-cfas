import { useDisclosure } from "@chakra-ui/hooks";
import { Box, Button, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import AskIdentifiantsModal from "./AskIdentifiantsModal/AskIdentifiantsModal";
import LoginForm from "./LoginForm";

const LoginBlock = ({ onSubmit }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" minWidth="420px">
      <LoginForm onSubmit={onSubmit} />
      <Text marginTop="4w" color="grey.800">
        Vous n&apos;avez pas reçu vos identifiants de connexion ?
      </Text>
      <Button variant="secondary" marginTop="2w" onClick={onOpen}>
        Demander mes identifiants
      </Button>
      <AskIdentifiantsModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

LoginBlock.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default LoginBlock;
