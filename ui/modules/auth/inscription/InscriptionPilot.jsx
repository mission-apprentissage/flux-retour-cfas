import React, { useState } from "react";

import { Box, Text } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";
import { Input } from "../../mon-espace/effectifs/engine/formEngine/components/Input/Input";

export const InscriptionPilot = ({ onEndOfSpecific }) => {
  const [typePilot, setTypePilot] = useState({ value: "", hasError: false, required: true });
  console.log(typePilot.value);
  return (
    <>
      <Text fontWeight="bold">Vous représentez :</Text>
      <Box mt="2w">
        <Input
          {...{
            name: `typePilot`,
            fieldType: "select",
            placeholder: "Séléctionner un opérateur public",
            options: [
              {
                label: "DREETS",
                value: "DREETS",
              },
              {
                label: "DEETS",
                value: "DEETS",
              },
              {
                label: "DRAAF",
                value: "DRAAF",
              },
              {
                label: "Académie",
                value: "ACADEMIE",
              },
              {
                label: "Conseil régional",
                value: "CONSEIL_REGIONAL",
              },
            ],
          }}
          value={typePilot.value}
          onSubmit={(value) => setTypePilot({ value, hasError: false, required: true })}
          w="100%"
        />

        {typePilot.value && (
          <SiretBlock
            onSiretFetched={(result) => onEndOfSpecific({ organismes_appartenance: typePilot.value, result })}
          />
        )}
      </Box>
    </>
  );
};
