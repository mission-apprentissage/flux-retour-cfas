"use client";

import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DEPARTEMENTS_BY_CODE, type IOrganisationARML, type IOrganisationMissionLocale } from "shared";

import type { InscriptionFormProps } from "@/app/_components/inscription/types";
import { _get } from "@/common/httpClient";

import styles from "./inscription-organisation.module.scss";

const typesOrganisation = [
  { label: "L'UNML (Union Nationale)", value: "UNML", disabled: true },
  { label: "Une ARML (Agence Régionale)", value: "ARML", disabled: false },
  { label: "Une Mission Locale", value: "ML", disabled: false },
] as const;

type TypeOrganisation = (typeof typesOrganisation)[number]["value"];

export function InscriptionMissionLocale({ setOrganisation }: Pick<InscriptionFormProps, "setOrganisation">) {
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation | null>(null);
  const [departement, setDepartement] = useState<string>("");

  const { data: missionLocales } = useQuery<Array<IOrganisationMissionLocale>>(["mission-locale"], async () =>
    _get("/api/v1/mission-locale")
  );
  const { data: armls } = useQuery<Array<IOrganisationARML>>(["arml"], async () => _get("/api/v1/mission-locale/arml"));

  const departementList = useMemo(() => {
    return (missionLocales ?? []).reduce<Record<string, Array<IOrganisationMissionLocale>>>((acc, curr) => {
      const code = curr.adresse?.departement;
      if (!code) {
        return acc;
      }
      return { ...acc, [code]: acc[code] ? [...acc[code], curr] : [curr] };
    }, {});
  }, [missionLocales]);

  const missionLocaleList = departement ? (departementList[departement] ?? []) : [];

  return (
    <>
      <RadioButtons
        legend={
          <>
            Vous représentez : <span className={styles.requiredMark}>*</span>
          </>
        }
        name="typeOrganisationMl"
        options={typesOrganisation.map((item) => ({
          label: item.label,
          nativeInputProps: {
            value: item.value,
            disabled: item.disabled,
            checked: typeOrganisation === item.value,
            onChange: () => {
              setTypeOrganisation(item.value);
              setDepartement("");
              setOrganisation(null);
            },
          },
        }))}
      />

      {typeOrganisation === "ARML" && (
        <Select
          label={
            <>
              Votre ARML : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner une ARML"
          nativeSelectProps={{
            onChange: (event) => {
              const arml = armls?.find(({ _id }) => _id.toString() === event.target.value);
              setOrganisation(arml ?? null);
            },
          }}
          options={(armls ?? [])
            .filter((arml) => arml.can_register)
            .map((arml) => ({ value: arml._id.toString(), label: arml.nom }))}
        />
      )}

      {typeOrganisation === "ML" && (
        <Select
          label={
            <>
              Votre département : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner un département"
          nativeSelectProps={{
            value: departement,
            onChange: (event) => {
              setDepartement(event.target.value);
              setOrganisation(null);
            },
          }}
          options={Object.keys(departementList)
            .sort()
            .map((code) => ({ value: code, label: `${code} - ${DEPARTEMENTS_BY_CODE[code].nom}` }))}
        />
      )}

      {typeOrganisation === "ML" && missionLocaleList.length > 0 && (
        <Select
          key={departement}
          label={
            <>
              Votre Mission Locale : <span className={styles.requiredMark}>*</span>
            </>
          }
          placeholder="Sélectionner une Mission Locale"
          nativeSelectProps={{
            onChange: (event) => {
              const ml = missionLocaleList.find(({ _id }) => _id.toString() === event.target.value);
              setOrganisation(ml ?? null);
            },
          }}
          options={missionLocaleList.map((ml) => ({
            value: ml._id.toString(),
            label: `${ml.nom} - ${ml.adresse?.code_postal}`,
          }))}
        />
      )}
    </>
  );
}
