import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DemandeAccesForm from "./DemandeAccesForm";

const DemandeAccesBlock = ({ onSubmit }) => {
  return (
    <Box p="8w" borderColor="bluefrance" border="1px solid" maxWidth="640px">
      <Text fontSize="beta" fontWeight="700" color="grey.800" marginBottom="3w">
        Vous n&apos;avez pas reçu vos identifiants de connexion ?
      </Text>
      <Text fontSize="gamma" color="grey.800" marginBottom="2w">
        Remplissez le formulaire suivant pour recevoir vos identifiants de connexion :
      </Text>
      <DemandeAccesForm onSubmit={onSubmit} />
    </Box>
  );
};

DemandeAccesBlock.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default DemandeAccesBlock;
