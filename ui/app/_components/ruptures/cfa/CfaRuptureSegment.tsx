"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import type { CfaRuptureSegmentKey, ICfaRuptureEffectif } from "@/common/types/cfaRuptures";
import { CFA_DEFAULT_ITEMS_TO_SHOW, COLLAB_STATUS_ORDER, SEGMENT_LABELS } from "@/common/types/cfaRuptures";

import notificationStyles from "../shared/ui/NotificationBadge.module.css";
import sharedStyles from "../shared/ui/SortableTable.module.css";
import { DateRuptureCell, SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaRuptureSegment.module.css";

type SortKey = "nom" | "formation" | "date_rupture" | "collab_status";
type SortDir = "asc" | "desc";

interface CfaRuptureSegmentProps {
  segment: CfaRuptureSegmentKey;
  effectifs: ICfaRuptureEffectif[];
}

const SEGMENTS_WITH_NOTICE: CfaRuptureSegmentKey[] = ["46_90j", "91_180j"];

const NOTICE_TITLE = "Les jeunes ci-dessous peuvent avoir déjà été contactés par une Mission Locale";
const NOTICE_CONTENT =
  "Pour favoriser les chances des jeunes à retrouver un contrat, le Tableau de bord de l'apprentissage transmet les dossiers des jeunes en rupture depuis + de 45 jours directement aux Missions Locales.";

function sortEffectifs(effectifs: ICfaRuptureEffectif[], sortKey: SortKey, sortDir: SortDir): ICfaRuptureEffectif[] {
  return [...effectifs].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "nom":
        cmp = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr");
        break;
      case "formation":
        cmp = (a.libelle_formation || "").localeCompare(b.libelle_formation || "", "fr");
        break;
      case "date_rupture":
        cmp = a.jours_depuis_rupture - b.jours_depuis_rupture;
        break;
      case "collab_status":
        cmp = (COLLAB_STATUS_ORDER[a.collab_status] ?? 0) - (COLLAB_STATUS_ORDER[b.collab_status] ?? 0);
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
}

export function CfaRuptureSegment({ segment, effectifs }: CfaRuptureSegmentProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date_rupture");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isExpanded, setIsExpanded] = useState(false);
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const router = useRouter();

  const hasNotice = SEGMENTS_WITH_NOTICE.includes(segment);

  const sorted = useMemo(() => sortEffectifs(effectifs, sortKey, sortDir), [effectifs, sortKey, sortDir]);
  const displayed = isExpanded ? sorted : sorted.slice(0, CFA_DEFAULT_ITEMS_TO_SHOW);
  const remaining = sorted.length - CFA_DEFAULT_ITEMS_TO_SHOW;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <section className={`${styles.card} ${styles.cardWithMargin}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{SEGMENT_LABELS[segment]}</h3>
        <span className={styles.cardCount}>
          {effectifs.length} effectif{effectifs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {hasNotice && (
        <div className={styles.noticeBox}>
          <p className={styles.noticeTitle}>
            <i className="fr-icon-info-fill" aria-hidden="true" />
            {NOTICE_TITLE}
          </p>
          <p className={styles.noticeContent}>{NOTICE_CONTENT}</p>
        </div>
      )}

      {effectifs.length === 0 ? (
        <p className={styles.emptyMessage}>Aucun effectif en rupture dans cette tranche.</p>
      ) : (
        <>
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <SortableHeader
                      label="Prénom Nom"
                      sortKey="nom"
                      currentSort={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th>
                    En rupture ?
                    <span style={{ marginLeft: "0.25rem" }}>
                      <Tooltip
                        kind="hover"
                        title={
                          <>
                            Sur la version actuelle du Tableau de bord vous ne pouvez pas supprimer le statut &quot;En
                            rupture&quot; sur le dossier d&apos;un jeune. Si le problème persiste ou que vous souhaitez
                            nous faire part d&apos;une recommandation{" "}
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
                      currentSort={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={sharedStyles.centerHeader}>
                    <SortableHeader
                      label="Date de rupture"
                      sortKey="date_rupture"
                      currentSort={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={sharedStyles.collabHeader}>
                    <SortableHeader
                      label="Collaboration avec la ML ?"
                      sortKey="collab_status"
                      currentSort={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((e) => (
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
                      <div className={`${notificationStyles.badgeContainer} ${sharedStyles.nameCell}`}>
                        {e.has_unread_notification && (
                          <span
                            className={notificationStyles.notificationDot}
                            title="Nouvelle information de la Mission Locale"
                          />
                        )}
                        <Link
                          href={`/cfa/${e.id}`}
                          className={sharedStyles.nameText}
                          onClick={() => trackPlausibleEvent("cfa_liste_jeune_ouvert", undefined, { effectifId: e.id })}
                        >
                          {e.prenom} {e.nom}
                        </Link>
                      </div>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className={sharedStyles.nowrapCell}>
                        <div className={sharedStyles.ruptureToggleDisabled}>
                          <span className={sharedStyles.ruptureLabel}>En rupture</span>
                          <ToggleSwitch
                            inputTitle="Statut rupture"
                            checked={true}
                            onChange={() => {}}
                            label=""
                            showCheckedHint={false}
                            classes={{ root: sharedStyles.toggleRootDisabled }}
                          />
                        </div>
                      </div>
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
                        <DateRuptureCell dateStr={e.date_rupture} jours={e.jours_depuis_rupture} />
                      </div>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className={sharedStyles.collabCell}>
                        <CfaCollaborationBadge status={e.collab_status} effectifId={e.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isExpanded && remaining > 0 && (
            <div className={styles.expandContainer}>
              <Button
                className={styles.expandButton}
                priority="tertiary no outline"
                onClick={() => {
                  setIsExpanded(true);
                  trackPlausibleEvent("cfa_liste_afficher_plus", undefined, { segment });
                }}
              >
                Afficher tous ({remaining} de plus) +
              </Button>
            </div>
          )}
          {isExpanded && sorted.length > CFA_DEFAULT_ITEMS_TO_SHOW && (
            <div className={styles.expandContainer}>
              <Button
                className={styles.expandButton}
                priority="tertiary no outline"
                onClick={() => setIsExpanded(false)}
              >
                Réduire
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
