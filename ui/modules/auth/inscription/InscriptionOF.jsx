import React, { useState } from "react";

import { Box, Text, Radio, RadioGroup, Stack } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";
import { UaiBlock } from "./components/UaiBlock";

export const InscriptionOF = ({ onEndOfSpecific }) => {
  const [typeOfSearch, setTypeOfSearch] = useState("");

  return (
    <Box>
      {!typeOfSearch && (
        <>
          <Text fontWeight="bold">Vous êtes un CFA ou organisme de formation.</Text>
          <Box mt="2w">
            <Text fontSize={15}>Au choix, indiquez l’UAI ou SIRET de votre établissement :</Text>
            <RadioGroup onChange={setTypeOfSearch} value={typeOfSearch} mt={3}>
              <Stack direction="row">
                <Radio value="uai">UAI</Radio>
                <Radio value="siret">SIRET</Radio>
              </Stack>
            </RadioGroup>
          </Box>
        </>
      )}
      {typeOfSearch === "siret" && <SiretBlock onSiretFetched={onEndOfSpecific} organismeFormation />}
      {typeOfSearch === "uai" && <UaiBlock onUaiFetched={onEndOfSpecific} />}
    </Box>
  );
};
