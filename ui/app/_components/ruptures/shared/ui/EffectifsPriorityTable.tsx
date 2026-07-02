"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { SimpleTable } from "@/app/_components/table/SimpleTable";
import { useAuth } from "@/app/_context/UserContext";
import { getPriorityLabel, DEFAULT_ITEMS_TO_SHOW, matchesPostalCodes } from "@/app/_utils/ruptures.utils";
import { EffectifPriorityData } from "@/common/types/ruptures";

import { isMissionLocaleUser } from "../utils";
import { matchesSearchTerm } from "../utils/searchUtils";

import { CommuneCell } from "./CommuneCell";
import { EffectifPriorityBadgeMultiple, EffectifStatusBadge } from "./EffectifStatusBadge";
import styles from "./PriorityTable.module.css";

type EffectifsPriorityTableProps = {
  priorityData?: EffectifPriorityData[];
  searchTerm: string;
  hadEffectifsPrioritaires?: boolean;
  listType?: IMissionLocaleEffectifList;
  selectedPostalCodes?: string[];
};

function PriorityBadge({
  priorityData,
  listType,
}: {
  priorityData: EffectifPriorityData[];
  listType?: IMissionLocaleEffectifList;
}) {
  const label = listType ? getPriorityLabel(listType) : "À TRAITER EN PRIORITÉ";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
      <p className="fr-badge fr-badge--red" style={{ gap: "0.5rem" }}>
        <i className="fr-icon-fire-fill fr-icon--sm" /> {label} ({priorityData.length})
      </p>
    </div>
  );
}

// Wording partagé entre la vue ML (bloc dépliable) et la vue CFA, pour garantir un libellé identique.
const PRIORITY_LIST_ITEMS = (
  <>
    <li>
      <strong>
        CFA : les jeunes qui vous ont été adressés manuellement par un utilisateur du service dans un CFA ;
      </strong>
    </li>
    <li>
      <strong>
        SOUHAITE UN RDV : les jeunes qui ont répondu “Je souhaite un RDV avec la Mission Locale” à notre maraude
        numérique par message ;
      </strong>
    </li>
    <li>
      <strong>MINEUR : les jeunes en obligation de formation (16 à 18 ans)</strong>
    </li>
    <li>
      <strong>RQTH : les jeunes en situation de handicap</strong>
    </li>
  </>
);

