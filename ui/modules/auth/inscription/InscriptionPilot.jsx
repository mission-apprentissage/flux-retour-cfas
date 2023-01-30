import React, { useState } from "react";

import { Box, Text } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";
import { Input } from "../../mon-espace/effectifs/engine/formEngine/components/Input/Input";

export const InscriptionPilot = ({ onEndOfSpecific }) => {
  const [typePilot, setTypePilot] = useState({ value: "", hasError: false, required: true });
  return (
    <>
      <Text fontWeight="bold">Vous représentez :</Text>
      <Box mt="2w">
        <Input
          {...{
            name: "typePilot",
            fieldType: "select",
            placeholder: "Sélectionner un opérateur public",
            options: [
              {
                label: "D(R)EETS",
                value: "DREETS",
              },
              {
                label: "DDETS",
                value: "DDETS",
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
