import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useState } from "react";
import {
  ACADEMIES_SORTED,
  DEPARTEMENTS_SORTED,
  REGIONS_SORTED,
  ORGANISATIONS_NATIONALES_SORTED_BY_NAME,
  IAcademieCode,
  IDepartmentCode,
  IRegionCode,
  OrganisationsNationalesKey,
} from "shared";

import { InscriptionOrganistionChildProps } from "./common";

const typesOrganisationBase = [
  { label: "D(R)(I)EETS", value: "DREETS" },
  { label: "DDETS", value: "DDETS" },
  { label: "Académie", value: "ACADEMIE" },
] as const;

const typesOrganisationDecommissioned = [
  { label: "DRAAF (décommissionné)", value: "DRAAF" },
  { label: "DRAFPIC (décommissionné)", value: "DRAFPIC" },
  {
    label: "Organisation nationale (décommissionné)",
    value: "OPERATEUR_PUBLIC_NATIONAL",
  },
  { label: "Conseil régional (décommissionné)", value: "CONSEIL_REGIONAL" },
] as const;

type TypeOrganisation =
  | (typeof typesOrganisationBase)[number]["value"]
  | (typeof typesOrganisationDecommissioned)[number]["value"]
  | "OPERATEUR_PUBLIC_NATIONAL";

interface InscriptionOperateurPublicProps extends InscriptionOrganistionChildProps {
  showOrganisationNationale?: boolean;
  showDecommissioned?: boolean;
}

export const InscriptionOperateurPublic = ({
  setOrganisation,
  showDecommissioned = false,
}: InscriptionOperateurPublicProps) => {
  const typesOrganisation = [...typesOrganisationBase, ...(showDecommissioned ? typesOrganisationDecommissioned : [])];
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
                code_academie: e.target.value as IAcademieCode,
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
                code_departement: e.target.value as IDepartmentCode,
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
      {["DREETS", "CONSEIL_REGIONAL", "DRAAF", "DRAFPIC"].includes(typeOrganisation as string) && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select
            placeholder="Sélectionner un territoire"
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation as "DREETS" | "CONSEIL_REGIONAL" | "DRAAF" | "DRAFPIC",
                code_region: e.target.value as IRegionCode,
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
                nom: e.target.value as OrganisationsNationalesKey,
              })
            }
          >
            {ORGANISATIONS_NATIONALES_SORTED_BY_NAME.map((option, index) => (
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
