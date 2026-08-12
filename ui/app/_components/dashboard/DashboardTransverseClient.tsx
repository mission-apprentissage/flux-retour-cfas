"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  ACADEMIES_BY_CODE,
  DEPARTEMENTS_BY_CODE,
  getOrganisationLabel,
  IndicateursEffectifsAvecDepartement,
  IndicateursOrganismesAvecDepartement,
  IOrganisationCreate,
  REGIONS_BY_CODE,
} from "shared";

import { FiltreDateMois } from "@/app/_components/indicateurs/filters/FiltreDateMois";
import { IndicateursCards } from "@/app/_components/indicateurs/IndicateursCards";
import { useAuth } from "@/app/_context/UserContext";
import { _get } from "@/common/httpClient";
import { formatCivility, prettyFormatNumber } from "@/common/utils/stringUtils";
import { convertDateFiltersToQuery, parseQueryFieldDate } from "@/modules/models/effectifs-filters";

import { CarteFrance } from "./CarteFrance";
import styles from "./dashboard.module.scss";
import { DashboardAdministrateurLinks } from "./DashboardAdministrateurLinks";
import { SuggestFeature } from "./SuggestFeature";

const PERIMETRE_TOOLTIP_TITLE = "Périmètre de vos données";

const EFFECTIFS_TOOLTIP =
  "Répartition du nombre d’apprenants et de sorties d’apprentissage à l’instant T, par départements. Ces chiffres correspondent aux données à la date du jour, et peuvent varier d’un jour à l’autre selon les données transmises par les organismes de formation en apprentissage.";

const COUVERTURE_TOOLTIP =
  "Ce taux traduit le nombre d’organismes dispensant une formation en apprentissage (sauf responsables) qui transmettent au tableau de bord. Les organismes qui transmettent mais ne font pas partie du référentiel ne rentrent pas en compte dans ce taux. Il est conseillé d’avoir un minimum de 80% d’établissements transmetteurs afin de garantir la viabilité des enquêtes menées auprès de ces derniers.";

const DATE_TOOLTIP =
  "La sélection du mois permet d’afficher les effectifs au dernier jour du mois. À noter : la période de référence pour l’année scolaire court du 1er août au 31 juillet.";

function getPerimetreDescription(organisation: any): string {
  if (!organisation) return "";

  switch (organisation.type) {
    case "FRANCE_TRAVAIL":
      return `Votre périmètre correspond au périmètre ${organisation.nom} de France Travail`;
    case "MISSION_LOCALE":
      return `Votre périmètre correspond à la mission locale ${organisation.nom}`;
    case "ARML":
      return `Votre périmètre correspond à l'ARML ${organisation.nom}`;
    case "ORGANISME_FORMATION":
      return "Votre périmètre correspond à votre organisme et vos organismes formateurs";
    case "TETE_DE_RESEAU":
      return `Votre périmètre correspond aux organismes du réseau ${organisation.reseau}`;
    case "DREETS":
      return `Votre périmètre correspond aux organismes de la région ${
        REGIONS_BY_CODE[organisation.code_region]?.nom || organisation.code_region
      }`;
    case "DDETS":
      return `Votre périmètre correspond aux organismes du département ${
        DEPARTEMENTS_BY_CODE[organisation.code_departement]?.nom || organisation.code_departement
      }`;
    case "ACADEMIE":
      return `Votre périmètre correspond aux organismes de l'académie de ${
        ACADEMIES_BY_CODE[organisation.code_academie]?.nom || organisation.code_academie
      }`;
    case "ADMINISTRATEUR":
      return "Votre périmètre contient tous les organismes nationaux";
    default:
      return "";
  }
}

