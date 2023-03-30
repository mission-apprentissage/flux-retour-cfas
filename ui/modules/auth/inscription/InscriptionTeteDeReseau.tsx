import React from "react";

import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { TETE_DE_RESEAUX } from "@/common/constants/networksConstants";

export const InscriptionTeteDeReseau = ({ setOrganisation }) => {
  return (
    <>
      <FormControl isRequired>
        <FormLabel>Vous représentez le réseau :</FormLabel>
        <Select
          placeholder="Sélectionner votre réseau"
          onChange={(e) =>
            setOrganisation({
              type: "tete_de_reseau",
              reseau: e.target.value,
            })
          }
        >
          {TETE_DE_RESEAUX.map((reseau, index) => (
            <option value={reseau.key} key={index}>
              {reseau.nom}
            </option>
          ))}
        </Select>
      </FormControl>
    </>
  );
};
