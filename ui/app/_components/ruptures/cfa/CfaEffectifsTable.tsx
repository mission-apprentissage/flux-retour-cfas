"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import Link from "next/link";

import type { ICfaEffectif } from "@/common/types/cfaRuptures";

import sharedStyles from "../shared/ui/SortableTable.module.css";
import { DateRuptureCell, SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaEffectifsTable.module.css";

type SortKey = "nom" | "formation" | "date_rupture" | "en_rupture" | "collab_status";

interface CfaEffectifsTableProps {
  effectifs: ICfaEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onToggleRupture: (effectif: ICfaEffectif) => void;
}

export function CfaEffectifsTable({ effectifs, sort, order, onSort, onToggleRupture }: CfaEffectifsTableProps) {
  if (effectifs.length === 0) {
    return <p className={styles.emptyMessage}>Aucun effectif trouvé.</p>;
  }

  const headers = [
    <SortableHeader key="nom" label="Prénom Nom" sortKey="nom" currentSort={sort} currentDir={order} onSort={onSort} />,
    <SortableHeader
      key="en_rupture"
      label="En rupture ?"
      sortKey="en_rupture"
      currentSort={sort}
      currentDir={order}
      onSort={onSort}
    />,
    <SortableHeader
      key="formation"
      label="Formation"
      sortKey="formation"
      currentSort={sort}
      currentDir={order}
      onSort={onSort}
    />,
    <div key="date" className={sharedStyles.centerHeader}>
      <SortableHeader
        label="Date de rupture"
        sortKey="date_rupture"
        currentSort={sort}
        currentDir={order}
        onSort={onSort}
      />
    </div>,
    <div key="collab" className={sharedStyles.collabHeader}>
      <SortableHeader
        label="Collaboration avec la ML ?"
        sortKey="collab_status"
        currentSort={sort}
        currentDir={order}
        onSort={onSort}
      />
    </div>,
    <span key="actions" className="fr-sr-only">
      Actions
    </span>,
  ];

  const data = effectifs.map((e) => {
    const rowClass = e.is_plus_25 ? styles.plus25Row : undefined;

    return [
      <div key={e.id} className={`${sharedStyles.nameCell} ${rowClass ?? ""}`}>
        {e.is_plus_25 ? (
          <span>
            {e.prenom} {e.nom}
          </span>
        ) : (
          <Link href={`/cfa/${e.id}?from=effectifs&source=${e.source}`} className={sharedStyles.nameText}>
            {e.prenom} {e.nom}
          </Link>
        )}
      </div>,
      <div key={`rupture-${e.id}`} className={`${sharedStyles.nowrapCell} ${rowClass ?? ""}`}>
        {e.is_plus_25 ? (
          <div className={styles.ruptureToggleDisabled}>
            <span className={sharedStyles.ruptureLabel}>{e.en_rupture ? "En rupture" : "Non"}</span>
            <ToggleSwitch
              inputTitle="Statut rupture"
              checked={e.en_rupture}
              onChange={() => {}}
              label=""
              showCheckedHint={false}
              classes={{ root: styles.toggleRootDisabled }}
            />
          </div>
        ) : (
          <div className={sharedStyles.ruptureToggle}>
            <span className={sharedStyles.ruptureLabel}>{e.en_rupture ? "En rupture" : "Non"}</span>
            <ToggleSwitch
              inputTitle="Statut rupture"
              checked={e.en_rupture}
              onChange={() => onToggleRupture(e)}
              label=""
              showCheckedHint={false}
              classes={{ root: sharedStyles.toggleRoot }}
            />
          </div>
        )}
      </div>,
      <div key={`formation-${e.id}`} className={`${sharedStyles.formationCell} ${rowClass ?? ""}`}>
        <span>{e.libelle_formation}</span>
        {e.formation_niveau_libelle && (
          <span className={sharedStyles.formationNiveau}>{e.formation_niveau_libelle}</span>
        )}
      </div>,
      <div key={`date-${e.id}`} className={`${sharedStyles.dateCell} ${rowClass ?? ""}`}>
        {e.date_rupture ? <DateRuptureCell dateStr={e.date_rupture} /> : <span className={styles.emptyDate}>—</span>}
      </div>,
      <div key={`collab-${e.id}`} className={`${sharedStyles.collabCell} ${rowClass ?? ""}`}>
        {e.is_plus_25 ? (
          <span className={styles.plus25Disabled}>Collaboration non disponible pour les +25 ans</span>
        ) : e.collab_status ? (
          <CfaCollaborationBadge status={e.collab_status} effectifId={e.id} />
        ) : (
          <span className={styles.declareRuptureCta}>
            Déclarer en rupture pour démarrer une collaboration avec la ML
          </span>
        )}
      </div>,
      e.is_plus_25 ? (
        <span key={`more-${e.id}`} />
      ) : (
        <Button
          key={`more-${e.id}`}
          className={styles.moreButton}
          priority="tertiary no outline"
          size="small"
          iconId="ri-more-2-fill"
          title="Voir la fiche"
          linkProps={{ href: `/cfa/${e.id}?from=effectifs&source=${e.source}` }}
        />
      ),
    ];
  });

  return <Table headers={headers} data={data} />;
}
