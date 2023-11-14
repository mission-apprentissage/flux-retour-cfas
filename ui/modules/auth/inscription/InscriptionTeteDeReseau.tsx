import { FormControl, FormLabel, Input, Select } from "@chakra-ui/react";
import React from "react";
import { TETE_DE_RESEAUX_SORTED } from "shared";

import { InscriptionOrganistionChildProps } from "./common";

export const InscriptionTeteDeReseau = ({ organisation, setOrganisation }: InscriptionOrganistionChildProps) => {
  const TETE_DE_RESEAUX_SORTED_WITH_OTHER_OPTION = [...TETE_DE_RESEAUX_SORTED, { nom: "Autre Réseau", key: "AUTRE" }];

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
          {TETE_DE_RESEAUX_SORTED_WITH_OTHER_OPTION.map((reseau, index) => (
            <option value={reseau.key} key={index}>
              {reseau.nom}
            </option>
          ))}
        </Select>
      </FormControl>

      {organisation?.type === "TETE_DE_RESEAU" && organisation?.reseau === "AUTRE" && (
        <FormControl mt="4" isRequired>
          <FormLabel>Indiquez le nom de votre réseau :</FormLabel>
          <Input name="autre_reseau" placeholder="Nom du réseau..." />
        </FormControl>
      )}
    </>
  );
};
