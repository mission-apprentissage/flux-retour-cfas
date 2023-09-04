import { Box, Text, Radio, RadioGroup, Stack, FormControl, FormLabel, Select } from "@chakra-ui/react";
import React, { useState } from "react";
import { REGIONS_SORTED } from "shared";

import { InscriptionOrganistionChildProps } from "./common";

type TypeCarifOref = "national" | "regional" | undefined;

export const InscriptionCarifOref = ({ setOrganisation }: InscriptionOrganistionChildProps) => {
  const [type, setType] = useState<TypeCarifOref>(undefined);

  return (
    <Box>
      <Text>Vous représentez&nbsp;:</Text>
      <RadioGroup
        onChange={(type: string) => {
          const typedType = type as TypeCarifOref;
          setType(typedType);
          setOrganisation(
            typedType === "national"
              ? {
                  type: "CARIF_OREF_NATIONAL",
                }
              : null
          );
        }}
        value={type}
        mt={3}
      >
        <Stack>
          <Radio value="national">Le réseau national INTERCARIFOREF</Radio>
          <Radio value="regional">Un CARIF OREF régional</Radio>
        </Stack>
      </RadioGroup>
      {type === "regional" && (
        <FormControl isRequired mt={4}>
          <FormLabel>Votre territoire :</FormLabel>
          <Select
            placeholder="Sélectionner un territoire"
            onChange={(e) =>
              setOrganisation({
                type: "CARIF_OREF_REGIONAL",
                code_region: e.target.value,
              })
            }
          >
            {REGIONS_SORTED.map((option, index) => (
              <option value={option.code} key={index}>
                {option.nom}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};
