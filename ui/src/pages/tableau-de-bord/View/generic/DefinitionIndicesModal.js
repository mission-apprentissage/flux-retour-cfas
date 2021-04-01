import { Box, Heading, List, ListItem, Text, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { InfoModal } from "../../../../common/components";
import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../../../common/constants/statutsColors";

const IndiceDefinition = ({ indice, color, children }) => {
  return (
    <ListItem display="flex" alignItems="flex-start">
      <Box whiteSpace="nowrap">
        <Box display="inline-flex" borderRadius="50%" background={color} height="1rem" width="1rem" mr="1w" />
        <strong>{indice}&nbsp;:&nbsp;</strong>
      </Box>
      <Text>{children}</Text>
    </ListItem>
  );
};

IndiceDefinition.propTypes = {
  indice: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const DefinitionIndicesModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Box as="legend" onClick={onOpen} fontSize="zeta" cursor="pointer">
        <span>définition des indices</span>
        &nbsp;
        <Box as="i" className="ri-information-fill" />
      </Box>

      <InfoModal title="Définition des indices" onClose={onClose} isOpen={isOpen}>
        <Heading fontWeight="400" fontSize="gamma">
          Effectifs
        </Heading>
        <List spacing="3w" marginTop="3w" color="grey.800">
          <IndiceDefinition indice="Apprenti" color={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis}>
            a signé un contrat d&apos;apprentissage
          </IndiceDefinition>
          <IndiceDefinition indice="Apprenant sans contrat" color={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits}>
            est affecté à un groupe classe et/ou a démarré sa formation mais n&apos;a pas encore signé de contrat
            (stagiaires dela formation professionelle compris)
          </IndiceDefinition>
          <IndiceDefinition indice="Abandon" color={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}>
            apprenti ou inscrit qui a quitté le centre de formation
          </IndiceDefinition>
        </List>
      </InfoModal>
    </>
  );
};

export default DefinitionIndicesModal;
