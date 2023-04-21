import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import React from "react";

import { InscriptionOrganistionChildProps } from "./common";

import { TETE_DE_RESEAUX } from "@/common/constants/networksConstants";

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
