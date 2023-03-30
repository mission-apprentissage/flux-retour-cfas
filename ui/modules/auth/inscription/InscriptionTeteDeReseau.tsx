import React from "react";

import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { RESEAUX_CFAS } from "@/common/constants/networksConstants";

const reseaux = Object.values(RESEAUX_CFAS).map(({ nomReseau }) => ({
  label: `${nomReseau}`,
  value: nomReseau,
}));

export const InscriptionTeteDeReseau = ({ setOrganisation }) => {
  return (
    <>
      <FormControl isRequired>
        <FormLabel>Vous représentez le réseau :</FormLabel>
        <Select
          placeholder="Sélectionner votre réseau"
          onChange={(e) =>
            setOrganisation({
              organisation: "tete_de_reseau",
              nom: e.target.value,
            })
          }
        >
          {reseaux.map((reseau, index) => (
            <option value={reseau.value} key={index}>
              {reseau.label}
            </option>
          ))}
        </Select>
      </FormControl>
    </>
  );
};
