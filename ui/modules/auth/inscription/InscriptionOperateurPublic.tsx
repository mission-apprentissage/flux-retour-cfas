import React, { useState } from "react";
import { useRouter } from "next/router";
import { FormControl, FormLabel, Input, Select } from "@chakra-ui/react";
import { ACADEMIES_SORTED, DEPARTEMENTS_SORTED, REGIONS_SORTED } from "@/common/constants/territoiresConstants";
import { ORGANISATIONS_NATIONALES } from "@/common/constants/organisations";

const typesOrganisation = [
  {
    label: "D(R)(I)EETS",
    value: "dreets",
  },
  {
    label: "DDETS",
    value: "ddets",
  },
  {
    label: "DEETS",
    value: "deets",
  },
  {
    label: "DRAAF",
    value: "draaf",
  },
  {
    label: "Académie",
    value: "academie",
  },
  {
    label: "Conseil régional",
    value: "conseil_regional",
  },
  {
    label: "Organisation nationale",
    value: "organisation_nationale",
  },
  {
    label: "Autre opérateur public",
    value: "autre",
  },
] as const;

type TypeOrganisation = (typeof typesOrganisation)[number]["value"];

const academies = ACADEMIES_SORTED.map(({ nom, code }) => ({ label: nom, value: code }));
const departements = DEPARTEMENTS_SORTED.map(({ nom, code }) => ({
  label: nom,
  value: code,
}));
const regions = REGIONS_SORTED.map(({ nom, code }) => ({ label: nom, value: code }));

export const InscriptionOperateurPublic = () => {
  const router = useRouter();
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation | null>(null);
  // const { typeOrganisation } = router.query;

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
      {typeOrganisation === "academie" && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select placeholder="Sélectionner un territoire">
            {academies.map((option, index) => (
              <option value={option.value} key={index}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {typeOrganisation === "ddets" && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select placeholder="Sélectionner un territoire">
            {departements.map((option, index) => (
              <option value={option.value} key={index}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {(["dreets", "deets", "draaf", "conseil_regional"] as (typeof typeOrganisation)[]).includes(typeOrganisation) && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select placeholder="Sélectionner un territoire">
            {regions.map((option, index) => (
              <option value={option.value} key={index}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {typeOrganisation === "organisation_nationale" && (
        <FormControl isRequired>
          <FormLabel>Préciser l{"'"}organisation :</FormLabel>
          <Select placeholder="Sélectionner votre organisation">
            {ORGANISATIONS_NATIONALES.map((option, index) => (
              <option value={option.key} key={index}>
                {option.nom}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {typeOrganisation === "autre" && (
        <FormControl isRequired>
          <FormLabel>Indiquez le nom de votre établissement :</FormLabel>
          <Input placeholder="..." />
        </FormControl>
      )}
    </>
  );
};
