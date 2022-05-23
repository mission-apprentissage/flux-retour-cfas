import { Button, Input, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

import { fetchSearchCfas } from "../../../../../common/api/tableauDeBord";

const AskUniqueURLAskOrganismeSection = ({ setOrganismeFound, setOrganismeNotFound }) => {
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Checks uai existance in API and set form state
   * @param {*} uai
   * @param {*} sirets
  //  */

  const checkOrganisme = async () => {
    if (searchTerm !== "")
      try {
        const data = await fetchSearchCfas({ searchTerm });
        if ((data[0]?.uai || data[0]?.sirets[0]) !== undefined) {
          setOrganismeFound();
        } else {
          setOrganismeNotFound();
        }
      } catch (error) {
        setOrganismeNotFound();
      }
  };

  return (
    <Stack marginTop="2w">
      <Text>Rechercher l&apos;organisme par UAI ou par SIRET:</Text>
      <Input
        placeholder="Rechercher l'organisme par son UAI ou son SIRET"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button onClick={checkOrganisme} variant="primary">
        Verifier
      </Button>
    </Stack>
  );
};

AskUniqueURLAskOrganismeSection.propTypes = {
  setOrganismeFound: PropTypes.func.isRequired,
  setOrganismeNotFound: PropTypes.func.isRequired,
};
export default AskUniqueURLAskOrganismeSection;
