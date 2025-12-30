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
  { label: "DRAAF", value: "DRAAF" },
  { label: "Académie", value: "ACADEMIE" },
  { label: "Conseil régional", value: "CONSEIL_REGIONAL" },
  { label: "DRAFPIC", value: "DRAFPIC" },
] as const;

const organisationNationale = { label: "Organisation nationale", value: "OPERATEUR_PUBLIC_NATIONAL" } as const;

type TypeOrganisation = (typeof typesOrganisationBase)[number]["value"] | "OPERATEUR_PUBLIC_NATIONAL";

interface InscriptionOperateurPublicProps extends InscriptionOrganistionChildProps {
  showOrganisationNationale?: boolean;
}

export const InscriptionOperateurPublic = ({
  setOrganisation,
  showOrganisationNationale = false,
}: InscriptionOperateurPublicProps) => {
  const typesOrganisation = showOrganisationNationale
    ? [...typesOrganisationBase, organisationNationale]
    : typesOrganisationBase;
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
      {["DREETS", "DRAAF", "CONSEIL_REGIONAL", "DRAFPIC"].includes(typeOrganisation as string) && (
        <FormControl isRequired>
          <FormLabel>Votre territoire :</FormLabel>
          <Select
            placeholder="Sélectionner un territoire"
            onChange={(e) =>
              setOrganisation({
                type: typeOrganisation as "DREETS" | "DRAAF" | "CONSEIL_REGIONAL" | "DRAFPIC",
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
