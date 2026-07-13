"use client";

import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import type { ICfaRuptureEffectif } from "@/common/types/cfaRuptures";
import { CFA_COLLAB_STATUS } from "@/common/types/cfaRuptures";

import notificationStyles from "../shared/ui/NotificationBadge.module.css";
import sharedStyles from "../shared/ui/SortableTable.module.css";
import { DateRuptureCell, SortableHeader } from "../shared/ui/SortableTableParts";

import { CfaCollaborationBadge } from "./CfaCollaborationBadge";
import styles from "./CfaRuptureSegment.module.css";

type SortKey = "nom" | "formation" | "date_rupture" | "collab_status";

interface CfaRuptureTableProps {
  effectifs: ICfaRuptureEffectif[];
  sort: string;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

// Largeurs figées (proportions maquette : 215/191/200/161/295 sur ~1062px) pour que les deux
// sous-tableaux — avant et après le bandeau "+45j" — gardent des colonnes parfaitement alignées.
const COLUMN_WIDTHS = ["20%", "18%", "19%", "15%", "28%"];

function TransmisAutoBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className={styles.transmisAutoBanner}>
      <p className={styles.transmisAutoTitle}>+45j après rupture</p>
      <div className={styles.transmisAutoNoticeRow}>
        <i className={`fr-icon-information-line fr-icon--sm ${styles.transmisAutoIcon}`} aria-hidden="true" />
        <span className={styles.transmisAutoText}>
          Les jeunes ci-dessous peuvent avoir été contactés en dehors d&apos;une collaboration
        </span>
        <button
          type="button"
          className={styles.transmisAutoToggle}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((v) => !v)}
        >
          Comment ça marche ?
          <i className={isExpanded ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} aria-hidden="true" />
        </button>
      </div>
      {isExpanded && (
        <div className={styles.transmisAutoContent}>
          <p className="fr-mb-1v">
            À partir de 45 jours après la rupture du contrat d&apos;apprentissage, si le jeune est toujours en rupture
            sans dossier envoyé, le dossier est transmis automatiquement à la Mission Locale de rattachement.
          </p>
          <p className={`fr-mb-0 ${styles.transmisAutoTags}`}>
            Ces jeunes sont identifiés par les étiquettes :
            <CfaCollaborationBadge status={CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB} effectifId="" inline />
          </p>
        </div>
      )}
    </div>
  );
}

export function CfaRuptureTable({ effectifs, sort, order, onSort }: CfaRuptureTableProps) {
  const router = useRouter();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const currentSort = sort as SortKey;

  const renderHeader = () => (
    <thead>
      <tr>
        <th>
          <SortableHeader
            label="Prénom Nom"
            sortKey="nom"
            currentSort={currentSort}
            currentDir={order}
            onSort={onSort}
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
                  rupture&quot; sur le dossier d&apos;un jeune. Si le problème persiste ou que vous souhaitez nous faire
                  part d&apos;une recommandation{" "}
                  <a href="https://cfas.apprentissage.beta.gouv.fr/contact" target="_blank" rel="noopener noreferrer">
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
            currentSort={currentSort}
            currentDir={order}
            onSort={onSort}
          />
        </th>
        <th className={sharedStyles.centerHeader}>
          <SortableHeader
            label="Date de rupture"
            sortKey="date_rupture"
            currentSort={currentSort}
            currentDir={order}
            onSort={onSort}
          />
        </th>
        <th className={sharedStyles.collabHeader}>
          <SortableHeader
            label="Collaboration avec la ML ?"
            sortKey="collab_status"
            currentSort={currentSort}
            currentDir={order}
            onSort={onSort}
          />
        </th>
      </tr>
    </thead>
  );

  const renderRow = (e: ICfaRuptureEffectif) => (
    <tr
      key={e.id}
      className={sharedStyles.clickableRow}
      onClick={() => router.push(`/cfa/${e.id}`)}
      onKeyDown={(event) => {
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
            <span className={notificationStyles.notificationDot} title="Nouvelle information de la Mission Locale" />
          )}
          <Link
            href={`/cfa/${e.id}`}
            className={sharedStyles.nameText}
            onClick={(event) => {
              event.stopPropagation();
              trackPlausibleEvent("cfa_liste_jeune_ouvert", undefined, { effectifId: e.id });
            }}
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
  );

  const renderTable = (rows: ICfaRuptureEffectif[], showHeader: boolean) => (
    <div className="fr-table">
      <table className={styles.fixedTable}>
        <colgroup>
          {COLUMN_WIDTHS.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>
        {showHeader && renderHeader()}
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );

  // Le tri backend place toujours is_transmis_auto en dernier : les deux groupes sont donc contigus.
  const rupturesClassiques = effectifs.filter((e) => !e.is_transmis_auto);
  const rupturesTransmisAuto = effectifs.filter((e) => e.is_transmis_auto);

  return (
    <>
      {rupturesClassiques.length > 0 && renderTable(rupturesClassiques, true)}
      {rupturesTransmisAuto.length > 0 && (
        <>
          <TransmisAutoBanner />
          {renderTable(rupturesTransmisAuto, rupturesClassiques.length === 0)}
        </>
      )}
    </>
  );
}
