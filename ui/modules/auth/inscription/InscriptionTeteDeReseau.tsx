import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import React from "react";
import { TETE_DE_RESEAUX_SORTED } from "shared";

import { InscriptionOrganistionChildProps } from "./common";

export const InscriptionTeteDeReseau = ({ setOrganisation }: InscriptionOrganistionChildProps) => {
  return (
    <>
      <FormControl isRequired>
        <FormLabel>Vous représentez le réseau :</FormLabel>
        <Select
          placeholder="Sélectionner votre réseau"
          onChange={(e) =>
            setOrganisation({
              type: "TETE_DE_RESEAU",
              reseau: e.target.value,
            })
          }
        >
          {TETE_DE_RESEAUX_SORTED.map((reseau, index) => (
            <option value={reseau.key} key={index}>
              {reseau.nom}
            </option>
          ))}
        </Select>
      </FormControl>
    </>
  );
};
