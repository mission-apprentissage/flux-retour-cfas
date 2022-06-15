import { Box, Button, HStack, Input, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

import { validateSiret } from "../../../../../common/domain/siret";
import { validateUai } from "../../../../../common/domain/uai";
import useCfasSearch from "../../../../../common/hooks/useCfasSearch";

const CfaTransmissionSection = ({ setOrganismeFound, setOrganismeNotFound }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isValid, setIsValid] = useState(false);
  const { data: searchResults } = useCfasSearch(searchTerm);

  /**
   * Checks uai existance in API and set form state
   * @param {*} uai
   * @param {*} sirets
  //  */

  const checkOrganisme = async () => {
    if (searchTerm !== "")
      try {
        if ((searchResults[0]?.uai || searchResults[0]?.sirets[0]) !== undefined) {
          setOrganismeFound();
        } else {
          setOrganismeNotFound();
        }
      } catch (error) {
        setOrganismeNotFound();
      }
  };

  return (
    <Stack>
      <Text fontSize="epsilon">Rechercher l&apos;organisme par UAI ou par SIRET :</Text>
      <Text fontSize="omega" color="grey.600">
        Format valide d’une UAI : 7 chiffres et 1 lettre, et d’un SIRET : 14 chiffres
      </Text>
      <Input
        marginTop="1w"
        width="65%"
        placeholder="Ex : 1234567A ou 34012780200000"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <br />
      <Button
        marginTop="4w"
        width="15%"
        onClick={() => (validateUai(searchTerm) || validateSiret(searchTerm) ? checkOrganisme() : setIsValid(true))}
        variant="primary"
      >
        Verifier
      </Button>
      {isValid && (
        <HStack color="error" fontSize="zeta">
          <Box as="i" className="ri-alert-line" fontSize="delta" />
          <Text>Le format du SIRET ou de l&apos;UAI n&apos;est pas valide</Text>
        </HStack>
      )}
    </Stack>
  );
};

CfaTransmissionSection.propTypes = {
  setOrganismeFound: PropTypes.func.isRequired,
  setOrganismeNotFound: PropTypes.func.isRequired,
};
export default CfaTransmissionSection;