export function EffectifsPriorityTable({
  priorityData = [],
  searchTerm,
  hadEffectifsPrioritaires = false,
  listType,
  selectedPostalCodes = [],
}: EffectifsPriorityTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const isCfaPage = pathname?.startsWith("/cfa");
  const mlId = params?.id as string | undefined;
  const [infoOpen, setInfoOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const PRIORITY_LIST_NAME = `${listType}_${API_EFFECTIF_LISTE.PRIORITAIRE}`;

  const columns = useMemo(() => {
    return [
      { label: "", dataKey: "name", width: 250 },
      { label: "", dataKey: "formation", width: "auto" },
      ...(isCfaPage ? [] : [{ label: "", dataKey: "commune", width: 120 }]),
      { label: "", dataKey: "badge", width: 230 },
      { label: "", dataKey: "arrow", width: 40 },
    ];
  }, [isCfaPage]);

  const isFiltering = !!searchTerm || selectedPostalCodes.length > 0;

  const filteredData = useMemo(
    () =>
      priorityData.filter(
        (effectif) =>
          (!searchTerm || matchesSearchTerm(effectif.nom, effectif.prenom, searchTerm)) &&
          matchesPostalCodes(effectif, selectedPostalCodes)
      ),
    [priorityData, searchTerm, selectedPostalCodes]
  );

  const hasMoreItems = filteredData.length > DEFAULT_ITEMS_TO_SHOW;
  const remainingItems = filteredData.length - DEFAULT_ITEMS_TO_SHOW;

  const dataToShow = isFiltering
    ? filteredData
    : isExpanded
      ? filteredData
      : filteredData.slice(0, DEFAULT_ITEMS_TO_SHOW);

  const tableData = useMemo(() => {
    return dataToShow.map((effectif) => {
      return {
        rawData: effectif,
        element: {
          id: effectif.id,
          badge: (
            <div style={{ display: "flex", alignItems: "end", width: "100%", justifyContent: "flex-end" }}>
              <EffectifStatusBadge effectif={effectif} />
            </div>
          ),
          name: (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <EffectifPriorityBadgeMultiple effectif={effectif} isHeader />
              <strong>{effectif.nom}</strong>
              <strong>{effectif.prenom}</strong>
            </div>
          ),
          formation: <span className="line-clamp-2">{effectif.libelle_formation}</span>,
          commune: <CommuneCell commune={effectif.commune} code_postal={effectif.code_postal} />,
          arrow: (
            <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
              <i className="fr-icon-arrow-right-line fr-icon--sm" />
            </div>
          ),
        },
      };
    });
  }, [dataToShow]);

  if (priorityData.length === 0 && !hadEffectifsPrioritaires) {
    return;
  }

  return (
    <div
      id={`priority-${listType}`}
      style={{
        padding: "16px",
        marginTop: "32px",
        background: "var(--background-alt-blue-france)",
      }}
      className={styles.priorityContainer}
    >
      {priorityData.length === 0 && hadEffectifsPrioritaires && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <PriorityBadge priorityData={priorityData} listType={listType} />
            <p style={{ fontWeight: "bold", margin: "0", fontSize: "14px" }}>
              Tous les jeunes de cette liste ont été contactés !
            </p>
          </div>
          <Image
            src="/images/mission-locale-valid-tick.svg"
            alt=""
            width={50}
            height={50}
            style={{
              width: "50px",
              height: "auto",
              userSelect: "none",
            }}
          />
        </div>
      )}

      {priorityData.length > 0 && (
        <div style={{ padding: "1rem" }}>
          <h3 style={{ color: "var(--text-title-blue-france)" }}>
            Dossiers à traiter en priorité ({filteredData.length})
          </h3>
          {isMissionLocaleUser(user.organisation.type) && (
            <div style={{ marginBottom: "16px" }}>
              <DsfrLink
                href="#"
                arrow="none"
                onClick={(e) => {
                  e.preventDefault();
                  setInfoOpen((open) => !open);
                }}
                className={`fr-link--icon-right ${infoOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
              >
                Qui sont les jeunes affichés dans cette liste ?
              </DsfrLink>

              {infoOpen && (
                <div style={{ marginTop: "12px", fontSize: "14px", lineHeight: "1.4" }}>
                  <p style={{ margin: "0 0 8px 0" }}>Nous affichons dans cette liste :</p>
                  <ul style={{ margin: "0 0 12px 20px", padding: "0" }}>{PRIORITY_LIST_ITEMS}</ul>
                </div>
              )}
            </div>
          )}
          {user.organisation.type !== "MISSION_LOCALE" && (
            <div style={{ margin: "0 0 16px 0", fontSize: "14px", lineHeight: "1.4" }}>
              <p style={{ margin: "0 0 8px 0" }}>Nous affichons dans cette liste :</p>
              <ul style={{ margin: "0 0 0 20px", padding: "0" }}>{PRIORITY_LIST_ITEMS}</ul>
            </div>
          )}
          <SimpleTable
            data={tableData}
            columns={columns}
            emptyMessage="Aucun élément prioritaire"
            getRowLink={(rowData) => {
              // Transmet le filtre villes à la fiche pour un précédent/suivant cohérent avec le filtre.
              const cpQuery = selectedPostalCodes.length > 0 ? `&cp=${selectedPostalCodes.join(",")}` : "";
              return user.organisation.type === "ADMINISTRATEUR" && mlId
                ? `/admin/mission-locale/${mlId}/edit/${rowData.id}/?nom_liste=${PRIORITY_LIST_NAME}${cpQuery}`
                : `/mission-locale/${rowData.id}?nom_liste=${PRIORITY_LIST_NAME}${cpQuery}`;
            }}
          />
          {hasMoreItems && !isFiltering && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
              <Button
                iconId={isExpanded ? "ri-subtract-line" : "ri-add-line"}
                iconPosition="right"
                priority="secondary"
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Réduire la liste" : `Afficher tous (${remainingItems} de plus)`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
