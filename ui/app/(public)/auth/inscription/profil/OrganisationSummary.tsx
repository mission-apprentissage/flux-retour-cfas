"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useQuery } from "@tanstack/react-query";
import { ACADEMIES_BY_CODE, DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE, type IOrganisationJson } from "shared";

import { _post } from "@/common/httpClient";

import styles from "./profil.module.scss";

function OrganismeFormationSummary({
  organisation,
}: {
  organisation: IOrganisationJson & { type: "ORGANISME_FORMATION" };
}) {
  const { data, error, isLoading } = useQuery<{ raison_sociale?: string; enseigne?: string }, any>(
    ["organisme-by-uai-siret", organisation.uai, organisation.siret],
    () => _post("/api/v1/organismes/get-by-uai-siret", { uai: organisation.uai, siret: organisation.siret }),
    { retry: false }
  );

  if (isLoading) {
    return <p role="status">Chargement de votre organisme…</p>;
  }

  const detail = (
    <p className={styles.summaryDetail}>
      UAI : {organisation.uai || "Inconnu"} - SIRET : {organisation.siret}
    </p>
  );

  if (error) {
    return (
      <Alert
        severity="error"
        small
        description={
          <>
            <p className={styles.summaryName}>{error?.json?.data?.message || error?.message}</p>
            {detail}
          </>
        }
      />
    );
  }

  return (
    <Alert
      severity="success"
      small
      description={
        <>
          <p className={styles.summaryName}>{data?.raison_sociale || data?.enseigne}</p>
          {detail}
        </>
      }
    />
  );
}

function summaryContent(organisation: IOrganisationJson) {
  switch (organisation.type) {
    case "TETE_DE_RESEAU":
      return <p className={styles.summaryName}>{organisation.reseau}</p>;
    case "DREETS":
      return (
        <>
          <p className={styles.summaryName}>{organisation.type}</p>
          <p className={styles.summaryDetail}>Territoire : {REGIONS_BY_CODE[organisation.code_region].nom}</p>
        </>
      );
    case "DDETS":
      return (
        <>
          <p className={styles.summaryName}>DDETS</p>
          <p className={styles.summaryDetail}>Territoire : {DEPARTEMENTS_BY_CODE[organisation.code_departement].nom}</p>
        </>
      );
    case "ACADEMIE":
      return (
        <>
          <p className={styles.summaryName}>Académie</p>
          <p className={styles.summaryDetail}>Territoire : {ACADEMIES_BY_CODE[organisation.code_academie].nom}</p>
        </>
      );
    case "ADMINISTRATEUR":
      return <p className={styles.summaryName}>Administrateur</p>;
    case "MISSION_LOCALE":
      return <p className={styles.summaryName}>Mission Locale {organisation.nom}</p>;
    case "ARML":
      return <p className={styles.summaryName}>ARML {organisation.nom}</p>;
    case "FRANCE_TRAVAIL":
      return <p className={styles.summaryName}>France Travail {organisation.nom}</p>;
    default:
      return <p className={styles.summaryName}>{organisation.type}</p>;
  }
}

export function OrganisationSummary({ organisation }: { organisation: IOrganisationJson }) {
  return (
    <div className={styles.summary}>
      {organisation.type === "ORGANISME_FORMATION" ? (
        <OrganismeFormationSummary organisation={organisation} />
      ) : (
        <Alert severity="success" small description={summaryContent(organisation)} />
      )}
    </div>
  );
}
