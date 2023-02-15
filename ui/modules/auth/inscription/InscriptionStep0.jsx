import React from "react";

import { Box, FormControl, FormLabel, VStack, RadioGroup, Radio, Heading } from "@chakra-ui/react";

const typeCompte = {
  organisme_formation: {
    text: "Un CFA ou organisme de formation",
    value: "organisme_formation",
  },
  pilot: {
    text: "Un opérateur public (DREETS, DEETS, DRAAF, Académie, Conseil régional...)",
    value: "pilot",
  },
  tete_de_reseau: {
    text: "Un réseau d'organismes de formation",
    value: "tete_de_reseau",
  },
  autre: {
    text: "Autre",
    value: "autre",
  },
};

const InscriptionStep0 = ({ onSelect, ...props }) => {
  return (
    <Box {...props} flexDirection="column" p={12}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Créer votre compte
      </Heading>
      <Box>
        <FormControl>
          <FormLabel>Je représente :</FormLabel>
          <RadioGroup id="type" name="type" mt={8}>
            <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
              {Object.values(typeCompte).map((item, i) => {
                return (
                  <Radio
                    key={i}
                    value={item.value}
                    onChange={(e) => {
                      onSelect(e.target.value);
                    }}
                    size="lg"
                  >
                    {item.text}
                  </Radio>
                );
              })}
            </VStack>
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );
};

export default InscriptionStep0;
