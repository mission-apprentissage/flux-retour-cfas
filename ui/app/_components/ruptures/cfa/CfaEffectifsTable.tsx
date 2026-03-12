"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
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
            <th>
              <span className="fr-sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {effectifs.map((e) => {
            const rowClass = e.is_plus_25 ? styles.plus25Row : undefined;

            return (
              <Fragment key={e.id}>
                <tr>
                  <td>
                    <div className={`${sharedStyles.nameCell} ${rowClass ?? ""}`}>
                      {e.is_plus_25 ? (
                        <span>
                          {e.prenom} {e.nom}
                        </span>
                      ) : (
                        <Link href={`/cfa/${e.id}`} className={sharedStyles.nameText}>
                          {e.prenom} {e.nom}
                        </Link>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`${sharedStyles.nowrapCell} ${rowClass ?? ""}`}>
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
                    </div>
                  </td>
                  <td>
                    <div className={`${sharedStyles.formationCell} ${rowClass ?? ""}`}>
                      <span>{e.libelle_formation}</span>
                      {e.formation_niveau_libelle && (
                        <span className={sharedStyles.formationNiveau}>{e.formation_niveau_libelle}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`${sharedStyles.dateCell} ${rowClass ?? ""}`}>
                      {e.date_rupture ? (
                        <DateRuptureCell dateStr={e.date_rupture} />
                      ) : (
                        <span className={styles.emptyDate}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`${sharedStyles.collabCell} ${e.is_plus_25 ? "" : (rowClass ?? "")}`}>
                      {e.is_plus_25 ? (
                        <span className={styles.plus25Badge}>
                          <i className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" />
                          <span>+ de 25 ans</span>
                          <span className={styles.plus25Tooltip}>
                            <Tooltip
                              kind="hover"
                              title="Les Missions Locales s'occupent du public jeune uniquement sur la tranche des 16 à 25 ans. Les apprenants âgés de plus de 25 ans ne pourront pas être renvoyés aux services des Missions Locales et ne sont donc pas éligibles à la collaboration via le Tableau de bord."
                            />
                          </span>
                        </span>
                      ) : e.collab_status ? (
                        <CfaCollaborationBadge status={e.collab_status} effectifId={e.id} />
                      ) : (
                        <span className={styles.declareRuptureCta}>
                          Déclarer en rupture pour démarrer une collaboration avec la ML
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {e.is_plus_25 ? (
                      <span />
                    ) : (
                      <Button
                        className={styles.moreButton}
                        priority="tertiary no outline"
                        size="small"
                        iconId="ri-more-2-fill"
                        title="Voir la fiche"
                        linkProps={{ href: `/cfa/${e.id}` }}
                      />
                    )}
                  </td>
                </tr>
                {showNonRuptureAlerts && !e.en_rupture && (
                  <tr className={styles.alertRow}>
                    <td colSpan={6}>
                      <div className={styles.alertBox}>
                        <i className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" />
                        <div>
                          <p className={styles.alertTitle}>
                            Le dossier de {e.prenom} n&apos;est pas en rupture, pour collaborer avec la Mission Locale
                            déclarez &quot;Oui&quot; sur le statut &quot;En rupture&quot;
                          </p>
                          <p className={styles.alertDescription}>
                            Le statut indiqué dans votre ERP ne nous a pas permis de vous afficher le dossier de{" "}
                            {e.prenom} dans la liste des effectifs en rupture. Déclarez le dossier de {e.prenom} en
                            rupture pour pouvoir collaborer.
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
