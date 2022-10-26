import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const SituationOrganismeInscription = ({
  uai,
  siret,
  siren,
  nature,
  nom_etablissement,
  reseaux,
  adresse_etablissement,
  region,
  academie,
}) => {
  return (
    <Box width="70%" border="1px solid" borderColor="bluefrance" padding="4w" marginTop="6w" marginBottom="4w">
      <Stack spacing="2w">
        <Heading color="bluefrance" fontSize="gamma">
          La situation de votre organisme de formation :
        </Heading>
        <HStack>
          <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
          <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
            N° UAI de votre organisme : {uai}
          </Text>
        </HStack>

        <HStack>
          <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
          <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
            Les informations de votre organisme :
          </Text>
        </HStack>
        <Stack fontSize="epsilon" color="grey.800" marginTop="2w" spacing="0.5w">
          <Text>
            UAI : <strong>{uai}</strong>
          </Text>
          <Text>
            Nature : <strong>{nature}</strong>
          </Text>
          <Text>
            SIREN : <strong>{siren}</strong>
          </Text>
          <Text>
            SIRET : <strong>{siret}</strong>
          </Text>
          <Text>
            Raison sociale : <strong>{nom_etablissement}</strong>
          </Text>
          <Text>
            Reseaux : <strong>{reseaux.join(", ")}</strong>
          </Text>
          <Text>
            Adresse : <strong>{adresse_etablissement}</strong>
          </Text>
          <Text>
            Région : <strong>{region}</strong>
          </Text>
          <Text>
            Académie : <strong>{academie}</strong>
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

SituationOrganismeInscription.propTypes = {
  uai: PropTypes.string.isRequired,
  nature: PropTypes.string.isRequired,
  siret: PropTypes.string.isRequired,
  siren: PropTypes.string.isRequired,
  nom_etablissement: PropTypes.string.isRequired,
  reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
  adresse_etablissement: PropTypes.string.isRequired,
  region: PropTypes.string.isRequired,
  academie: PropTypes.string.isRequired,
};

export default SituationOrganismeInscription;
