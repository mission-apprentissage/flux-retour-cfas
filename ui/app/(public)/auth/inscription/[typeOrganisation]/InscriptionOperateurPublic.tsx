"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import {
  ACADEMIES_SORTED,
  DEPARTEMENTS_SORTED,
  REGIONS_SORTED,
  type IAcademieCode,
  type IDepartmentCode,
  type IRegionCode,
} from "shared";

import styles from "./inscription-organisation.module.scss";
import type { InscriptionFormProps } from "./types";

const typesOrganisation = [
  { label: "D(R)(I)EETS", value: "DREETS" },
  { label: "DDETS", value: "DDETS" },
  { label: "Académie", value: "ACADEMIE" },
] as const;

type TypeOrganisation = (typeof typesOrganisation)[number]["value"];

export function InscriptionOperateurPublic({ setOrganisation }: Pick<InscriptionFormProps, "setOrganisation">) {
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation | null>(null);

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

      {typeOrganisation === "DREETS" && (
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
                event.target.value ? { type: typeOrganisation, code_region: event.target.value as IRegionCode } : null
              ),
          }}
          options={REGIONS_SORTED.map((option) => ({ value: option.code, label: option.nom }))}
        />
      )}
    </>
  );
}
