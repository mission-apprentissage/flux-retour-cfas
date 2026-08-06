"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import {
  ACADEMIES_SORTED,
  DEPARTEMENTS_SORTED,
  ORGANISATIONS_NATIONALES_SORTED_BY_NAME,
  REGIONS_SORTED,
  type IAcademieCode,
  type IDepartmentCode,
  type IRegionCode,
  type OrganisationsNationalesKey,
} from "shared";

import styles from "./inscription-form.module.scss";
import type { InscriptionFormProps } from "./types";

const typesOrganisationBase = [
  { label: "D(R)(I)EETS", value: "DREETS" },
  { label: "DDETS", value: "DDETS" },
  { label: "Académie", value: "ACADEMIE" },
] as const;

const typesOrganisationDecommissionnes = [
  { label: "DRAAF (décommissionné)", value: "DRAAF" },
  { label: "DRAFPIC (décommissionné)", value: "DRAFPIC" },
  { label: "Organisation nationale (décommissionné)", value: "OPERATEUR_PUBLIC_NATIONAL" },
  { label: "Conseil régional (décommissionné)", value: "CONSEIL_REGIONAL" },
] as const;

type TypeOrganisation =
  | (typeof typesOrganisationBase)[number]["value"]
  | (typeof typesOrganisationDecommissionnes)[number]["value"];

type TypeOrganisationRegionale = Extract<TypeOrganisation, "DREETS" | "DRAAF" | "DRAFPIC" | "CONSEIL_REGIONAL">;

const TYPES_REGIONAUX: TypeOrganisationRegionale[] = ["DREETS", "DRAAF", "DRAFPIC", "CONSEIL_REGIONAL"];

const isTypeRegional = (type: TypeOrganisation | null): type is TypeOrganisationRegionale =>
  TYPES_REGIONAUX.includes(type as TypeOrganisationRegionale);

export function InscriptionOperateurPublic({
  setOrganisation,
  showDecommissioned = false,
}: Pick<InscriptionFormProps, "setOrganisation"> & { showDecommissioned?: boolean }) {
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation | null>(null);

  const typesOrganisation = [...typesOrganisationBase, ...(showDecommissioned ? typesOrganisationDecommissionnes : [])];

  return (
    <>
      <Select
        label={
          <>
            Vous représentez : <span className={styles.requiredMark}>*</span>
          </>
        }
        placeholder="Sélectionner un opérateur public"
        nativeSelectProps={{
          onChange: (event) => {
            setTypeOrganisation((event.target.value || null) as TypeOrganisation | null);
            setOrganisation(null);
          },
        }}
        options={typesOrganisation.map((option) => ({ value: option.value, label: option.label }))}
      />

      {typeOrganisation === "ACADEMIE" && (
        <Select
          label={
            <>
              Votre territoire : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner un territoire"
          nativeSelectProps={{
            onChange: (event) =>
              setOrganisation(
                event.target.value
                  ? { type: typeOrganisation, code_academie: event.target.value as IAcademieCode }
                  : null
              ),
          }}
          options={ACADEMIES_SORTED.map((option) => ({ value: option.code, label: option.nom }))}
        />
      )}

      {typeOrganisation === "DDETS" && (
        <Select
          label={
            <>
              Votre territoire : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner un territoire"
          nativeSelectProps={{
            onChange: (event) =>
              setOrganisation(
                event.target.value
                  ? { type: typeOrganisation, code_departement: event.target.value as IDepartmentCode }
                  : null
              ),
          }}
          options={DEPARTEMENTS_SORTED.map((option) => ({
            value: option.code,
            label: `${option.code} - ${option.nom}`,
          }))}
        />
      )}

      {isTypeRegional(typeOrganisation) && (
        <Select
          key={typeOrganisation}
          label={
            <>
              Votre territoire : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner un territoire"
          nativeSelectProps={{
            onChange: (event) =>
              setOrganisation(
                event.target.value ? { type: typeOrganisation, code_region: event.target.value as IRegionCode } : null
              ),
          }}
          options={REGIONS_SORTED.map((option) => ({ value: option.code, label: option.nom }))}
        />
      )}

      {typeOrganisation === "OPERATEUR_PUBLIC_NATIONAL" && (
        <Select
          label={
            <>
              Préciser l’organisation : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner votre organisation"
          nativeSelectProps={{
            onChange: (event) =>
              setOrganisation(
                event.target.value
                  ? { type: typeOrganisation, nom: event.target.value as OrganisationsNationalesKey }
                  : null
              ),
          }}
          options={ORGANISATIONS_NATIONALES_SORTED_BY_NAME.map((option) => ({ value: option.key, label: option.nom }))}
        />
      )}
    </>
  );
}
