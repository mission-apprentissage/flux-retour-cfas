"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ML_SITUATION_DOSSIER_LABEL } from "shared/constants";

import { formatRelativeDate } from "@/app/_utils/date.utils";
import type { ICfaEffectif } from "@/common/types/cfaRuptures";
import { CFA_COLLAB_STATUS } from "@/common/types/cfaRuptures";

import { SituationCell } from "../shared/ui/SituationCell";
import { ML_SITUATION_TOOLTIPS } from "../shared/ui/situationTooltips";
import sharedStyles from "../shared/ui/SortableTable.module.css";
import { SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge, CfaHorsCollabTag } from "./CfaCollaborationBadge";
import styles from "./CfaEffectifsTable.module.css";
import { CFA_FICHE_ORIGINE, cfaFicheHref } from "./ficheOrigine";

type SortKey = "nom" | "formation" | "mission_locale" | "last_activity";

interface CfaCollaborationsTableProps {
  effectifs: ICfaEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
  /** Onglet courant, conservé pour y revenir depuis le fil d'Ariane de la fiche. */
  category: string;
}

export function CfaCollaborationsTable({ effectifs, sort, order, onSort, category }: CfaCollaborationsTableProps) {
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
              <span className={styles.plainHeader}>
                Situation
                <span className={styles.headerTooltip}>
                  <Tooltip
                    kind="hover"
                    title="Situation du jeune telle que vous l'avez qualifiée en demandant la collaboration, ou déduite de sa situation contractuelle."
                  />
                </span>
              </span>
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
            <th className={styles.missionLocaleHeader}>
              <SortableHeader
                label="Mission Locale"
                sortKey="mission_locale"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
            <th className={sharedStyles.collabHeader}>
              <SortableHeader
                label="Dernière activité"
                sortKey="last_activity"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {effectifs.map((e) => {
            const href = cfaFicheHref(e.id, CFA_FICHE_ORIGINE.COLLABORATIONS, category);
            return (
              <tr
                key={e.id}
                className={sharedStyles.clickableRow}
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  // n'agir que lorsque la ligne elle-même a le focus (pas un contrôle interne)
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter") router.push(href);
                }}
                tabIndex={0}
                role="link"
                aria-label={`Voir le dossier de ${e.prenom} ${e.nom}`}
              >
                <td>
                  <div className={sharedStyles.nameCell}>
                    <Link href={href} className={sharedStyles.nameText} onClick={(event) => event.stopPropagation()}>
                      {e.prenom} {e.nom}
                    </Link>
                    {e.has_unread_notification && (
                      <span
                        className={styles.unreadDot}
                        role="status"
                        aria-label="Nouveau retour de la Mission Locale"
                      />
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
                <td>
                  <div className={styles.missionLocaleCell}>
                    {e.mission_locale ? (
                      <>
                        <span>ML {e.mission_locale.nom}</span>
                        {e.mission_locale.commune && (
                          <span className={styles.missionLocaleCommune}>{e.mission_locale.commune}</span>
                        )}
                      </>
                    ) : (
                      <span className={styles.emptyCell}>—</span>
                    )}
                  </div>
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className={styles.derniereActiviteCell}>
                    {e.collab_status && (
                      <CfaCollaborationBadge status={e.collab_status} effectifId={e.id} sansTagHorsCollab />
                    )}
                    {(e.last_activity_at || e.collab_status === CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB) && (
                      <span className={styles.derniereActiviteLigne}>
                        {e.last_activity_at && (
                          <span className={styles.derniereActivite}>{formatRelativeDate(e.last_activity_at)}</span>
                        )}
                        {e.collab_status === CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB && (
                          <>
                            {e.last_activity_at && <span className={styles.derniereActivite}>•</span>}
                            <CfaHorsCollabTag />
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
