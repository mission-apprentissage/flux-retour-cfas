"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AUTRE_AFFELNET_LINK } from "shared";

import { StatCard } from "@/app/_components/statistiques/cards/StatCard";
import { StatisticsSection } from "@/app/_components/statistiques/sections/StatisticsSection";
import { _get, _getBlob } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";
import { downloadObject } from "@/common/utils/browser";

import { AffelnetChart } from "./AffelnetChart";
import styles from "./voeux-affelnet.module.scss";

const FIRST_AFFELNET_YEAR = 2024;

type AffelnetCount = {
  voeuxFormules: number;
  apprenantVoeuxFormules: number;
  apprenantsNonContretise: number;
  apprenantsRetrouves: number;
};

const nonConcretiseModal = createModal({ id: "affelnet-non-concretise", isOpenedByDefault: false });

function parseDepartements(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((departement) => departement.trim())
    .filter((departement) => departement !== "");
}

export default function VoeuxAffelnetClient() {
  const searchParams = useSearchParams();
  const departements = useMemo(
    () => parseDepartements(searchParams?.get("organisme_departements") ?? null),
    [searchParams]
  );

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: currentYear - FIRST_AFFELNET_YEAR + 1 }, (_, index) => currentYear - index),
    [currentYear]
  );
  const [year, setYear] = useState(currentYear);

  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: affelnetCount,
    isLoading,
    error,
  } = useQuery<AffelnetCount, any>(["affelnet/national/count", { departements, year }], () => {
    const params = new URLSearchParams({ year: String(year) });
    if (departements.length > 0) {
      params.set("organisme_departements", departements.join(","));
    }
    return _get(`/api/v1/affelnet/national/count?${params.toString()}`);
  });

  const download = async (kind: "concretise" | "non-concretise") => {
    setExportError(null);
    setIsExporting(true);
    try {
      const { data } = await _getBlob(`/api/v1/affelnet/export/${kind}?year=${year}`);
      downloadObject(data, `voeux_affelnet_${kind.replace("-", "_")}.csv`, "text/plain");
    } catch (err: any) {
      setExportError(getApiErrorMessage(err, "Le téléchargement a échoué."));
    } finally {
      setIsExporting(false);
    }
  };

  const concretises = (affelnetCount?.apprenantVoeuxFormules ?? 0) - (affelnetCount?.apprenantsNonContretise ?? 0);

  const yearSelect = (
    <Select
      className={styles.yearSelect}
      label="Voir l’année"
      nativeSelectProps={{
        value: String(year),
        onChange: (event) => setYear(Number(event.target.value)),
      }}
      options={years.map((value) => ({ value: String(value), label: String(value) }))}
    />
  );

  return (
    <div className={fr.cx("fr-container")}>
      <h1 className={styles.title}>Vœux Affelnet</h1>

      <p className={styles.intro}>
        Les vœux formulés via la plateforme Affelnet (offre post-3ème), et ce qu’ils sont devenus sur votre territoire.
      </p>

      <div className="fr-callout">
        <h2 className="fr-callout__title">À quoi servent ces chiffres&nbsp;?</h2>
        <div className="fr-callout__text">
          <ul>
            <li>Quantifier, dans votre territoire, le taux d’insertion en apprentissage à partir du collège/lycée.</li>
            <li>
              Visualiser le nombre de jeunes n’ayant pas concrétisé leurs vœux en apprentissage (refusés dans tous les
              CFA pour lesquels ils ont candidaté).
            </li>
            <li>Pouvoir contacter ces jeunes.</li>
          </ul>
        </div>
      </div>

      {error ? (
        <Alert
          severity="error"
          title="Les chiffres n’ont pas pu être chargés"
          description={`Détail : ${getApiErrorMessage(error)}`}
        />
      ) : (
        <>
          <StatisticsSection title={`En ${year}`} controls={yearSelect}>
            <div className={styles.cards}>
              <StatCard
                label="Vœux en apprentissage formulés"
                value={affelnetCount?.voeuxFormules}
                loading={isLoading}
              />
              <StatCard
                label="Jeunes ayant formulé au moins un vœu en apprentissage"
                value={affelnetCount?.apprenantVoeuxFormules}
                loading={isLoading}
              />
              <StatCard
                label="Jeunes n’ayant pas concrétisé ce vœu"
                value={affelnetCount?.apprenantsNonContretise}
                loading={isLoading}
                tooltip="Jeunes présents dans le fichier de vœux que l’on ne retrouve pas encore inscrits pour la rentrée dans un centre de formation."
              />
              <StatCard
                label="Jeunes déjà inscrits en CFA pour la rentrée"
                value={concretises}
                loading={isLoading}
                tooltip={`Ce chiffre se base sur les transmissions d’effectifs au Tableau de bord par les OFA ayant des jeunes inscrits sur ${year}-${year + 1}, et sur la base DECA pour ceux ayant signé un contrat.`}
              />
            </div>

            {exportError && (
              <div className={styles.exportError}>
                <Alert severity="error" small description={exportError} />
              </div>
            )}

            <div className={styles.exports}>
              <Button
                priority="secondary"
                iconId="fr-icon-download-line"
                disabled={isExporting}
                onClick={nonConcretiseModal.open}
              >
                Liste des jeunes n’ayant pas concrétisé
              </Button>
              <Button
                priority="secondary"
                iconId="fr-icon-download-line"
                disabled={isExporting}
                onClick={() => download("concretise")}
              >
                Liste des jeunes déjà inscrits
              </Button>
            </div>
          </StatisticsSection>

          <StatisticsSection title="Part des vœux concrétisés">
            <AffelnetChart
              totalApprenants={affelnetCount?.apprenantVoeuxFormules}
              apprenantsConcretises={affelnetCount?.apprenantsRetrouves}
            />
          </StatisticsSection>
        </>
      )}

      <p className={styles.contact}>
        Source :{" "}
        <a
          className={fr.cx("fr-link")}
          href="https://affectation3e.phm.education.gouv.fr/pna-public/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Affelnet
        </a>
        . Vous avez une question ou une remarque ?{" "}
        <a className={fr.cx("fr-link")} href={AUTRE_AFFELNET_LINK} target="_blank" rel="noopener noreferrer">
          Écrivez-nous
        </a>
      </p>

      <nonConcretiseModal.Component
        title="Téléchargement de la liste des jeunes n’ayant pas concrétisé leur vœu en apprentissage"
        buttons={[
          { children: "Annuler", priority: "secondary" },
          {
            children: "Télécharger la liste",
            iconId: "fr-icon-download-line",
            doClosesModal: true,
            onClick: () => download("non-concretise"),
          },
        ]}
      >
        <p>
          La liste est nominative et au format Excel : elle contient les contacts des jeunes dont nous pensons qu’ils
          n’ont pas concrétisé leur vœu en apprentissage pour l’instant. Certains jeunes vont se trouver dans cet onglet
          parce que nous n’avons pas encore eu les informations nécessaires.
        </p>
        <p>
          Veuillez noter qu’il est impossible de restituer, pour chaque jeune, s’il est retourné en voie scolaire ou si
          ses vœux en apprentissage ont été refusés.
        </p>
      </nonConcretiseModal.Component>
    </div>
  );
}
