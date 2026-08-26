"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ML_SITUATION_DOSSIER_LABEL } from "shared/constants";

import type { MlListeEffectif } from "@/common/types/ruptures";

import { CommuneCell } from "../../shared/ui/CommuneCell";
import { EffectifPriorityBadgeMultiple } from "../../shared/ui/EffectifStatusBadge";
import { SituationCell } from "../../shared/ui/SituationCell";
import sharedStyles from "../../shared/ui/SortableTable.module.css";
import { StatutDateCell } from "../../shared/ui/StatutDateCell";

import styles from "./MlEffectifsTable.module.css";
import { ML_SITUATION_TOOLTIPS } from "./situationTooltips";

interface MlEffectifsTableProps {
  effectifs: MlListeEffectif[];
  getRowLink: (effectif: MlListeEffectif) => string;
  emptyMessage?: string;
}

export function MlEffectifsTable({
  effectifs,
  getRowLink,
  emptyMessage = "Aucun dossier trouvé.",
}: MlEffectifsTableProps) {
  const router = useRouter();

  if (effectifs.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>;
  }

  return (
    <div className={`fr-table ${styles.tableWrapper}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Prénom Nom</th>
            <th>Situation</th>
            <th>Formation CFA</th>
            <th>Commune du jeune</th>
            <th className={styles.statutHeader}>Statut</th>
            <th aria-label="Accès au dossier" />
          </tr>
        </thead>
        <tbody>
          {effectifs.map((effectif) => {
            const href = getRowLink(effectif);
            return (
              <tr
                key={effectif.id}
                className={sharedStyles.clickableRow}
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  // n'agir que lorsque la ligne elle-même a le focus (pas un contrôle interne)
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter") router.push(href);
                }}
                tabIndex={0}
                role="link"
                aria-label={`Voir le dossier de ${effectif.prenom} ${effectif.nom}`}
              >
                <td>
                  <div className={styles.nameCell}>
                    <EffectifPriorityBadgeMultiple effectif={effectif} isHeader />
                    <Link href={href} className={sharedStyles.nameText} onClick={(event) => event.stopPropagation()}>
                      {effectif.prenom} {effectif.nom}
                    </Link>
                  </div>
                </td>
                <td>
                  <SituationCell
                    label={ML_SITUATION_DOSSIER_LABEL[effectif.situation_dossier]}
                    tooltip={ML_SITUATION_TOOLTIPS[effectif.situation_dossier]}
                  />
                </td>
                <td>
                  <div className={sharedStyles.formationCell}>
                    <span>{effectif.libelle_formation}</span>
                    {effectif.organisme_nom && (
                      <span className={sharedStyles.formationNiveau}>{effectif.organisme_nom}</span>
                    )}
                  </div>
                </td>
                <td>
                  <CommuneCell commune={effectif.commune} code_postal={effectif.code_postal} />
                </td>
                <td>
                  <StatutDateCell effectif={effectif} />
                </td>
                <td>
                  <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
