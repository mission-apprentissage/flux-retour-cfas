import { Box, Button, Heading, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";

import SignalerAnomalieModal from "./SignalerAnomalieModal";

const SituationOrganisme = ({ uai, nomEtablissement, adresse, siret, outilsGestion, showSendAnomalie = false }) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <Box width="70%" border="1px solid" borderColor="bluefrance" padding="4w" marginTop="6w">
      <Stack spacing="2w">
        <Heading fontSize="gamma">La situation de votre organisme de formation : </Heading>
        <HStack>
          <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
          <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
            N° UAI responsable : {uai}
          </Text>
        </HStack>

        <HStack>
          <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
          <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
            Les informations de votre organisme :
          </Text>
        </HStack>
        <Stack fontSize="epsilon" color="grey.800" marginTop="2w" spacing="0.5w">
          <Text>{nomEtablissement}</Text>
          <Text>{adresse}</Text>
          <Text>SIRET {siret}</Text>
        </Stack>

        {outilsGestion && (
          <HStack>
            <Box as="i" color="bluefrance" fontSize="alpha" className="ri-table-fill" marginRight="2w" />
            <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
              Outil(s) de gestion utilisé(s) : {outilsGestion}
            </Text>
          </HStack>
        )}

        {showSendAnomalie && (
          <>
            <Button width="40%" variant="secondary" marginTop="1w" onClick={onOpen}>
              Signaler une anomalie
            </Button>
            <SignalerAnomalieModal isOpen={isOpen} onClose={onClose} />
          </>
        )}
      </Stack>
    </Box>
  );
};

SituationOrganisme.propTypes = {
  uai: PropTypes.string.isRequired,
  nomEtablissement: PropTypes.string.isRequired,
  adresse: PropTypes.string.isRequired,
  siret: PropTypes.string.isRequired,
  outilsGestion: PropTypes.string,
  showSendAnomalie: PropTypes.bool,
};

export default SituationOrganisme;
