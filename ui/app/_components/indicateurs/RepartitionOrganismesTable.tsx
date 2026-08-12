"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { SortingState } from "@tanstack/react-table";
import { IndicateursEffectifsAvecOrganisme } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { DataTable } from "@/app/_components/table/DataTable";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";
import { indicateursParOrganismeExportColumns } from "@/common/exports";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";

import styles from "./indicateurs.module.scss";

const NATURE_TOOLTIP =
  "La donnée « Nature » est déduite des relations entre les organismes (base des Carif-Oref). Le Catalogue des offres de formations en apprentissage identifie trois natures : organismes responsables, organismes responsables et formateur, organismes formateurs. Une nature « inconnue » signifie que l’organisme n’a pas déclaré (ou de manière incomplète) son offre de formation dans la base de son Carif-Oref.";

interface RepartitionOrganismesTableProps {
  indicateurs: IndicateursEffectifsAvecOrganisme[];
  prominentOrganismeId: string;
  loading: boolean;
  sort: SortingState;
  onSortChange: (sort: SortingState) => void;
  date: Date;
}

export function RepartitionOrganismesTable({
  indicateurs,
  prominentOrganismeId,
  loading,
  sort,
  onSortChange,
  date,
}: RepartitionOrganismesTableProps) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const rows = indicateurs.map((indicateur) => ({
    _id: indicateur.organisme_id,
    rawData: indicateur,
    element: {
      nom: (
        <>
          <span
            className={`${styles.organismeName} ${
              indicateur.organisme_id === prominentOrganismeId ? "organisme-prominent" : ""
            }`}
            title={indicateur.nom}
          >
            <DsfrLink href={`/organismes/${indicateur.organisme_id}`} arrow="none">
              {indicateur.nom ?? "Organisme inconnu"}
            </DsfrLink>
          </span>
          <span className={styles.cellSub}>
            UAI : {indicateur.uai} - SIRET : {indicateur.siret}
          </span>
        </>
      ),
      nature: <NatureOrganismeTag nature={indicateur.nature as any} />,
      apprentis: indicateur.apprentis,
      inscrits: indicateur.inscrits,
      rupturants: indicateur.rupturants,
      abandons: indicateur.abandons,
    },
  }));

  const columns = [
    { label: "Nom de l’organisme", dataKey: "nom" },
    {
      label: (
        <>
          Nature <Tooltip kind="hover" title={NATURE_TOOLTIP} />
        </>
      ),
      dataKey: "nature",
    },
    { label: "Apprentis", dataKey: "apprentis" },
    { label: "Sans contrat", dataKey: "inscrits" },
    { label: "Ruptures", dataKey: "rupturants" },
    { label: "Sorties", dataKey: "abandons" },
  ];

  return (
    <>
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>Répartition des effectifs par organismes</h3>
        <Button
          priority="secondary"
          iconId="fr-icon-download-line"
          iconPosition="right"
          disabled={indicateurs.length === 0}
          title={indicateurs.length === 0 ? "Aucun organisme à télécharger" : undefined}
          onClick={() => {
            trackPlausibleEvent("telechargement_liste_repartition_effectifs");
            const lignes = indicateurs.map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ organisme_id, apprenants, ...indicateur }) => indicateur
            );
            exportDataAsXlsx(
              `tdb-indicateurs-organismes-${date.toISOString().substring(0, 10)}.xlsx`,
              lignes,
              indicateursParOrganismeExportColumns
            );
          }}
        >
          Télécharger la liste
        </Button>
      </div>

      <div className={styles.organismesTable}>
        <DataTable
          data={rows}
          columns={columns}
          sorting={sort}
          onSortingChange={(updater) => {
            const next =
              typeof updater === "function" ? (updater as (old: SortingState) => SortingState)(sort) : updater;
            onSortChange(next);
          }}
          pageSize={20}
          emptyMessage={
            loading ? "Chargement…" : "Aucun organisme ne semble correspondre aux filtres que vous avez sélectionnés"
          }
          tableLabel="Répartition des effectifs par organismes"
        />
      </div>
    </>
  );
}
