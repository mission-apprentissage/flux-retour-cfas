import { Box, Button, HStack, Input, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

import { QUERY_KEYS } from "@/common/constants/queryKeys";
import { validateSiret } from "@/common/domain/siret";
import { validateUai } from "@/common/domain/uai";
import { _post } from "@/common/httpClient";
import { queryClient } from "@/common/queryClient";

const CfaTransmissionSection = ({ setOrganismeFound, setOrganismeNotFound }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInputValid, setIsInputValid] = useState<boolean>();

  const submit = async () => {
    // check that input is a valid SIRET or valid UAI
    const shouldFetch = validateUai(searchTerm) || validateSiret(searchTerm);

    setIsInputValid(shouldFetch);
    if (!shouldFetch) {
      return;
    }

    const data = await queryClient.fetchQuery(QUERY_KEYS.SEARCH_CFAS as any, () =>
      _post("/api/v1/organismes/search", { searchTerm })
    );

    if (data?.[0]) {
      setOrganismeFound();
    } else {
      setOrganismeNotFound();
    }
  };

  return (
    <div>
      <Text fontSize="epsilon">Rechercher l&apos;organisme par UAI ou par SIRET :</Text>
      <Text fontSize="omega" color="grey.600">
        Format valide d’un UAI : 7 chiffres et 1 lettre, et d’un SIRET : 14 chiffres
      </Text>
      <Input
        marginTop="1w"
        width="65%"
        placeholder="Ex : 1234567A ou 34012780200000"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <br />
      <Button marginTop="4w" width="15%" onClick={submit} variant="primary">
        Verifier
      </Button>
      {isInputValid === false && (
        <HStack color="error" fontSize="zeta" marginTop="1w">
          <Box as="i" className="ri-alert-line" fontSize="delta" />
          <Text>Le format du SIRET ou de l&apos;UAI n&apos;est pas valide</Text>
        </HStack>
      )}
    </div>
  );
};

CfaTransmissionSection.propTypes = {
  setOrganismeFound: PropTypes.func.isRequired,
  setOrganismeNotFound: PropTypes.func.isRequired,
};
export default CfaTransmissionSection;
