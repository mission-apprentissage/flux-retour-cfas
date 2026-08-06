"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import type { IOrganisationFranceTravail } from "shared";

import { _get } from "@/common/httpClient";

import styles from "./inscription-form.module.scss";
import type { InscriptionFormProps } from "./types";

export function InscriptionFranceTravail({ setOrganisation }: Pick<InscriptionFormProps, "setOrganisation">) {
  const { data: franceTravailOrganisations } = useQuery<Array<IOrganisationFranceTravail>>(["ft"], async () =>
    _get("/api/v1/france-travail")
  );

  return (
    <Select
      label={
        <>
          Votre structure régionale : <span className={styles.requiredMark}>*</span>
        </>
      }
      placeholder="Sélectionner une région"
      nativeSelectProps={{
        onChange: (event) => {
          const ft = franceTravailOrganisations?.find(({ _id }) => _id.toString() === event.target.value);
          setOrganisation(ft ?? null);
        },
      }}
      options={(franceTravailOrganisations ?? []).map((ft) => ({ value: ft._id.toString(), label: ft.nom }))}
    />
  );
}
