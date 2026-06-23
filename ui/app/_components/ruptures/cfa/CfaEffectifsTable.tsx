"use client";

import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment } from "react";

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
  showNonRuptureAlerts?: boolean;
}

export function CfaEffectifsTable({
  effectifs,
  sort,
  order,
  onSort,
  onToggleRupture,
  showNonRuptureAlerts,
}: CfaEffectifsTableProps) {
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
                label="En rupture ?"
                sortKey="en_rupture"
                currentSort={sort}
                currentDir={order}
                onSort={onSort}
              />
              <span style={{ marginLeft: "0.25rem" }}>
                <Tooltip
                  kind="hover"
                  title={
                    <>
                      Sur la version actuelle du Tableau de bord vous ne pouvez pas supprimer le statut &quot;En
                      rupture&quot; sur le dossier d&apos;un jeune. Si le problème persiste ou que vous souhaitez nous
                      faire part d&apos;une recommandation{" "}
                      <a
                        href="https://cfas.apprentissage.beta.gouv.fr/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Écrivez-nous directement
                      </a>
                      , l&apos;équipe du service reste disponible.
                    </>
                  }
                />
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
              <Fragment key={effectif.id}>
                <tr
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
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className={`${sharedStyles.nowrapCell} ${rowClass ?? ""}`}>
                      {isOutOfRange ? (
                        <div className={sharedStyles.ruptureToggleDisabled}>
                          <span className={sharedStyles.ruptureLabel}>
                            {effectif.en_rupture ? "En rupture" : "Non"}
                          </span>
                          <ToggleSwitch
                            inputTitle="Statut rupture"
                            checked={effectif.en_rupture}
                            onChange={() => {}}
                            label=""
                            showCheckedHint={false}
                            classes={{ root: sharedStyles.toggleRootDisabled }}
                          />
                        </div>
                      ) : (
                        <div className={sharedStyles.ruptureToggle}>
                          <span className={sharedStyles.ruptureLabel}>
                            {effectif.en_rupture ? "En rupture" : "Non"}
                          </span>
                          <ToggleSwitch
                            inputTitle="Statut rupture"
                            checked={effectif.en_rupture}
                            onChange={() => onToggleRupture(effectif)}
                            label=""
                            showCheckedHint={false}
                            classes={{ root: sharedStyles.toggleRoot }}
                          />
                        </div>
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
                    <div className={`${sharedStyles.dateCell} ${rowClass ?? ""}`}>
                      {effectif.date_rupture ? (
                        <DateRuptureCell dateStr={effectif.date_rupture} />
                      ) : (
                        <span className={styles.emptyDate}>—</span>
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
                              title={
                                effectif.is_plus_25
                                  ? "Les Missions Locales s'occupent du public jeune uniquement sur la tranche des 16 à 25 ans. Les apprenants âgés de plus de 25 ans ne pourront pas être renvoyés aux services des Missions Locales et ne sont donc pas éligibles à la collaboration via le Tableau de bord."
                                  : "Les Missions Locales s'occupent du public jeune uniquement sur la tranche des 16 à 25 ans. Les apprenants âgés de moins de 16 ans ne pourront pas être renvoyés aux services des Missions Locales et ne sont donc pas éligibles à la collaboration via le Tableau de bord."
                              }
                            />
                          </span>
                        </span>
                      ) : effectif.collab_status ? (
                        <CfaCollaborationBadge status={effectif.collab_status} effectifId={effectif.id} />
                      ) : (
                        <span className={styles.declareRuptureCta}>
                          Déclarer en rupture pour démarrer une collaboration avec la ML
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {showNonRuptureAlerts && !effectif.en_rupture && (
                  <tr className={styles.alertRow}>
                    <td colSpan={6}>
                      <div className={styles.alertBox}>
                        <i className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" />
                        <div>
                          <p className={styles.alertTitle}>
                            Le dossier de {effectif.prenom} n&apos;est pas en rupture, pour collaborer avec la Mission
                            Locale déclarez &quot;Oui&quot; sur le statut &quot;En rupture&quot;
                          </p>
                          <p className={styles.alertDescription}>
                            Le statut indiqué dans votre ERP ne nous a pas permis de vous afficher le dossier de{" "}
                            {effectif.prenom} dans la liste des effectifs en rupture. Déclarez le dossier de{" "}
                            {effectif.prenom} en rupture pour pouvoir collaborer.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
