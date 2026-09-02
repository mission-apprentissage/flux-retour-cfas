"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ML_SITUATION_DOSSIER_LABEL } from "shared/constants";

import type { ICfaEffectif } from "@/common/types/cfaRuptures";

import { SituationCell } from "../shared/ui/SituationCell";
import { ML_SITUATION_TOOLTIPS } from "../shared/ui/situationTooltips";
import sharedStyles from "../shared/ui/SortableTable.module.css";
import { SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaEffectifsTable.module.css";

type SortKey = "nom" | "formation" | "situation" | "collab_status";

interface CfaCollaborationsTableProps {
  effectifs: ICfaEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

export function CfaCollaborationsTable({ effectifs, sort, order, onSort }: CfaCollaborationsTableProps) {
  const router = useRouter();

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
            <th>
              <SortableHeader
                label="Situation"
                sortKey="situation"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
            <th>
              <SortableHeader
                label="Formation"
                sortKey="formation"
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
            <tr
              key={e.id}
              className={sharedStyles.clickableRow}
              onClick={() => router.push(`/cfa/${e.id}`)}
              onKeyDown={(event) => {
                // n'agir que lorsque la ligne elle-même a le focus (pas un contrôle interne)
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter") router.push(`/cfa/${e.id}`);
              }}
              tabIndex={0}
              role="link"
              aria-label={`Voir le dossier de ${e.prenom} ${e.nom}`}
            >
              <td>
                <div className={sharedStyles.nameCell}>
                  <Link
                    href={`/cfa/${e.id}`}
                    className={sharedStyles.nameText}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {e.prenom} {e.nom}
                  </Link>
                  {e.has_unread_notification && (
                    <span className={styles.unreadDot} role="status" aria-label="Nouveau retour de la Mission Locale" />
                  )}
                </div>
              </td>
              <td>
                <SituationCell
                  label={e.situation_dossier ? ML_SITUATION_DOSSIER_LABEL[e.situation_dossier] : null}
                  tooltip={e.situation_dossier ? ML_SITUATION_TOOLTIPS[e.situation_dossier] : undefined}
                />
              </td>
              <td>
                <div className={sharedStyles.formationCell}>
                  <span>{e.libelle_formation}</span>
                  {e.formation_niveau_libelle && (
                    <span className={sharedStyles.formationNiveau}>{e.formation_niveau_libelle}</span>
                  )}
                </div>
              </td>
              <td onClick={(event) => event.stopPropagation()}>
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
