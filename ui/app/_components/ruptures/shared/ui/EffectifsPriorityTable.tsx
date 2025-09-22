"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { LightTable } from "@/app/_components/table/LightTable";
import { useAuth } from "@/app/_context/UserContext";
import { getPriorityLabel } from "@/app/_utils/ruptures.utils";
import { EffectifPriorityData } from "@/common/types/ruptures";

import { isMissionLocaleUser } from "../utils";

import { EffectifPriorityBadge } from "./EffectifStatusBadge";
import styles from "./PriorityTable.module.css";

type EffectifsPriorityTableProps = {
  priorityData?: EffectifPriorityData[];
  searchTerm: string;
  hadEffectifsPrioritaires?: boolean;
  listType?: IMissionLocaleEffectifList;
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

export function EffectifsPriorityTable({
  priorityData = [],
  searchTerm,
  hadEffectifsPrioritaires = false,
  listType,
}: EffectifsPriorityTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const mlId = params?.id as string | undefined;
  const [infoOpen, setInfoOpen] = useState(false);
  const PRIORITY_LIST_NAME = `${listType}_${API_EFFECTIF_LISTE.PRIORITAIRE}`;
  const columns = useMemo(() => {
    return [
      { label: "", dataKey: "name", width: 200 },
      { label: "", dataKey: "formation", width: "auto" },
      { label: "", dataKey: "badge", width: 250 },
      { label: "", dataKey: "arrow", width: 40 },
    ];
  }, []);

  const tableData = useMemo(() => {
    return priorityData.map((effectif) => {
      return {
        rawData: effectif,
        element: {
          id: effectif.id,
          badge: (
            <div style={{ display: "flex", alignItems: "end", width: "100%", justifyContent: "flex-end" }}>
              <EffectifPriorityBadge effectif={effectif} />
            </div>
          ),
          name: <strong>{`${effectif.nom} ${effectif.prenom}`}</strong>,
          formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
          arrow: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
        },
      };
    });
  }, [priorityData]);

  if (priorityData.length === 0 && !hadEffectifsPrioritaires) {
    return;
  }

  return (
    <div
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
        <>
          <PriorityBadge priorityData={priorityData} listType={listType} />
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
                  <ul style={{ margin: "0 0 12px 20px", padding: "0" }}>
                    <li>
                      <strong>les jeunes âgés de 16 à 18 ans (obligation de formation)</strong>
                    </li>
                    <li>
                      <strong>les jeunes en situation de handicap (RQTH)</strong>
                    </li>
                    <li>
                      <strong>les jeunes ayant exprimé un besoin d&apos;accompagnement (campagne mailing)</strong>
                    </li>
                    <li>
                      <strong>les jeunes en situation de rupture total dans moins d&apos;1 mois</strong>
                    </li>
                  </ul>
                  <p style={{ margin: "0 0 8px 0" }}>
                    Dans le cadre d&apos;une expérimentation avec les CFA, cette liste inclut également :
                  </p>
                  <ul style={{ margin: "0 0 0 20px", padding: "0" }}>
                    <li>
                      <strong>
                        les jeunes pour lesquels un CFA a formulé une demande d&apos;accompagnement conjoint avec la
                        Mission Locale
                      </strong>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
          {user.organisation.type !== "MISSION_LOCALE" && (
            <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
              Nous affichons dans cette liste <strong>les jeunes âgés de 16 à 18 ans</strong> (obligation de formation)
              ainsi que <strong>les jeunes en situation de handicap (RQTH)</strong> et les{" "}
              <strong>jeunes qui ont indiqué avoir besoin d&apos;être accompagnés par vos services</strong> (campagne
              mailing)..
            </p>
          )}
          <LightTable
            caption=""
            data={tableData}
            columns={columns}
            itemsPerPage={7}
            emptyMessage="Aucun élément prioritaire"
            searchTerm={searchTerm}
            searchableColumns={["nom", "prenom"]}
            getRowLink={(rowData) => {
              return user.organisation.type === "ADMINISTRATEUR" && mlId
                ? `/admin/mission-locale/${mlId}/edit/${rowData.id}/?nom_liste=${PRIORITY_LIST_NAME}`
                : `/mission-locale/${rowData.id}?nom_liste=${PRIORITY_LIST_NAME}`;
            }}
          />
        </>
      )}
    </div>
  );
}
