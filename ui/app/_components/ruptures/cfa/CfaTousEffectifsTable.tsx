"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ICfaEffectif } from "@/common/types/cfaRuptures";

import sharedStyles from "../shared/ui/SortableTable.module.css";
import { SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaTousEffectifsTable.module.css";
import { CFA_FICHE_ORIGINE, cfaFicheHref } from "./ficheOrigine";

type SortKey = "nom" | "formation" | "mission_locale" | "collab_status";

interface CfaTousEffectifsTableProps {
  effectifs: ICfaEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

export function CfaTousEffectifsTable({ effectifs, sort, order, onSort }: CfaTousEffectifsTableProps) {
  const router = useRouter();

  if (effectifs.length === 0) {
    return <p className={styles.emptyMessage}>Aucun effectif trouvé.</p>;
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
                label="Collaboration avec la ML ?"
                sortKey="collab_status"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {effectifs.map((effectif) => {
            const isOutOfRange = effectif.is_plus_25 || effectif.is_moins_16;
            const rowClass = isOutOfRange ? styles.outOfRangeRow : undefined;

            return (
              <tr
                key={effectif.id}
                className={isOutOfRange ? undefined : sharedStyles.clickableRow}
                onClick={
                  isOutOfRange ? undefined : () => router.push(cfaFicheHref(effectif.id, CFA_FICHE_ORIGINE.EFFECTIFS))
                }
                onKeyDown={
                  isOutOfRange
                    ? undefined
                    : (event) => {
                        // n'agir que lorsque la ligne elle-même a le focus (pas un contrôle interne)
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter") router.push(cfaFicheHref(effectif.id, CFA_FICHE_ORIGINE.EFFECTIFS));
                      }
                }
                tabIndex={isOutOfRange ? undefined : 0}
                role={isOutOfRange ? undefined : "link"}
                aria-label={isOutOfRange ? undefined : `Voir le dossier de ${effectif.prenom} ${effectif.nom}`}
              >
                <td>
                  <div className={`${sharedStyles.nameCell} ${rowClass ?? ""}`}>
                    {isOutOfRange ? (
                      <span>
                        {effectif.prenom} {effectif.nom}
                      </span>
                    ) : (
                      <Link
                        href={cfaFicheHref(effectif.id, CFA_FICHE_ORIGINE.EFFECTIFS)}
                        className={sharedStyles.nameText}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {effectif.prenom} {effectif.nom}
                      </Link>
                    )}
                  </div>
                </td>
                <td>
                  <div className={`${sharedStyles.formationCell} ${rowClass ?? ""}`}>
                    <span>{effectif.libelle_formation}</span>
                    {effectif.formation_niveau_libelle && (
                      <span className={sharedStyles.formationNiveau}>{effectif.formation_niveau_libelle}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={`${styles.missionLocaleCell} ${rowClass ?? ""}`}>
                    {effectif.mission_locale ? (
                      <>
                        <span>ML {effectif.mission_locale.nom}</span>
                        {effectif.mission_locale.commune && (
                          <span className={styles.missionLocaleCommune}>{effectif.mission_locale.commune}</span>
                        )}
                      </>
                    ) : (
                      <span className={styles.emptyCell}>—</span>
                    )}
                  </div>
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className={`${sharedStyles.collabCell} ${isOutOfRange ? "" : (rowClass ?? "")}`}>
                    {isOutOfRange ? (
                      <span className={styles.outOfRangeBadge}>
                        <i className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" />
                        <span>{effectif.is_plus_25 ? "+ de 25 ans" : "- de 16 ans"}</span>
                        <span className={styles.outOfRangeTooltip}>
                          <Tooltip
                            kind="hover"
                            title="Les Missions Locales accompagnent uniquement les publics de 16 à 25 ans : ce jeune n'est pas éligible à une collaboration via le Tableau de bord."
                          />
                        </span>
                      </span>
                    ) : effectif.collab_status ? (
                      <CfaCollaborationBadge
                        status={effectif.collab_status}
                        effectifId={effectif.id}
                        unavailableReason={
                          effectif.mission_locale
                            ? undefined
                            : "La Mission Locale de rattachement de ce jeune n'a pas pu être identifiée à partir de son adresse : vérifiez son code postal auprès de votre ERP avant de démarrer une collaboration."
                        }
                      />
                    ) : (
                      <span className={styles.emptyCell}>—</span>
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