export function DashboardTransverseClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organisation = user?.organisation as any;

  const date = useMemo(() => parseQueryFieldDate(searchParams?.get("date") ?? undefined), [searchParams]);

  const { data: effectifsParDepartement, isLoading: effectifsLoading } = useQuery<
    IndicateursEffectifsAvecDepartement[]
  >(["indicateurs/effectifs", date.toISOString()], () =>
    _get("/api/v1/indicateurs/effectifs/par-departement", { params: { date: convertDateFiltersToQuery(date) } })
  );

  const { data: organismesParDepartement, isLoading: organismesLoading } = useQuery<
    IndicateursOrganismesAvecDepartement[]
  >(["indicateurs/organismes/par-departement", date.toISOString()], () =>
    _get("/api/v1/indicateurs/organismes/par-departement", { params: { date } })
  );

  const totaux = useMemo(
    () =>
      (effectifsParDepartement ?? []).reduce(
        (acc, indicateurs) => {
          acc.apprenants += indicateurs.apprenants;
          acc.apprentis += indicateurs.apprentis;
          acc.inscrits += indicateurs.inscrits;
          acc.abandons += indicateurs.abandons;
          acc.rupturants += indicateurs.rupturants;
          return acc;
        },
        { apprenants: 0, apprentis: 0, inscrits: 0, abandons: 0, rupturants: 0 }
      ),
    [effectifsParDepartement]
  );

  const tauxCouvertureParDepartement = useMemo(
    () =>
      (organismesParDepartement ?? []).map((item) => ({
        departement: item.departement,
        tauxCouverture: item.tauxCouverture.total,
        totalOrganismes: item.totalOrganismes.total,
        organismesTransmetteurs: item.organismesTransmetteurs.total,
        organismesNonTransmetteurs: item.organismesNonTransmetteurs.total,
      })),
    [organismesParDepartement]
  );

  const onDateChange = (newDate: Date) => {
    router.replace(`?date=${encodeURIComponent(convertDateFiltersToQuery(newDate) ?? "")}`, { scroll: false });
  };

  return (
    <div>
      <div className={styles.headerBand}>
        <div className="fr-container">
          <h1 className={styles.welcome}>
            <i className="fr-icon-account-circle-fill" aria-hidden="true" />
            Bienvenue sur votre tableau de bord, {formatCivility((user as any)?.civility)} {(user as any)?.prenom}{" "}
            {(user as any)?.nom}
          </h1>
          <p className={styles.organismeName}>{getOrganisationLabel(organisation as IOrganisationCreate)}</p>
        </div>
      </div>

      <div className="fr-container fr-pt-4w fr-pb-6w">
        {organisation?.type === "ADMINISTRATEUR" && <DashboardAdministrateurLinks />}

        <h2 className={styles.perimetreTitle}>
          Aperçu des données de l’apprentissage de votre périmètre
          <Tooltip kind="hover" title={`${PERIMETRE_TOOLTIP_TITLE} — ${getPerimetreDescription(organisation)}`} />
        </h2>

        <p className="fr-text--sm">
          Ces chiffres reflètent partiellement les effectifs de l’apprentissage de votre périmètre&nbsp;: une partie des
          organismes de formation en apprentissage ne transmettent pas encore leurs données au tableau de bord (voir
          carte «&nbsp;Taux de couverture&nbsp;» ci-dessous).
        </p>

        <div className={styles.dateFilterRow}>
          <span>Filtrer par</span>
          <FiltreDateMois value={date} onChange={onDateChange} />
          <Tooltip kind="hover" title={DATE_TOOLTIP} />
        </div>

        <IndicateursCards indicateursEffectifs={totaux} loading={effectifsLoading} />

        <hr className={styles.separator} />

        <div className={styles.mapsGrid}>
          <section className={styles.mapCard}>
            <h3 className={styles.mapCardTitle}>
              Répartition des effectifs de votre périmètre
              <Tooltip kind="hover" title={EFFECTIFS_TOOLTIP} />
            </h3>
            <hr className={styles.separator} />
            {effectifsLoading ? (
              <p>Chargement…</p>
            ) : (
              <CarteFrance
                donneesAvecDepartement={effectifsParDepartement ?? []}
                dataKey="apprenants"
                minColor="#DDEBFB"
                maxColor="#366EC1"
                tooltipContent={(indicateurs) =>
                  indicateurs ? (
                    <>
                      <span>Apprenants&nbsp;: {indicateurs.apprenants}</span>
                      <br />
                      <span>Apprentis&nbsp;: {indicateurs.apprentis}</span>
                      <br />
                      <span>Rupturants&nbsp;: {indicateurs.rupturants}</span>
                      <br />
                      <span>Jeunes sans contrat&nbsp;: {indicateurs.inscrits}</span>
                      <br />
                      <span>Sorties d’apprentissage&nbsp;: {indicateurs.abandons}</span>
                    </>
                  ) : (
                    <span>Données non disponibles</span>
                  )
                }
              />
            )}
          </section>

          <section className={styles.mapCard}>
            <h3 className={styles.mapCardTitle}>
              Taux de couverture des organismes de votre périmètre
              <Tooltip kind="hover" title={COUVERTURE_TOOLTIP} />
            </h3>
            <hr className={styles.separator} />
            {organismesLoading ? (
              <p>Chargement…</p>
            ) : (
              <CarteFrance
                donneesAvecDepartement={tauxCouvertureParDepartement}
                dataKey="tauxCouverture"
                minColor="#ECF5E0"
                maxColor="#4F6C21"
                pourcentage
                tooltipContent={(indicateurs) =>
                  indicateurs ? (
                    <>
                      <span>Taux de couverture&nbsp;: {prettyFormatNumber(indicateurs.tauxCouverture)}%</span>
                      <br />
                      <span>Total des organismes&nbsp;: {indicateurs.totalOrganismes}</span>
                      <br />
                      <span>Organismes transmetteurs&nbsp;: {indicateurs.organismesTransmetteurs}</span>
                      <br />
                      <span>Organismes non-transmetteurs&nbsp;: {indicateurs.organismesNonTransmetteurs}</span>
                    </>
                  ) : (
                    <span>Données non disponibles</span>
                  )
                }
              />
            )}
          </section>
        </div>

        <SuggestFeature />
      </div>
    </div>
  );
}
