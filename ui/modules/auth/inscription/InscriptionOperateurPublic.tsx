import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useState } from "react";
import { ACADEMIES_SORTED, DEPARTEMENTS_SORTED, REGIONS_SORTED } from "shared";

import { ORGANISATIONS_NATIONALES } from "@/common/constants/organisations";

import { InscriptionOrganistionChildProps } from "./common";

const typesOrganisation = [
  {
    label: "D(R)(I)EETS",
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
  {
    label: "Organisation nationale",
    value: "OPERATEUR_PUBLIC_NATIONAL",
  },
  // FIXME, pas pris en compte pour l'instant, car il faut pouvoir enregistrer l'utilisateur / envoyer un mail
  // {
  //   label: "Autre opérateur public",
  //   value: "AUTRE",
  // },
] as const;

type TypeOrganisation = (typeof typesOrganisation)[number]["value"];

export const InscriptionOperateurPublic = ({ setOrganisation }: InscriptionOrganistionChildProps) => {
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation | null>(null);

  return (
    <>
      <FormControl isRequired onChange={(e: any) => setTypeOrganisation(e.target.value)} mb={4}>
        <FormLabel>Vous représentez :</FormLabel>
        <Select placeholder="Sélectionner un opérateur public">
          {typesOrganisation.map((option, index) => (
            <option value={option.value} key={index}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>

      {typeOrganisation === "ACADEMIE" && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select
            placeholder="Sélectionner un territoire"
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation,
                code_academie: e.target.value,
              })
            }
          >
            {ACADEMIES_SORTED.map((option, index) => (
              <option value={option.code} key={index}>
                {option.nom}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {typeOrganisation === "DDETS" && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select
            placeholder="Sélectionner un territoire"
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation,
                code_departement: e.target.value,
              })
            }
          >
            {DEPARTEMENTS_SORTED.map((option, index) => (
              <option value={option.code} key={index}>
                {option.code} - {option.nom}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {["DREETS", "DRAAF", "CONSEIL_REGIONAL"].includes(typeOrganisation as string) && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select
            placeholder="Sélectionner un territoire"
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation as "DREETS" | "DRAAF" | "CONSEIL_REGIONAL",
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
      {typeOrganisation === "OPERATEUR_PUBLIC_NATIONAL" && (
        <FormControl isRequired>
          <FormLabel>Préciser l{"'"}organisation :</FormLabel>
          <Select
            placeholder="Sélectionner votre organisation"
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation,
                nom: e.target.value,
              })
            }
          >
            {ORGANISATIONS_NATIONALES.map((option, index) => (
              <option value={option.key} key={index}>
                {option.nom}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {/* {typeOrganisation === "AUTRE" && (
        <FormControl isRequired>
          <FormLabel>Indiquez le nom de votre établissement :</FormLabel>
          <Input
            placeholder="..."
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation,
                nom: e.target.value,
              })
            }
          />
        </FormControl>
      )} */}
    </>
  );
};
