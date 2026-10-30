"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useState, type ReactNode } from "react";
import type { ICollabCorrelationRow } from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { OverviewCard } from "../cards/OverviewCard";
import { DonutChart } from "../charts/DonutChart";
import { MOTIFS_CONFIG } from "../charts/motifsConfig";
import { SITUATIONS_COLLAB, TRAITEMENT_SEGMENTS_V2 } from "../constants";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCollaborationCorrelations } from "../hooks/useStatsQueries";
import tableStyles from "../tables/CfaEtablissementsTable.module.css";
import { TraitementDetailsBar } from "../tables/TraitementDetailsBar";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CollabCorrelationsSection.module.css";

type Affichage = "tableau" | "graphique";

const pourcentage = (valeur: number, total: number) => (total > 0 ? Math.round((valeur / total) * 100) : 0);

function Bascule({
  affichage,
  onChange,
  legende,
}: {
  affichage: Affichage;
  onChange: (a: Affichage) => void;
  legende: string;
}) {
  return (
    <SegmentedControl
      hideLegend
      small
      legend={legende}
      className={styles.bascule}
      segments={[
        {
          label: "Tableau",
          iconId: "fr-icon-list-unordered",
          nativeInputProps: { checked: affichage === "tableau", onChange: () => onChange("tableau") },
        },
        {
          label: "Graphique",
          iconId: "fr-icon-bar-chart-box-line",
          nativeInputProps: { checked: affichage === "graphique", onChange: () => onChange("graphique") },
        },
      ]}
    />
  );
}

function MiniCamembert({ ligne }: { ligne: ICollabCorrelationRow }) {
  if (ligne.traites === 0) return <span className={tableStyles.emptyValue}>-</span>;
  return (
    <div className={styles.camembert}>
      <DonutChart
        data={TRAITEMENT_SEGMENTS_V2.map(({ key, label, color }) => ({
          id: key,
          label,
          color,
          value: ligne.resultats[key],
        }))}
        height={50}
        maxWidth={50}
        outerRadius={20}
        margin={0}
        valueFormatter={(item) => `${item.value.toLocaleString("fr-FR")} (${pourcentage(item.value, ligne.traites)} %)`}
      />
    </div>
  );
}

function CarteCorrelation({
  titre,
  enTeteLibelle,
  lignes,
  libelle,
  loading,
}: {
  titre: string;
  enTeteLibelle: string;
  lignes: ICollabCorrelationRow[];
  libelle: (ligne: ICollabCorrelationRow) => ReactNode;
  loading: boolean;
}) {
  const [affichage, setAffichage] = useState<Affichage>("graphique");

  return (
    <OverviewCard title={titre} actions={<Bascule affichage={affichage} onChange={setAffichage} legende={titre} />}>
      {loading ? (
        <TableSkeleton rows={lignes.length || 6} />
      ) : affichage === "tableau" ? (
        <div className={styles.tableau}>
          <Table
            headers={[enTeteLibelle, "Graphique", ...TRAITEMENT_SEGMENTS_V2.map(({ label }) => label)]}
            data={lignes.map((ligne) => [
              libelle(ligne),
              <MiniCamembert key="camembert" ligne={ligne} />,
              ...TRAITEMENT_SEGMENTS_V2.map(({ key }) => (
                <div key={key} className={styles.cellule}>
                  {ligne.resultats[key].toLocaleString("fr-FR")}
                  <span className={styles.pourcentage}>{pourcentage(ligne.resultats[key], ligne.traites)} %</span>
                </div>
              )),
            ])}
          />
        </div>
      ) : (
        <>
          <ul className={styles.legende} aria-label="Légende">
            {TRAITEMENT_SEGMENTS_V2.map(({ key, label, color }) => (
              <li key={key}>
                <span className={styles.pastille} style={{ backgroundColor: color }} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          <ul className={styles.barres}>
            {lignes.map((ligne) => (
              <li key={ligne.cle} className={styles.barre}>
                <span>{libelle(ligne)}</span>
                <TraitementDetailsBar details={ligne.resultats} total={ligne.traites} />
              </li>
            ))}
          </ul>
        </>
      )}
    </OverviewCard>
  );
}

const situation = (ligne: ICollabCorrelationRow) => {
  const config = SITUATIONS_COLLAB.find(({ key }) => key === ligne.cle);
  return (
    <span className={styles.libelle}>
      {config?.label ?? ligne.cle}
      {config?.sublabel && <span className={styles.sousLibelle}>{config.sublabel}</span>}
    </span>
  );
};

const objectif = (ligne: ICollabCorrelationRow) => {
  const config = MOTIFS_CONFIG.find(({ key }) => key === ligne.cle);
  return (
    <span className={styles.libelleObjectif}>
      {config && (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="#000091" aria-hidden="true">
          <path d={config.svgPath} />
        </svg>
      )}
      {config?.label ?? ligne.cle}
    </span>
  );
};

/** Chiffres clés des collaborations, réservé à l'admin : situations et objectifs croisés avec la réponse de la ML. */
export function CollabCorrelationsSection({ titreClassName }: { titreClassName?: string }) {
  const { period, scope } = useStatsFilters();
  const { data, isLoading, error } = useCollaborationCorrelations({ period, ...scope });

  return (
    <>
      <h3 className={titreClassName}>Pour aller plus loin…</h3>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <CarteCorrelation
          titre="Corrélation entre la situation du jeune et sa réponse à la Mission Locale"
          enTeteLibelle="Situation"
          lignes={data?.situations ?? []}
          libelle={situation}
          loading={isLoading}
        />
        <CarteCorrelation
          titre="Corrélation entre l'objectif d'accompagnement sélectionné et la réponse à la Mission Locale"
          enTeteLibelle="Objectif"
          lignes={data?.objectifs ?? []}
          libelle={objectif}
          loading={isLoading}
        />
      </StatsErrorHandler>
    </>
  );
}
