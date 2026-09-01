"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ML_SITUATION_DOSSIER_LABEL, ML_TRI_COLONNE } from "shared/constants";

import type { MlListeEffectif } from "@/common/types/ruptures";

import { CommuneCell } from "../../shared/ui/CommuneCell";
import { EffectifPriorityBadgeMultiple } from "../../shared/ui/EffectifStatusBadge";
import { SituationCell } from "../../shared/ui/SituationCell";
import { ML_SITUATION_TOOLTIPS } from "../../shared/ui/situationTooltips";
import sharedStyles from "../../shared/ui/SortableTable.module.css";
import { StatutDateCell } from "../../shared/ui/StatutDateCell";

import styles from "./MlEffectifsTable.module.css";
import type { MlTriEtat } from "./tri";

interface MlEffectifsTableProps {
  effectifs: MlListeEffectif[];
  getRowLink: (effectif: MlListeEffectif) => string;
  emptyMessage?: string;
  tri?: MlTriEtat | null;
  onTri?: (colonne: ML_TRI_COLONNE) => void;
}

const COLONNES: { label: string; cle: ML_TRI_COLONNE; className?: string }[] = [
  { label: "Prénom Nom", cle: ML_TRI_COLONNE.NOM },
  { label: "Situation", cle: ML_TRI_COLONNE.SITUATION },
  { label: "Formation CFA", cle: ML_TRI_COLONNE.FORMATION },
  { label: "Commune du jeune", cle: ML_TRI_COLONNE.COMMUNE },
  { label: "Statut", cle: ML_TRI_COLONNE.STATUT },
];

export function MlEffectifsTable({
  effectifs,
  getRowLink,
  emptyMessage = "Aucun dossier trouvé.",
  tri,
  onTri,
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
            {COLONNES.map(({ label, cle }) => {
              const ordreAria =
                tri?.colonne === cle
                  ? tri.ordre === "asc"
                    ? ("ascending" as const)
                    : ("descending" as const)
                  : undefined;
              return (
                <th
                  key={cle}
                  className={cle === ML_TRI_COLONNE.STATUT ? styles.statutHeader : undefined}
                  aria-sort={ordreAria}
                >
                  <span className={styles.headerContenu}>
                    {label}
                    {onTri && (
                      // fr-btn--sort porte l'icône double flèche et sa rotation selon aria-sort ;
                      // son libellé est masqué par le DSFR mais reste lu par les lecteurs d'écran.
                      <button
                        type="button"
                        className="fr-btn fr-btn--secondary fr-btn--sort"
                        aria-sort={ordreAria}
                        onClick={() => onTri(cle)}
                      >
                        {`Trier par ${label}`}
                      </button>
                    )}
                  </span>
                </th>
              );
            })}
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
