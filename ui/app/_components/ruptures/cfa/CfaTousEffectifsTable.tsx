"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { CfaEffectifSituation, ICfaEffectif } from "@/common/types/cfaRuptures";
import { CFA_EFFECTIF_SITUATION, SITUATION_LABELS } from "@/common/types/cfaRuptures";

import sharedStyles from "../shared/ui/SortableTable.module.css";
import { SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaTousEffectifsTable.module.css";

type SortKey = "nom" | "formation" | "mission_locale" | "collab_status";

interface CfaTousEffectifsTableProps {
  effectifs: ICfaEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

const SITUATION_TOOLTIPS: Partial<Record<CfaEffectifSituation, string>> = {
  [CFA_EFFECTIF_SITUATION.RUPTURE]: "Ce jeune est en rupture de contrat d'après votre source de données.",
  [CFA_EFFECTIF_SITUATION.RUPTURE_DECA]:
    "Cette rupture provient de la base DECA (contrats déposés par les OPCO et les DDETS), et non de votre ERP.",
  [CFA_EFFECTIF_SITUATION.PREVENTION_RUPTURE]:
    "Vous avez envoyé un dossier à la Mission Locale pour ce jeune encore en contrat, afin de prévenir une rupture.",
  [CFA_EFFECTIF_SITUATION.ABANDON]: "Ce jeune a abandonné sa formation d'après votre source de données.",
  [CFA_EFFECTIF_SITUATION.SANS_CONTRAT]: "Ce jeune est inscrit en formation mais n'a pas de contrat d'apprentissage.",
};

function SituationCell({ effectif, dimmed }: { effectif: ICfaEffectif; dimmed?: boolean }) {
  if (!effectif.situation) {
    return <span className={`${styles.emptyCell} ${dimmed ? styles.dimmed : ""}`}>—</span>;
  }

  const dateRupture = effectif.date_rupture
    ? new Date(effectif.date_rupture).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const tooltip = SITUATION_TOOLTIPS[effectif.situation];
  const showDateRupture =
    effectif.situation === CFA_EFFECTIF_SITUATION.RUPTURE || effectif.situation === CFA_EFFECTIF_SITUATION.RUPTURE_DECA;

  return (
    <div className={styles.situationCell}>
      <span className={styles.situationLabel}>
        <span className={dimmed ? styles.dimmed : undefined}>{SITUATION_LABELS[effectif.situation]}</span>
        {tooltip && (
          <span className={`${styles.situationTooltip} ${dimmed ? styles.situationTooltipDimmed : ""}`}>
            <Tooltip kind="hover" title={tooltip} />
          </span>
        )}
      </span>
      {showDateRupture && dateRupture && (
        <span className={`${styles.situationDetail} ${dimmed ? styles.dimmed : ""}`}>depuis le {dateRupture}</span>
      )}
    </div>
  );
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
              <span className={styles.plainHeader}>
                Situation
                <span className={styles.headerTooltip}>
                  <Tooltip
                    kind="hover"
                    title="Situation de l'apprenant : rupture de contrat, prévention de rupture après l'envoi d'un dossier, abandon de formation, ou inscription sans contrat."
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
                onClick={isOutOfRange ? undefined : () => router.push(`/cfa/${effectif.id}`)}
                onKeyDown={
                  isOutOfRange
                    ? undefined
                    : (event) => {
                        // n'agir que lorsque la ligne elle-même a le focus (pas un contrôle interne)
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter") router.push(`/cfa/${effectif.id}`);
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
                        href={`/cfa/${effectif.id}`}
                        className={sharedStyles.nameText}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {effectif.prenom} {effectif.nom}
                      </Link>
                    )}
                  </div>
                </td>
                <td>
                  <SituationCell effectif={effectif} dimmed={isOutOfRange} />
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
