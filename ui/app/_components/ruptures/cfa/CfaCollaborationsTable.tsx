"use client";

import Link from "next/link";

import type { ICfaEffectif } from "@/common/types/cfaRuptures";

import sharedStyles from "../shared/ui/SortableTable.module.css";
import { DateRuptureCell, SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaEffectifsTable.module.css";

type SortKey = "nom" | "formation" | "date_rupture" | "collab_status";

interface CfaCollaborationsTableProps {
  effectifs: ICfaEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

export function CfaCollaborationsTable({ effectifs, sort, order, onSort }: CfaCollaborationsTableProps) {
  if (effectifs.length === 0) {
    return <p className={styles.emptyMessage}>Aucun dossier trouvé.</p>;
  }

  return (
    <div className="fr-table">
      <table>
        <thead>
          <tr>
            <th>
              <SortableHeader label="Prénom Nom" sortKey="nom" currentSort={sort} currentDir={order} onSort={onSort} />
            </th>
            <th>En rupture</th>
            <th>
              <SortableHeader
                label="Formation"
                sortKey="formation"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
            <th className={sharedStyles.centerHeader}>
              <SortableHeader
                label="Date de rupture"
                sortKey="date_rupture"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
            <th className={sharedStyles.collabHeader}>
              <SortableHeader
                label="Collaboration avec la ML"
                sortKey="collab_status"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {effectifs.map((e) => (
            <tr key={e.id}>
              <td>
                <div className={sharedStyles.nameCell}>
                  <Link href={`/cfa/${e.id}`} className={sharedStyles.nameText}>
                    {e.prenom} {e.nom}
                  </Link>
                  {e.has_unread_notification && (
                    <span className={styles.unreadDot} role="status" aria-label="Nouveau retour de la Mission Locale" />
                  )}
                </div>
              </td>
              <td>
                <span className={styles.enRuptureOui}>Oui</span>
              </td>
              <td>
                <div className={sharedStyles.formationCell}>
                  <span>{e.libelle_formation}</span>
                  {e.formation_niveau_libelle && (
                    <span className={sharedStyles.formationNiveau}>{e.formation_niveau_libelle}</span>
                  )}
                </div>
              </td>
              <td>
                <div className={sharedStyles.dateCell}>
                  {e.date_rupture ? <DateRuptureCell dateStr={e.date_rupture} /> : <span>—</span>}
                </div>
              </td>
              <td>
                <div className={sharedStyles.collabCell}>
                  {e.collab_status && <CfaCollaborationBadge status={e.collab_status} effectifId={e.id} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
